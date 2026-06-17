const router = require('express').Router();
const db = require('../database');

// For You Page feed
router.get('/foryou', (req, res) => {
  const userId = req.query.userId;
  const page = parseInt(req.query.page) || 0;
  const limit = 5;
  const offset = page * limit;

  const query = `
    SELECT v.*, u.username, u.display_name, u.avatar, u.verified,
    ${userId ? `(SELECT COUNT(*) FROM likes WHERE user_id = '${userId}' AND video_id = v.id) as is_liked,
    (SELECT COUNT(*) FROM follows WHERE follower_id = '${userId}' AND following_id = v.user_id) as is_following` : '0 as is_liked, 0 as is_following'}
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.is_private = 0
    ORDER BY (v.likes_count * 2 + v.views_count + v.comments_count * 3 + RANDOM() % 100) DESC
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

// Following feed
router.get('/following', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.json([]);

  const page = parseInt(req.query.page) || 0;
  const limit = 5;
  const offset = page * limit;

  const query = `
    SELECT v.*, u.username, u.display_name, u.avatar, u.verified,
    (SELECT COUNT(*) FROM likes WHERE user_id = '${userId}' AND video_id = v.id) as is_liked,
    1 as is_following
    FROM videos v
    JOIN users u ON v.user_id = u.id
    JOIN follows f ON f.following_id = v.user_id AND f.follower_id = '${userId}'
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
      is_following: true
    })));
  });
});

// Search videos
router.get('/search', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  db.all(
    `SELECT v.*, u.username, u.display_name, u.avatar FROM videos v JOIN users u ON v.user_id = u.id WHERE v.description LIKE ? OR v.tags LIKE ? AND v.is_private = 0 ORDER BY v.views_count DESC LIMIT 20`,
    [q, q], (err, rows) => {
      res.json(rows?.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })) || []);
    }
  );
});

module.exports = router;
