const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get user profile by ID (used internally e.g. for chat header)
router.get('/by-id/:id', (req, res) => {
  db.get(`SELECT id, username, display_name, avatar, verified FROM users WHERE id = ?`, [req.params.id], (err, user) => {
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// Get user profile
router.get('/:username', (req, res) => {
  const viewerId = req.query.viewerId;
  db.get(`SELECT id, username, display_name, bio, avatar, followers_count, following_count, likes_count, verified FROM users WHERE username = ?`,
    [req.params.username], (err, user) => {
      if (!user) return res.status(404).json({ error: 'User not found' });

      const checkFollow = viewerId
        ? new Promise(resolve => db.get(`SELECT * FROM follows WHERE follower_id = ? AND following_id = ?`, [viewerId, user.id], (e, row) => resolve(!!row)))
        : Promise.resolve(false);

      checkFollow.then(isFollowing => {
        db.all(`SELECT v.*, u.username, u.display_name, u.avatar FROM videos v JOIN users u ON v.user_id = u.id WHERE v.user_id = ? AND v.is_private = 0 ORDER BY v.created_at DESC`,
          [user.id], (err, videos) => {
            res.json({ ...user, is_following: isFollowing, videos: videos.map(v => ({ ...v, tags: JSON.parse(v.tags || '[]') })) });
          });
      });
    });
});

// Follow/Unfollow
router.post('/:id/follow', authMiddleware, (req, res) => {
  const followingId = req.params.id;
  if (followingId === req.user.id) return res.status(400).json({ error: "Can't follow yourself" });

  db.get(`SELECT * FROM follows WHERE follower_id = ? AND following_id = ?`, [req.user.id, followingId], (err, follow) => {
    if (follow) {
      db.run(`DELETE FROM follows WHERE follower_id = ? AND following_id = ?`, [req.user.id, followingId]);
      db.run(`UPDATE users SET followers_count = followers_count - 1 WHERE id = ?`, [followingId]);
      db.run(`UPDATE users SET following_count = following_count - 1 WHERE id = ?`, [req.user.id]);
      res.json({ following: false });
    } else {
      db.run(`INSERT INTO follows (id, follower_id, following_id) VALUES (?,?,?)`, [uuidv4(), req.user.id, followingId]);
      db.run(`UPDATE users SET followers_count = followers_count + 1 WHERE id = ?`, [followingId]);
      db.run(`UPDATE users SET following_count = following_count + 1 WHERE id = ?`, [req.user.id]);
      db.run(`INSERT INTO notifications (id, user_id, actor_id, type) VALUES (?,?,?,?)`, [uuidv4(), followingId, req.user.id, 'follow']);
      res.json({ following: true });
    }
  });
});

// Update profile
router.put('/me/update', authMiddleware, uploadAvatar.single('avatar'), (req, res) => {
  const { display_name, bio } = req.body;
  const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;

  const updates = [];
  const values = [];
  if (display_name) { updates.push('display_name = ?'); values.push(display_name); }
  if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
  if (avatarUrl) { updates.push('avatar = ?'); values.push(avatarUrl); }

  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.user.id);

  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT id, username, display_name, bio, avatar, followers_count, following_count, likes_count FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      res.json(user);
    });
  });
});

// Search users
router.get('/search/query', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  db.all(`SELECT id, username, display_name, avatar, followers_count, verified FROM users WHERE username LIKE ? OR display_name LIKE ? LIMIT 20`, [q, q], (err, rows) => {
    res.json(rows || []);
  });
});

// ===================== SETTINGS =====================

// Get full settings for current user
router.get('/me/settings', authMiddleware, (req, res) => {
  db.get(
    `SELECT id, username, email, display_name, bio, avatar, is_private, allow_comments, allow_messages, allow_duet, show_likes, language, theme, email_verified, google_id IS NOT NULL as has_google, password IS NOT NULL as has_password
     FROM users WHERE id = ?`,
    [req.user.id],
    (err, row) => res.json(row)
  );
});

// Update privacy & preference settings
router.put('/me/settings', authMiddleware, (req, res) => {
  const allowed = ['is_private', 'allow_comments', 'allow_messages', 'allow_duet', 'show_likes', 'language', 'theme'];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'Tidak ada yang diubah' });
  values.push(req.user.id);

  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// Change password
router.put('/me/password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter' });

  db.get(`SELECT password FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (user.password && !bcrypt.compareSync(currentPassword || '', user.password)) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }
    const hashed = bcrypt.hashSync(newPassword, 10);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashed, req.user.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    });
  });
});

// Change username
router.put('/me/username', authMiddleware, (req, res) => {
  const { username } = req.body;
  if (!username || !/^[a-z0-9_.]{2,24}$/.test(username)) {
    return res.status(400).json({ error: 'Username hanya boleh huruf kecil, angka, titik, underscore (2-24 karakter)' });
  }
  db.run(`UPDATE users SET username = ? WHERE id = ?`, [username, req.user.id], function(err) {
    if (err) return res.status(400).json({ error: 'Username sudah dipakai' });
    res.json({ ok: true, username });
  });
});

// Delete account
router.delete('/me', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.serialize(() => {
    db.run(`DELETE FROM videos WHERE user_id = ?`, [userId]);
    db.run(`DELETE FROM likes WHERE user_id = ?`, [userId]);
    db.run(`DELETE FROM comments WHERE user_id = ?`, [userId]);
    db.run(`DELETE FROM follows WHERE follower_id = ? OR following_id = ?`, [userId, userId]);
    db.run(`DELETE FROM notifications WHERE user_id = ? OR actor_id = ?`, [userId, userId]);
    db.run(`DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?`, [userId, userId]);
    db.run(`DELETE FROM blocked_users WHERE user_id = ? OR blocked_id = ?`, [userId, userId]);
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    });
  });
});

// Block / unblock user
router.post('/:id/block', authMiddleware, (req, res) => {
  const blockedId = req.params.id;
  db.get(`SELECT * FROM blocked_users WHERE user_id = ? AND blocked_id = ?`, [req.user.id, blockedId], (err, block) => {
    if (block) {
      db.run(`DELETE FROM blocked_users WHERE user_id = ? AND blocked_id = ?`, [req.user.id, blockedId]);
      res.json({ blocked: false });
    } else {
      db.run(`INSERT INTO blocked_users (id, user_id, blocked_id) VALUES (?,?,?)`, [uuidv4(), req.user.id, blockedId]);
      // Auto unfollow both ways
      db.run(`DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)`,
        [req.user.id, blockedId, blockedId, req.user.id]);
      res.json({ blocked: true });
    }
  });
});

// List blocked users
router.get('/me/blocked', authMiddleware, (req, res) => {
  db.all(
    `SELECT u.id, u.username, u.display_name, u.avatar FROM blocked_users b JOIN users u ON b.blocked_id = u.id WHERE b.user_id = ?`,
    [req.user.id],
    (err, rows) => res.json(rows || [])
  );
});

module.exports = router;

