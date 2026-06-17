const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

function getConversationId(userA, userB) {
  return [userA, userB].sort().join('_');
}

// List all conversations for current user
router.get('/conversations', (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT c.*,
      CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.read = 0) as unread_count
     FROM conversations c
     WHERE c.user1_id = ? OR c.user2_id = ?
     ORDER BY c.last_message_at DESC`,
    [userId, userId, userId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.json([]);

      const promises = rows.map(row => new Promise(resolve => {
        db.get(`SELECT id, username, display_name, avatar, verified FROM users WHERE id = ?`, [row.other_user_id], (e, user) => {
          resolve({ ...row, other_user: user });
        });
      }));

      Promise.all(promises).then(result => res.json(result));
    }
  );
});

// Get or create conversation with a specific user, then fetch messages
router.get('/conversations/with/:userId', (req, res) => {
  const myId = req.user.id;
  const otherId = req.params.userId;
  if (myId === otherId) return res.status(400).json({ error: 'Tidak bisa chat dengan diri sendiri' });

  const convId = getConversationId(myId, otherId);
  const [user1_id, user2_id] = [myId, otherId].sort();

  db.run(
    `INSERT OR IGNORE INTO conversations (id, user1_id, user2_id) VALUES (?,?,?)`,
    [convId, user1_id, user2_id],
    function() {
      db.all(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`, [convId], (err, messages) => {
        if (err) return res.status(500).json({ error: err.message });
        // Mark as read
        db.run(`UPDATE messages SET read = 1 WHERE conversation_id = ? AND sender_id != ?`, [convId, myId]);
        res.json({ conversationId: convId, messages });
      });
    }
  );
});

// Send message
router.post('/conversations/with/:userId', (req, res) => {
  const myId = req.user.id;
  const otherId = req.params.userId;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Pesan tidak boleh kosong' });

  const convId = getConversationId(myId, otherId);
  const [user1_id, user2_id] = [myId, otherId].sort();

  db.run(`INSERT OR IGNORE INTO conversations (id, user1_id, user2_id) VALUES (?,?,?)`, [convId, user1_id, user2_id], function() {
    const msgId = uuidv4();
    db.run(
      `INSERT INTO messages (id, conversation_id, sender_id, text) VALUES (?,?,?,?)`,
      [msgId, convId, myId, text.trim()],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run(`UPDATE conversations SET last_message = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?`, [text.trim(), convId]);

        // Create notification for recipient
        db.run(`INSERT INTO notifications (id, user_id, actor_id, type) VALUES (?,?,?,?)`, [uuidv4(), otherId, myId, 'message']);

        db.get(`SELECT * FROM messages WHERE id = ?`, [msgId], (e, msg) => res.json(msg));
      }
    );
  });
});

// Unread message count (for badge)
router.get('/unread-count', (req, res) => {
  const userId = req.user.id;
  db.get(
    `SELECT COUNT(*) as count FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.user1_id = ? OR c.user2_id = ?) AND m.sender_id != ? AND m.read = 0`,
    [userId, userId, userId],
    (err, row) => res.json({ count: row?.count || 0 })
  );
});

module.exports = router;
