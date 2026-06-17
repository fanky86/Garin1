const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const db = require('../database');
const { generateOTP, sendOTPEmail } = require('../services/email');

const JWT_SECRET = process.env.JWT_SECRET || 'tiktok_clone_secret_key_2024';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

function publicUser(user) {
  if (!user) return null;
  const { password, google_id, ...rest } = user;
  return rest;
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

function generateUsername(base) {
  const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) || 'user';
  return `${clean}${Math.floor(Math.random() * 9000 + 1000)}`;
}

// ===================== PASSWORD REGISTER/LOGIN =====================

router.post('/register', async (req, res) => {
  const { username, email, password, display_name } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Semua field wajib diisi' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();

  db.run(
    `INSERT INTO users (id, username, email, password, display_name) VALUES (?,?,?,?,?)`,
    [id, username, email, hashedPassword, display_name || username],
    function(err) {
      if (err) return res.status(400).json({ error: 'Username atau email sudah dipakai' });
      const token = signToken({ id, username });
      res.json({ token, user: { id, username, display_name: display_name || username, avatar: '', bio: '', followers_count: 0, following_count: 0, likes_count: 0 } });
    }
  );
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ? OR username = ?`, [email, email], (err, user) => {
    if (!user) return res.status(400).json({ error: 'Akun tidak ditemukan' });
    if (!user.password) return res.status(400).json({ error: 'Akun ini login dengan Google atau OTP. Gunakan metode tersebut.' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'Password salah' });
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  });
});

// ===================== EMAIL OTP LOGIN =====================

// Step 1: kirim kode OTP ke email
router.post('/otp/send', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email tidak valid' });
  }

  const code = generateOTP();
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Invalidate previous unused OTP for this email
  db.run(`UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0`, [email]);

  db.run(`INSERT INTO otp_codes (id, email, code, purpose, expires_at) VALUES (?,?,?,?,?)`,
    [id, email, code, 'login', expiresAt], async function(err) {
      if (err) return res.status(500).json({ error: err.message });
      try {
        const result = await sendOTPEmail(email, code, 'login');
        res.json({
          message: 'Kode OTP telah dikirim ke email Anda',
          devCode: result.devMode ? code : undefined // hanya tampil kalau SMTP belum disetup
        });
      } catch (e) {
        res.status(500).json({ error: 'Gagal mengirim email: ' + e.message });
      }
    }
  );
});

// Step 2: verifikasi kode OTP -> login atau buat akun baru otomatis
router.post('/otp/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email dan kode wajib diisi' });

  db.get(
    `SELECT * FROM otp_codes WHERE email = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`,
    [email, code],
    (err, otp) => {
      if (!otp) return res.status(400).json({ error: 'Kode OTP salah' });
      if (new Date(otp.expires_at) < new Date()) return res.status(400).json({ error: 'Kode OTP sudah expired, minta kode baru' });

      db.run(`UPDATE otp_codes SET used = 1 WHERE id = ?`, [otp.id]);

      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (user) {
          // User sudah ada -> login & tandai verified
          db.run(`UPDATE users SET email_verified = 1 WHERE id = ?`, [user.id]);
          const token = signToken(user);
          return res.json({ token, user: publicUser(user), isNewUser: false });
        }

        // User belum ada -> buat akun baru otomatis
        const id = uuidv4();
        const username = generateUsername(email.split('@')[0]);
        db.run(
          `INSERT INTO users (id, username, email, display_name, email_verified) VALUES (?,?,?,?,1)`,
          [id, username, email, email.split('@')[0]],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const newUser = { id, username, email, display_name: email.split('@')[0], avatar: '', bio: '', followers_count: 0, following_count: 0, likes_count: 0 };
            const token = signToken(newUser);
            res.json({ token, user: newUser, isNewUser: true });
          }
        );
      });
    }
  );
});

// ===================== GOOGLE LOGIN =====================

router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Credential Google tidak ada' });
  if (!googleClient) return res.status(500).json({ error: 'Google Login belum dikonfigurasi di server (GOOGLE_CLIENT_ID kosong)' });

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    db.get(`SELECT * FROM users WHERE google_id = ? OR email = ?`, [googleId, email], (err, user) => {
      if (user) {
        if (!user.google_id) db.run(`UPDATE users SET google_id = ?, email_verified = 1 WHERE id = ?`, [googleId, user.id]);
        const token = signToken(user);
        return res.json({ token, user: publicUser(user), isNewUser: false });
      }

      const id = uuidv4();
      const username = generateUsername(name || email.split('@')[0]);
      db.run(
        `INSERT INTO users (id, username, email, google_id, display_name, avatar, email_verified) VALUES (?,?,?,?,?,?,1)`,
        [id, username, email, googleId, name || username, picture || ''],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          const newUser = { id, username, email, display_name: name || username, avatar: picture || '', bio: '', followers_count: 0, following_count: 0, likes_count: 0 };
          const token = signToken(newUser);
          res.json({ token, user: newUser, isNewUser: true });
        }
      );
    });
  } catch (e) {
    res.status(400).json({ error: 'Token Google tidak valid: ' + e.message });
  }
});

// ===================== ME =====================

router.get('/me', require('../middleware/auth'), (req, res) => {
  db.get(`SELECT id, username, email, display_name, bio, avatar, followers_count, following_count, likes_count, verified, is_private, allow_comments, allow_messages, allow_duet, show_likes, language, theme, email_verified FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  });
});

module.exports = router;
