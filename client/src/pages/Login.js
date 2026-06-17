import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CONFIGURED = !!process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function Login() {
  const navigate = useNavigate();
  const { login, register, sendOtp, verifyOtp, loginWithGoogle } = useAuth();

  // method: 'password' | 'otp'
  const [method, setMethod] = useState('otp');
  const [mode, setMode] = useState('login'); // for password method: 'login' | 'register'
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'code'

  const [form, setForm] = useState({ username: '', email: '', password: '', code: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(280);
  const googleWrapRef = useRef(null);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Measure available width so the Google button never overflows on small screens
  useEffect(() => {
    const measure = () => {
      if (googleWrapRef.current) {
        const w = Math.floor(googleWrapRef.current.getBoundingClientRect().width);
        setGoogleBtnWidth(Math.max(200, Math.min(280, w)));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ===== Password login/register =====
  const submitPassword = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.username || !form.email || !form.password) throw new Error('Semua field wajib diisi');
        await register(form.username, form.email, form.password);
      }
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Terjadi kesalahan');
    }
    setLoading(false);
  };

  // ===== OTP flow =====
  const handleSendOtp = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Masukkan email yang valid'); return; }
    setLoading(true);
    try {
      const r = await sendOtp(form.email);
      setOtpStep('code');
      setResendTimer(60);
      setInfo(r.devCode ? `Mode dev: kode OTP kamu adalah ${r.devCode} (SMTP belum disetup di server)` : 'Kode OTP telah dikirim ke email kamu');
    } catch (e) {
      setError(e.response?.data?.error || 'Gagal mengirim kode OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (form.code.length !== 6) { setError('Masukkan 6 digit kode OTP'); return; }
    setLoading(true);
    try {
      await verifyOtp(form.email, form.code);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Kode OTP salah');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Login Google gagal');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 6 }}>🎵</div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: '#fe2c55' }}>Tik</span>Tok
        </h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 6 }}>Share your world</p>
      </div>

      {/* Card */}
      <div className="login-card">
        {/* Method tabs */}
        <div style={{ display: 'flex', marginBottom: 20, background: '#2a2a2a', borderRadius: 10, padding: 4 }}>
          <button onClick={() => { setMethod('otp'); setError(''); setOtpStep('email'); }}
            style={{ flex: 1, padding: '8px', borderRadius: 8, background: method === 'otp' ? '#fe2c55' : 'transparent', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none' }}>
            Email OTP
          </button>
          <button onClick={() => { setMethod('password'); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: 8, background: method === 'password' ? '#fe2c55' : 'transparent', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none' }}>
            Password
          </button>
        </div>

        {/* ===== GOOGLE LOGIN ===== */}
        <div ref={googleWrapRef} style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', width: '100%' }}>
          {GOOGLE_CONFIGURED ? (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Login Google gagal')}
              theme="filled_black"
              shape="pill"
              width={String(googleBtnWidth)}
            />
          ) : (
            <div style={{ width: '100%', maxWidth: 280, textAlign: 'center', padding: '10px 14px', background: '#262626', borderRadius: 20, color: '#777', fontSize: 13 }}>
              Login Google belum dikonfigurasi server
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#333' }} />
          <span style={{ color: '#666', fontSize: 12 }}>atau</span>
          <div style={{ flex: 1, height: 1, background: '#333' }} />
        </div>

        {/* ===== EMAIL OTP METHOD ===== */}
        {method === 'otp' && (
          <>
            {otpStep === 'email' ? (
              <>
                <label className="login-label">EMAIL</label>
                <input
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  type="email"
                  placeholder="email@example.com"
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  className="login-input"
                />
                {error && <div className="login-error">{error}</div>}
                <button onClick={handleSendOtp} disabled={loading} className="login-btn">
                  {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
                </button>
              </>
            ) : (
              <>
                <p style={{ color: '#aaa', fontSize: 13, marginBottom: 14 }}>
                  Kode dikirim ke <strong style={{ color: '#fff' }}>{form.email}</strong>
                </p>
                <label className="login-label">KODE OTP (6 DIGIT)</label>
                <input
                  value={form.code}
                  onChange={e => update('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  className="login-input"
                  style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                  autoFocus
                />
                {info && <div className="login-info">{info}</div>}
                {error && <div className="login-error">{error}</div>}
                <button onClick={handleVerifyOtp} disabled={loading} className="login-btn">
                  {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={resendTimer > 0 || loading}
                  style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: resendTimer > 0 ? '#555' : '#fe2c55', fontSize: 13, fontWeight: 600, cursor: resendTimer > 0 ? 'default' : 'pointer', padding: 8 }}>
                  {resendTimer > 0 ? `Kirim ulang dalam ${resendTimer}s` : 'Kirim ulang kode'}
                </button>
                <button onClick={() => { setOtpStep('email'); setForm(f => ({ ...f, code: '' })); setError(''); }}
                  style={{ width: '100%', background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                  ← Ganti email
                </button>
              </>
            )}
          </>
        )}

        {/* ===== PASSWORD METHOD ===== */}
        {method === 'password' && (
          <>
            <div style={{ display: 'flex', marginBottom: 16, gap: 16 }}>
              <button onClick={() => { setMode('login'); setError(''); }}
                style={{ color: mode === 'login' ? '#fff' : '#666', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', borderBottom: mode === 'login' ? '2px solid #fe2c55' : 'none', paddingBottom: 4 }}>
                Masuk
              </button>
              <button onClick={() => { setMode('register'); setError(''); }}
                style={{ color: mode === 'register' ? '#fff' : '#666', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', borderBottom: mode === 'register' ? '2px solid #fe2c55' : 'none', paddingBottom: 4 }}>
                Daftar
              </button>
            </div>

            {mode === 'register' && (
              <>
                <label className="login-label">USERNAME</label>
                <input value={form.username} onChange={e => update('username', e.target.value)} placeholder="yourname123" className="login-input" />
              </>
            )}

            <label className="login-label">EMAIL / USERNAME</label>
            <input value={form.email} onChange={e => update('email', e.target.value)} type="email" placeholder="email@example.com" className="login-input" />

            <label className="login-label">PASSWORD</label>
            <input
              value={form.password}
              onChange={e => update('password', e.target.value)}
              type="password"
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && submitPassword()}
              className="login-input"
            />

            {error && <div className="login-error">{error}</div>}

            <button onClick={submitPassword} disabled={loading} className="login-btn">
              {loading ? 'Memuat...' : mode === 'login' ? 'Masuk' : 'Buat Akun'}
            </button>

            {mode === 'login' && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#2a2a2a', borderRadius: 10 }}>
                <p style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Demo Account:</p>
                <p style={{ color: '#ccc', fontSize: 12 }}>Email: <strong>garin@demo.com</strong> · Password: <strong>demo123</strong></p>
              </div>
            )}
          </>
        )}
      </div>

      <button onClick={() => navigate('/')} className="login-skip">
        Lanjutkan tanpa akun
      </button>
    </div>
  );
}
