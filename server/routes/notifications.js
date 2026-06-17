const router = require('express').Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all notifications (likes, comments, follows) for current user
router.get('/', (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT n.*, u.username as actor_username, u.display_name as actor_display_name, u.avatar as actor_avatar, u.verified as actor_verified,
      v.video_url, v.thumbnail_url, v.description as video_description
     FROM notifications n
     JOIN users u ON n.actor_id = u.id
     LEFT JOIN videos v ON n.video_id = v.id
     WHERE n.user_id = ? AND n.type != 'message'
     ORDER BY n.created_at DESC
     LIMIT 100`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Mark all as read
router.post('/read-all', (req, res) => {
  db.run(`UPDATE notifications SET read = 1 WHERE user_id = ?`, [req.user.id], () => res.json({ ok: true }));
});

// Unread notification count
router.get('/unread-count', (req, res) => {
  db.get(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0 AND type != 'message'`, [req.user.id], (err, row) => {
    res.json({ count: row?.count || 0 });
  });
});

module.exports = router;
