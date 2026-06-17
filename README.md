# 🎵 TikTok Clone - Full Stack (v2)

Platform video pendek mirip TikTok, dibangun dengan React + Node.js + SQLite.
Sudah mendukung **login Google & Email OTP**, **Inbox/Chat real**, **Pengaturan & Edit Profil lengkap**, dan **tampilan responsif di semua device** (HP, tablet, browser desktop).

## 🌐 URL
- Production: `https://garin.fankynas.cloud`
- Development: `http://localhost:3000` (client) + `http://localhost:5017` (server)

---

## ✨ Yang Baru di Versi Ini

| Fitur | Detail |
|---|---|
| 🔐 Login Google | OAuth asli via Google Identity Services |
| 📧 Login Email OTP | Kirim kode 6 digit ke email, tanpa perlu password |
| 💬 Inbox berfungsi | Tab **Aktivitas** (like/komen/follow notif) + Tab **Pesan** (chat 1-on-1 real) |
| 🗨️ Chat real-time-ish | Polling tiap 3 detik, badge unread di nav |
| ⚙️ Settings lengkap | Privasi akun, siapa boleh komentar/DM/duet, ganti password, ganti username, blokir akun, hapus akun |
| 👤 Edit Profile lengkap | Ganti nama, username, bio, foto profil — semua tersimpan ke server |
| 📱 Responsif total | Sidebar di desktop, video terpusat di tablet/desktop, bottom-nav di HP, aman untuk notch/safe-area |

---

## 📁 Struktur Folder

```
tiktok-clone/
├── server/
│   ├── index.js
│   ├── database.js          # Skema lengkap: users, videos, likes, comments,
│   │                         # follows, otp_codes, conversations, messages,
│   │                         # notifications, blocked_users
│   ├── services/
│   │   └── email.js         # Kirim OTP via SMTP (fallback ke console jika belum disetup)
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js           # Register/Login password, OTP email, Google OAuth
│   │   ├── videos.js
│   │   ├── users.js          # Profil, follow, settings, password, block, hapus akun
│   │   ├── comments.js
│   │   ├── feed.js
│   │   ├── messages.js       # Chat 1-on-1
│   │   └── notifications.js  # Aktivitas like/komen/follow
│   ├── .env.example          # Contoh konfigurasi SMTP & Google
│   └── uploads/
│
├── client/
│   ├── .env.development      # API URL untuk dev
│   ├── .env.production       # API URL untuk production (garin.fankynas.cloud)
│   ├── src/
│   │   ├── App.js            # Routing + sidebar/bottom-nav switch otomatis
│   │   ├── App.css           # Semua responsive breakpoints di sini
│   │   ├── context/AuthContext.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js      # 3 metode: Google, Email OTP, Password
│   │   │   ├── Profile.js
│   │   │   ├── EditProfile.js   # BARU
│   │   │   ├── Settings.js      # BARU
│   │   │   ├── Inbox.js         # BARU
│   │   │   ├── Chat.js          # BARU
│   │   │   ├── Upload.js
│   │   │   └── Search.js
│   │   └── components/
│   │       ├── VideoCard.js
│   │       ├── CommentsSheet.js
│   │       └── BottomNav.js     # jadi sidebar otomatis di layar >= 1024px
│   └── public/
│
├── setup.sh
├── deploy.sh
└── nginx.conf
```

---

## 🚀 Cara Install & Jalankan

### 1. Install dependencies
```bash
chmod +x setup.sh
./setup.sh
```

### 2. ⚠️ WAJIB: Konfigurasi server (`server/.env`)

Copy contoh env lalu isi:
```bash
cd server
cp .env.example .env
nano .env   # atau editor lain
```

Isi minimal:
```env
JWT_SECRET=ganti_dengan_string_acak_yang_panjang
PORT=5017
```

**Email OTP** (opsional tapi disarankan — kalau tidak diisi, kode OTP akan tampil di console server / dikirim balik ke browser saat development):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=emailkamu@gmail.com
SMTP_PASS=app_password_16_digit   # buat di https://myaccount.google.com/apppasswords
SMTP_FROM=emailkamu@gmail.com
```

**Google Login** (opsional — tanpa ini tombol Google akan nonaktif otomatis):
1. Buka https://console.cloud.google.com/apis/credentials
2. Buat **OAuth 2.0 Client ID** tipe **Web application**
3. Authorized JavaScript origins: `https://garin.fankynas.cloud` (dan `http://localhost:3000` untuk dev)
4. Copy Client ID ke `server/.env`:
```env
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
```
5. Copy **Client ID yang SAMA** ke `client/.env.development` dan `client/.env.production`:
```env
REACT_APP_GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
```

### 3. Jalankan Development

**Terminal 1 - Server:**
```bash
cd server
npm start
```

**Terminal 2 - Client:**
```bash
cd client
npm start
```

Buka `http://localhost:3000` di browser HP, tablet, atau desktop — tampilan otomatis menyesuaikan.

---

## 🌐 Deploy ke Production (garin.fankynas.cloud)

### Step 1: Pastikan `client/.env.production` sudah benar
```env
REACT_APP_API_URL=https://garin.fankynas.cloud
REACT_APP_GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
```

### Step 2: Build & jalankan
```bash
cd client && npm run build && cd ..
cd server && node index.js
```

### Step 3: Nginx reverse proxy + SSL
```bash
sudo cp nginx.conf /etc/nginx/sites-available/tiktok
sudo ln -s /etc/nginx/sites-available/tiktok /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d garin.fankynas.cloud
```

### Step 4: PM2 supaya server tetap jalan
```bash
npm install -g pm2
cd server
pm2 start index.js --name tiktok-clone
pm2 startup && pm2 save
```

---

## ✨ Daftar Fitur Lengkap

| Fitur | Status |
|---|---|
| Login Password | ✅ |
| Login Email OTP (6 digit) | ✅ |
| Login Google OAuth | ✅ |
| Auto-buat akun saat OTP/Google pertama kali | ✅ |
| For You Page & Following Feed | ✅ |
| Upload Video | ✅ |
| Like / Unlike + animasi double-tap | ✅ |
| Komentar | ✅ |
| Follow / Unfollow | ✅ |
| **Inbox: Tab Aktivitas** (like, komen, follow) | ✅ |
| **Inbox: Tab Pesan + Chat 1-on-1** | ✅ |
| Badge unread di Inbox nav | ✅ |
| **Settings**: privasi akun, siapa boleh komentar/DM/duet | ✅ |
| **Settings**: ganti password / buat password | ✅ |
| **Settings**: ganti username | ✅ |
| **Settings**: blokir / buka blokir akun | ✅ |
| **Settings**: hapus akun permanen | ✅ |
| **Edit Profile**: nama, username, bio, foto | ✅ |
| Search Akun & Video | ✅ |
| Scroll Snap ala TikTok | ✅ |
| **Responsif**: bottom-nav di HP, sidebar di desktop (≥1024px) | ✅ |
| **Responsif**: video terpusat (seperti TikTok.com) di tablet/desktop | ✅ |
| **Responsif**: aman untuk notch/safe-area iPhone | ✅ |
| Mute/Unmute, Progress bar, Share, View count | ✅ |

---

## 🔑 Demo Account (Login Password)
```
Email: garin@demo.com
Password: demo123
```

---

## 📱 API Endpoints (Tambahan Baru)

### Auth
- `POST /api/auth/otp/send` — kirim kode OTP ke email
- `POST /api/auth/otp/verify` — verifikasi kode, login/buat akun otomatis
- `POST /api/auth/google` — login dengan Google ID token

### Messages (Chat)
- `GET /api/messages/conversations` — daftar percakapan
- `GET /api/messages/conversations/with/:userId` — riwayat chat dengan user tertentu
- `POST /api/messages/conversations/with/:userId` — kirim pesan
- `GET /api/messages/unread-count` — jumlah pesan belum dibaca

### Notifications
- `GET /api/notifications` — daftar aktivitas (like/komen/follow)
- `POST /api/notifications/read-all` — tandai semua terbaca
- `GET /api/notifications/unread-count`

### Users — Settings
- `GET /api/users/me/settings` — ambil semua setting akun
- `PUT /api/users/me/settings` — update privasi/preferensi
- `PUT /api/users/me/password` — ganti password
- `PUT /api/users/me/username` — ganti username
- `DELETE /api/users/me` — hapus akun permanen
- `POST /api/users/:id/block` — blokir/buka blokir
- `GET /api/users/me/blocked` — daftar akun yang diblokir

---

## 🛠️ Catatan Teknis

- **OTP tanpa SMTP**: jika `SMTP_HOST` belum diisi di `server/.env`, kode OTP akan ditampilkan langsung di response (mode development) dan di console server — supaya tetap bisa dites tanpa setup email dulu.
- **Google Login tanpa Client ID**: tombol Google otomatis berubah jadi info "belum dikonfigurasi" — tidak akan error/crash.
- **Tampilan responsif**: di lebar layar ≥1024px, navigasi bawah otomatis berubah jadi sidebar kiri (seperti tiktok.com versi desktop), dan video feed otomatis terpusat dengan lebar maksimal supaya tidak melar penuh layar.
