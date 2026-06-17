import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null); // null | 'password' | 'blocked' | 'delete'

  useEffect(() => {
    axios.get(`${API}/api/users/me/settings`).then(r => setSettings(r.data)).finally(() => setLoading(false));
  }, []);

  const updateSetting = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    try {
      await axios.put(`${API}/api/users/me/settings`, { [key]: value });
    } catch {
      // revert on failure
      setSettings(prev => ({ ...prev, [key]: settings[key] }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading || !settings) return (
    <div style={{ background: '#000', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff' }}>Loading...</div>
    </div>
  );

  if (activePanel === 'password') return <ChangePasswordPanel settings={settings} onBack={() => setActivePanel(null)} />;
  if (activePanel === 'blocked') return <BlockedUsersPanel onBack={() => setActivePanel(null)} />;
  if (activePanel === 'delete') return <DeleteAccountPanel onBack={() => setActivePanel(null)} />;

  return (
    <div style={{ background: '#000', minHeight: '100%', height: '100%', overflowY: 'auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', zIndex: 10, borderBottom: '1px solid #1a1a1a' }}>
        <button onClick={() => navigate(-1)} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 17, flex: 1, textAlign: 'center' }}>Pengaturan</h2>
        <div style={{ width: 22 }} />
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '8px 16px' }}>
        {/* Account Section */}
        <SectionTitle>AKUN</SectionTitle>
        <SettingsRow label="Edit Profil" onClick={() => navigate('/settings/edit-profile')} />
        <SettingsRow label={settings.has_password ? 'Ganti Password' : 'Buat Password'} onClick={() => setActivePanel('password')} />
        <SettingsRow label="Email" value={settings.email} disabled />
        <ToggleRow
          label="Akun Privat"
          description="Hanya follower yang disetujui bisa lihat video kamu"
          value={!!settings.is_private}
          onChange={v => updateSetting('is_private', v ? 1 : 0)}
        />

        {/* Privacy Section */}
        <SectionTitle>PRIVASI</SectionTitle>
        <SelectRow
          label="Siapa yang bisa komentar"
          value={settings.allow_comments}
          options={[{ value: 'everyone', label: 'Semua orang' }, { value: 'friends', label: 'Teman' }, { value: 'none', label: 'Tidak ada' }]}
          onChange={v => updateSetting('allow_comments', v)}
        />
        <SelectRow
          label="Siapa yang bisa mengirim pesan"
          value={settings.allow_messages}
          options={[{ value: 'everyone', label: 'Semua orang' }, { value: 'friends', label: 'Teman' }, { value: 'none', label: 'Tidak ada' }]}
          onChange={v => updateSetting('allow_messages', v)}
        />
        <SelectRow
          label="Siapa yang bisa Duet"
          value={settings.allow_duet}
          options={[{ value: 'everyone', label: 'Semua orang' }, { value: 'friends', label: 'Teman' }, { value: 'none', label: 'Tidak ada' }]}
          onChange={v => updateSetting('allow_duet', v)}
        />
        <ToggleRow
          label="Tampilkan video disukai"
          description="Orang lain bisa lihat video yang kamu sukai di profil"
          value={!!settings.show_likes}
          onChange={v => updateSetting('show_likes', v ? 1 : 0)}
        />
        <SettingsRow label="Akun yang Diblokir" onClick={() => setActivePanel('blocked')} />

        {/* Preferences */}
        <SectionTitle>PREFERENSI</SectionTitle>
        <SelectRow
          label="Bahasa"
          value={settings.language}
          options={[{ value: 'id', label: 'Bahasa Indonesia' }, { value: 'en', label: 'English' }]}
          onChange={v => updateSetting('language', v)}
        />
        <SelectRow
          label="Tema"
          value={settings.theme}
          options={[{ value: 'dark', label: 'Gelap' }, { value: 'light', label: 'Terang' }]}
          onChange={v => updateSetting('theme', v)}
        />

        {/* Login methods */}
        <SectionTitle>METODE LOGIN</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ color: '#fff', fontSize: 14 }}>Google</span>
          <span style={{ color: settings.has_google ? '#25f4ee' : '#666', fontSize: 13 }}>{settings.has_google ? 'Terhubung' : 'Belum terhubung'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ color: '#fff', fontSize: 14 }}>Password</span>
          <span style={{ color: settings.has_password ? '#25f4ee' : '#666', fontSize: 13 }}>{settings.has_password ? 'Aktif' : 'Belum diatur'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ color: '#fff', fontSize: 14 }}>Email OTP</span>
          <span style={{ color: '#25f4ee', fontSize: 13 }}>Aktif</span>
        </div>

        {/* Danger zone */}
        <SectionTitle>LAINNYA</SectionTitle>
        <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '14px 0', color: '#fff', background: 'none', border: 'none', borderBottom: '1px solid #1a1a1a', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
          Keluar
        </button>
        <button onClick={() => setActivePanel('delete')} style={{ width: '100%', textAlign: 'left', padding: '14px 0', color: '#fe2c55', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
          Hapus Akun
        </button>

        <p style={{ textAlign: 'center', color: '#444', fontSize: 12, marginTop: 32 }}>TikTok Clone v1.0 · garin.fankynas.cloud</p>
      </div>
    </div>
  );
}

// ===================== Sub Components =====================

function SectionTitle({ children }) {
  return <p style={{ color: '#666', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, margin: '24px 0 8px' }}>{children}</p>;
}

function SettingsRow({ label, value, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid #1a1a1a', cursor: disabled ? 'default' : 'pointer' }}>
      <span style={{ color: '#fff', fontSize: 14 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {value && <span style={{ color: '#888', fontSize: 13 }}>{value}</span>}
        {!disabled && <svg width="16" height="16" viewBox="0 0 24 24" fill="#666"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>}
      </div>
    </button>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#fff', fontSize: 14 }}>{label}</p>
        {description && <p style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{description}</p>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 26, borderRadius: 13, background: value ? '#fe2c55' : '#333', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s'
      }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 21 : 3, transition: 'left 0.2s' }} />
      </button>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a', gap: 12 }}>
      <span style={{ color: '#fff', fontSize: 14 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: '#1c1c1c', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ChangePasswordPanel({ settings, onBack }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError('');
    if (form.newPassword.length < 6) { setError('Password baru minimal 6 karakter'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Konfirmasi password tidak cocok'); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/api/users/me/password`, { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess('Password berhasil diubah');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setError(e.response?.data?.error || 'Gagal mengubah password');
    }
    setSaving(false);
  };

  return (
    <PanelLayout title={settings.has_password ? 'Ganti Password' : 'Buat Password'} onBack={onBack}>
      {settings.has_password && (
        <FieldRow label="Password Saat Ini">
          <input type="password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} style={fieldInputStyle} placeholder="••••••••" />
        </FieldRow>
      )}
      <div style={{ marginBottom: 14 }} />
      <FieldRow label="Password Baru">
        <input type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} style={fieldInputStyle} placeholder="Minimal 6 karakter" />
      </FieldRow>
      <div style={{ marginBottom: 14 }} />
      <FieldRow label="Konfirmasi Password Baru">
        <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} style={fieldInputStyle} placeholder="Ulangi password baru" onKeyDown={e => e.key === 'Enter' && submit()} />
      </FieldRow>

      {error && <MessageBox type="error">{error}</MessageBox>}
      {success && <MessageBox type="success">{success}</MessageBox>}

      <button onClick={submit} disabled={saving} style={{ width: '100%', background: '#fe2c55', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 12 }}>
        {saving ? 'Menyimpan...' : 'Simpan Password'}
      </button>
    </PanelLayout>
  );
}

function BlockedUsersPanel({ onBack }) {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/users/me/blocked`).then(r => setBlocked(r.data)).finally(() => setLoading(false));
  }, []);

  const unblock = async (id) => {
    await axios.post(`${API}/api/users/${id}/block`).catch(() => {});
    setBlocked(prev => prev.filter(u => u.id !== id));
  };

  return (
    <PanelLayout title="Akun yang Diblokir" onBack={onBack}>
      {loading ? (
        <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Loading...</p>
      ) : blocked.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Belum ada akun yang diblokir</p>
      ) : (
        blocked.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {u.avatar ? <img src={`${API}${u.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontWeight: 700 }}>{(u.display_name || u.username)[0].toUpperCase()}</span>}
            </div>
            <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>@{u.username}</span>
            <button onClick={() => unblock(u.id)} style={{ color: '#fff', background: '#333', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Buka Blokir</button>
          </div>
        ))
      )}
    </PanelLayout>
  );
}

function DeleteAccountPanel({ onBack }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'HAPUS') { setError('Ketik "HAPUS" untuk konfirmasi'); return; }
    setDeleting(true);
    try {
      await axios.delete(`${API}/api/users/me`);
      logout();
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Gagal menghapus akun');
      setDeleting(false);
    }
  };

  return (
    <PanelLayout title="Hapus Akun" onBack={onBack}>
      <div style={{ background: 'rgba(254,44,85,0.08)', border: '1px solid rgba(254,44,85,0.3)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <p style={{ color: '#fe2c55', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>⚠️ Tindakan ini permanen</p>
        <p style={{ color: '#ccc', fontSize: 13, lineHeight: 1.5 }}>Semua video, komentar, pesan, dan data akun kamu akan dihapus secara permanen dan tidak dapat dikembalikan.</p>
      </div>
      <FieldRow label='Ketik "HAPUS" untuk konfirmasi'>
        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} style={fieldInputStyle} placeholder="HAPUS" />
      </FieldRow>
      {error && <MessageBox type="error">{error}</MessageBox>}
      <button onClick={handleDelete} disabled={deleting} style={{ width: '100%', background: '#fe2c55', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 16 }}>
        {deleting ? 'Menghapus...' : 'Hapus Akun Permanen'}
      </button>
    </PanelLayout>
  );
}

function PanelLayout({ title, onBack, children }) {
  return (
    <div style={{ background: '#000', minHeight: '100%', height: '100%', overflowY: 'auto', paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', zIndex: 10, borderBottom: '1px solid #1a1a1a' }}>
        <button onClick={onBack} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 17, flex: 1, textAlign: 'center' }}>{title}</h2>
        <div style={{ width: 22 }} />
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>{children}</div>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div>
      <label style={{ color: '#888', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

function MessageBox({ type, children }) {
  const isError = type === 'error';
  return (
    <div style={{ background: isError ? 'rgba(254,44,85,0.1)' : 'rgba(37,244,238,0.1)', border: `1px solid ${isError ? 'rgba(254,44,85,0.3)' : 'rgba(37,244,238,0.3)'}`, borderRadius: 8, padding: '10px 14px', marginTop: 14, color: isError ? '#fe2c55' : '#25f4ee', fontSize: 13 }}>
      {children}
    </div>
  );
}

const fieldInputStyle = {
  width: '100%',
  background: '#1c1c1c',
  border: '1px solid #2a2a2a',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#fff',
  fontSize: 15
};
