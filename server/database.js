const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'tiktok.db'), (err) => {
  if (err) console.error('DB Error:', err);
  else console.log('✅ Database connected');
});

db.serialize(() => {
  db.run(`PRAGMA journal_mode=WAL`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    google_id TEXT,
    display_name TEXT,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0,
    is_private INTEGER DEFAULT 0,
    email_verified INTEGER DEFAULT 0,
    allow_comments TEXT DEFAULT 'everyone',
    allow_messages TEXT DEFAULT 'everyone',
    allow_duet TEXT DEFAULT 'everyone',
    show_likes INTEGER DEFAULT 1,
    language TEXT DEFAULT 'id',
    theme TEXT DEFAULT 'dark',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    video_url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    duration REAL DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    music TEXT DEFAULT 'Original Sound',
    tags TEXT DEFAULT '[]',
    is_private INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    video_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    video_id TEXT NOT NULL,
    text TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (video_id) REFERENCES videos(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comment_likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    comment_id TEXT NOT NULL,
    UNIQUE(user_id, comment_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT DEFAULT 'login',
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    last_message TEXT DEFAULT '',
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    type TEXT NOT NULL,
    video_id TEXT,
    comment_text TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS blocked_users (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, blocked_id)
  )`);

  // Seed demo data
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');

  db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
    if (row && row.count === 0) {
      const demoUsers = [
        { id: uuidv4(), username: 'garin_official', email: 'garin@demo.com', display_name: 'Garin 🔥', bio: 'Content Creator | Jakarta 🇮🇩', followers_count: 125000, likes_count: 890000 },
        { id: uuidv4(), username: 'siti_dance', email: 'siti@demo.com', display_name: 'Siti Dance 💃', bio: 'Dance & Lifestyle | Surabaya', followers_count: 45000, likes_count: 230000 },
        { id: uuidv4(), username: 'budi_comedy', email: 'budi@demo.com', display_name: 'Budi Komedi 😂', bio: 'Bikin ketawa setiap hari', followers_count: 89000, likes_count: 560000 },
      ];

      const password = bcrypt.hashSync('demo123', 10);
      const stmt = db.prepare(`INSERT INTO users (id, username, email, password, display_name, bio, followers_count, likes_count, email_verified) VALUES (?,?,?,?,?,?,?,?,1)`);
      demoUsers.forEach(u => {
        stmt.run(u.id, u.username, u.email, password, u.display_name, u.bio, u.followers_count, u.likes_count);
      });
      stmt.finalize();
      console.log('✅ Demo users seeded');
    }
  });
});

module.exports = db;
