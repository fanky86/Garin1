const nodemailer = require('nodemailer');

// Konfigurasi SMTP - isi di file .env
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️  SMTP belum dikonfigurasi. OTP akan ditampilkan di console server saja.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, code, purpose = 'login') {
  const subject = purpose === 'register' ? 'Verifikasi Email Anda' : 'Kode Login Anda';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #fe2c55; font-size: 24px;">TikTok Clone</h1>
      <p style="font-size: 16px; color: #333;">Kode verifikasi Anda adalah:</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #161823;">${code}</span>
      </div>
      <p style="font-size: 14px; color: #888;">Kode ini berlaku selama 10 menit. Jangan bagikan kode ini ke siapapun.</p>
    </div>
  `;

  const t = getTransporter();
  if (!t) {
    // Fallback: tampilkan di console (development mode tanpa SMTP)
    console.log(`\n📧 [DEV MODE] OTP untuk ${email}: ${code}\n`);
    return { devMode: true, code };
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    html
  });
  return { devMode: false };
}

module.exports = { generateOTP, sendOTPEmail };
