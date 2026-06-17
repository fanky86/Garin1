const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') cb(null, 'uploads/videos/');
    else cb(null, 'uploads/thumbnails/');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (!file.mimetype.startsWith('video/')) return cb(new Error('Only video files'));
    }
    cb(null, true);
  }
});

// Get feed videos
router.get('/', (req, res) => {
  const userId = req.query.userId || null;
  const page = parseInt(req.query.page) || 0;
  const limit = 10;
  const offset = page * limit;

  const query = `
    SELECT v.*, u.username, u.display_name, u.avatar, u.verified,
    ${userId ? `(SELECT COUNT(*) FROM likes WHERE user_id = '${userId}' AND video_id = v.id) as is_liked,
    (SELECT COUNT(*) FROM follows WHERE follower_id = '${userId}' AND following_id = v.user_id) as is_following` : '0 as is_liked, 0 as is_following'}
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.is_private = 0
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      is_liked: r.is_liked === 1,
      is_following: r.is_following === 1
    })));
  });
});

// Upload video
router.post('/upload', authMiddleware, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), (req, res) => {
  if (!req.files?.video) return res.status(400).json({ error: 'No video file' });

  const { description, music, tags } = req.body;
  const id = uuidv4();
  const videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
  const thumbnailUrl = req.files.thumbnail ? `/uploads/thumbnails/${req.files.thumbnail[0].filename}` : '';

  db.run(
    `INSERT INTO videos (id, user_id, description, video_url, thumbnail_url, music, tags) VALUES (?,?,?,?,?,?,?)`,
    [id, req.user.id, description || '', videoUrl, thumbnailUrl, music || 'Original Sound', tags || '[]'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, videoUrl, message: 'Video uploaded!' });
    }
  );
});

// Like/Unlike
router.post('/:id/like', authMiddleware, (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM likes WHERE user_id = ? AND video_id = ?`, [req.user.id, id], (err, like) => {
    if (like) {
      db.run(`DELETE FROM likes WHERE user_id = ? AND video_id = ?`, [req.user.id, id]);
      db.run(`UPDATE videos SET likes_count = likes_count - 1 WHERE id = ?`, [id]);
      res.json({ liked: false });
    } else {
      db.run(`INSERT INTO likes (id, user_id, video_id) VALUES (?,?,?)`, [uuidv4(), req.user.id, id]);
      db.run(`UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?`, [id]);

      // Notify video owner
      db.get(`SELECT user_id FROM videos WHERE id = ?`, [id], (e, video) => {
        if (video && video.user_id !== req.user.id) {
          db.run(`INSERT INTO notifications (id, user_id, actor_id, type, video_id) VALUES (?,?,?,?,?)`,
            [uuidv4(), video.user_id, req.user.id, 'like', id]);
        }
      });
      res.json({ liked: true });
    }
  });
});

// View count
router.post('/:id/view', (req, res) => {
  db.run(`UPDATE videos SET views_count = views_count + 1 WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
});

// Get single video
router.get('/:id', (req, res) => {
  db.get(
    `SELECT v.*, u.username, u.display_name, u.avatar, u.verified FROM videos v JOIN users u ON v.user_id = u.id WHERE v.id = ?`,
    [req.params.id],
    (err, row) => {
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json({ ...row, tags: JSON.parse(row.tags || '[]') });
    }
  );
});

// Delete video
router.delete('/:id', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM videos WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err, video) => {
    if (!video) return res.status(403).json({ error: 'Not authorized' });
    db.run(`DELETE FROM videos WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  });
});

// Share count
router.post('/:id/share', (req, res) => {
  db.run(`UPDATE videos SET shares_count = shares_count + 1 WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
