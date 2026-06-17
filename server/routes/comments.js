const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// Get comments
router.get('/:videoId', (req, res) => {
  db.all(
    `SELECT c.*, u.username, u.display_name, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.video_id = ? ORDER BY c.created_at DESC`,
    [req.params.videoId], (err, rows) => {
      res.json(rows || []);
    }
  );
});

// Post comment
router.post('/:videoId', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Empty comment' });

  const id = uuidv4();
  db.run(`INSERT INTO comments (id, user_id, video_id, text) VALUES (?,?,?,?)`,
    [id, req.user.id, req.params.videoId, text.trim()], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.run(`UPDATE videos SET comments_count = comments_count + 1 WHERE id = ?`, [req.params.videoId]);

      // Notify video owner
      db.get(`SELECT user_id FROM videos WHERE id = ?`, [req.params.videoId], (e, video) => {
        if (video && video.user_id !== req.user.id) {
          db.run(`INSERT INTO notifications (id, user_id, actor_id, type, video_id, comment_text) VALUES (?,?,?,?,?,?)`,
            [uuidv4(), video.user_id, req.user.id, 'comment', req.params.videoId, text.trim()]);
        }
      });

      db.get(`SELECT c.*, u.username, u.display_name, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`, [id], (e, row) => {
        res.json(row);
      });
    }
  );
});

// Like comment
router.post('/like/:commentId', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM comment_likes WHERE user_id = ? AND comment_id = ?`, [req.user.id, req.params.commentId], (err, like) => {
    if (like) {
      db.run(`DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?`, [req.user.id, req.params.commentId]);
      db.run(`UPDATE comments SET likes_count = likes_count - 1 WHERE id = ?`, [req.params.commentId]);
      res.json({ liked: false });
    } else {
      db.run(`INSERT INTO comment_likes (id, user_id, comment_id) VALUES (?,?,?)`, [uuidv4(), req.user.id, req.params.commentId]);
      db.run(`UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?`, [req.params.commentId]);
      res.json({ liked: true });
    }
  });
});

// Delete comment
router.delete('/:commentId', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM comments WHERE id = ? AND user_id = ?`, [req.params.commentId, req.user.id], (err, comment) => {
    if (!comment) return res.status(403).json({ error: 'Not authorized' });
    db.run(`DELETE FROM comments WHERE id = ?`, [req.params.commentId]);
    db.run(`UPDATE videos SET comments_count = comments_count - 1 WHERE id = ?`, [comment.video_id]);
    res.json({ ok: true });
  });
});

module.exports = router;
