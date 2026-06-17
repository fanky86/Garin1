import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    username: user?.username || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAvatarChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };

  const save = async () => {
    setError('');
    setSuccess('');
    setUsernameError('');
    setSaving(true);

    try {
      // Update username separately if changed
      if (form.username !== user.username) {
        try {
          await axios.put(`${API}/api/users/me/username`, { username: form.username });
        } catch (e) {
          setUsernameError(e.response?.data?.error || 'Gagal mengubah username');
          setSaving(false);
          return;
        }
      }

      const fd = new FormData();
      fd.append('display_name', form.display_name);
      fd.append('bio', form.bio);
      if (avatarFile) fd.append('avatar', avatarFile);

      const r = await axios.put(`${API}/api/users/me/update`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(prev => ({ ...prev, ...r.data, username: form.username }));
      setSuccess('Profil berhasil disimpan');
      setTimeout(() => navigate(`/profile/${form.username}`), 800);
    } catch (e) {
      setError(e.response?.data?.error || 'Gagal menyimpan profil');
    }
    setSaving(false);
  };

  const avatarSrc = avatarPreview || (user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${API}${user.avatar}`) : null);

  return (
    <div style={{ background: '#000', minHeight: '100%', height: '100%', overflowY: 'auto', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', zIndex: 10, borderBottom: '1px solid #1a1a1a' }}>
        <button onClick={() => navigate(-1)} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 17, flex: 1, textAlign: 'center' }}>Edit Profil</h2>
        <button onClick={save} disabled={saving} style={{ color: saving ? '#666' : '#fe2c55', fontWeight: 700, fontSize: 15, background: 'none', border: 'none', cursor: saving ? 'default' : 'pointer' }}>
          {saving ? '...' : 'Simpan'}
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 32 }}>{(form.display_name || form.username || '?')[0].toUpperCase()}</span>
              )}
            </div>
            <label style={{ position: 'absolute', bottom: 0, right: 0, background: '#fe2c55', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #000' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>
          <button onClick={() => fileRef.current?.click()} style={{ color: '#fe2c55', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', marginTop: 10, cursor: 'pointer' }}>
            Ubah foto profil
          </button>
        </div>

        {/* Form fields */}
        <FieldRow label="Nama">
          <input
            value={form.display_name}
            onChange={e => update('display_name', e.target.value.slice(0, 30))}
            placeholder="Nama tampilan"
            style={fieldInputStyle}
          />
        </FieldRow>
        <div style={{ textAlign: 'right', color: '#555', fontSize: 11, marginTop: -8, marginBottom: 12 }}>{form.display_name.length}/30</div>

        <FieldRow label="Username">
          <input
            value={form.username}
            onChange={e => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
            placeholder="username"
            style={fieldInputStyle}
          />
        </FieldRow>
        {usernameError && <p style={{ color: '#fe2c55', fontSize: 12, marginTop: -8, marginBottom: 12 }}>{usernameError}</p>}
        <p style={{ color: '#666', fontSize: 12, marginTop: -8, marginBottom: 16 }}>tiktokclone.com/@{form.username}</p>

        <FieldRow label="Bio">
          <textarea
            value={form.bio}
            onChange={e => update('bio', e.target.value.slice(0, 80))}
            placeholder="Tulis bio kamu"
            rows={3}
            style={{ ...fieldInputStyle, resize: 'none' }}
          />
        </FieldRow>
        <div style={{ textAlign: 'right', color: '#555', fontSize: 11, marginTop: -8, marginBottom: 16 }}>{form.bio.length}/80</div>

        {error && (
          <div style={{ background: 'rgba(254,44,85,0.1)', border: '1px solid rgba(254,44,85,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fe2c55', fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(37,244,238,0.1)', border: '1px solid rgba(37,244,238,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#25f4ee', fontSize: 13 }}>
            {success}
          </div>
        )}

        {/* Quick links */}
        <div style={{ marginTop: 24, borderTop: '1px solid #1a1a1a', paddingTop: 16 }}>
          <p style={{ color: '#666', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>LAINNYA</p>
          <SettingsLink label="Privasi & Keamanan" onClick={() => navigate('/settings')} />
          <SettingsLink label="Ganti Password" onClick={() => navigate('/settings')} />
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ color: '#888', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

function SettingsLink({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', background: 'none', border: 'none', borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}>
      <span style={{ color: '#fff', fontSize: 14 }}>{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#666"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
    </button>
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
