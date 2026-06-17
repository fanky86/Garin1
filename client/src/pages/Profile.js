import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '';

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n || 0);
}

export default function Profile({ username: propUsername }) {
  const params = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const username = propUsername || params.username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isMyProfile = me?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    axios.get(`${API}/api/users/${username}?viewerId=${me?.id || ''}`)
      .then(r => {
        setProfile(r.data);
        setIsFollowing(r.data.is_following);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [username, me?.id]);

  const handleFollow = async () => {
    if (!me) { navigate('/login'); return; }
    setIsFollowing(prev => !prev);
    setProfile(prev => ({
      ...prev,
      followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
    }));
    await axios.post(`${API}/api/users/${profile.id}/follow`).catch(() => {});
  };

  const handleBlock = async () => {
    setShowMenu(false);
    try {
      const r = await axios.post(`${API}/api/users/${profile.id}/block`);
      setIsBlocked(r.data.blocked);
      if (r.data.blocked) setIsFollowing(false);
    } catch {}
  };

  if (loading) return (
    <div style={{ background: '#000', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>Loading...</div>
    </div>
  );

  if (!profile) return null;

  const avatarSrc = profile.avatar ? (profile.avatar.startsWith('http') ? profile.avatar : `${API}${profile.avatar}`) : null;

  return (
    <div style={{ background: '#000', minHeight: '100%', paddingBottom: 70, overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 8px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          </button>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, flex: 1, textAlign: 'center' }}>@{profile.username}</h2>
          {isMyProfile ? (
            <button onClick={() => navigate('/settings')} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(s => !s)} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
              </button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: 36, background: '#262626', borderRadius: 10, overflow: 'hidden', zIndex: 20, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                  <button onClick={handleBlock} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', color: '#fe2c55', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                    {isBlocked ? 'Unblock' : 'Block'} @{profile.username}
                  </button>
                  <button onClick={() => setShowMenu(false)} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, borderTop: '1px solid #333' }}>
                    Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div style={{ padding: '24px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 36 }}>{(profile.display_name || profile.username || '?')[0].toUpperCase()}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{profile.display_name || profile.username}</h2>
            {profile.verified ? <span style={{ color: '#20d5ec' }}>✓</span> : null}
          </div>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>@{profile.username}</p>
          {profile.bio ? <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 1.5, marginBottom: 16 }}>{profile.bio}</p> : null}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
            {[
              { label: 'Following', value: formatCount(profile.following_count) },
              { label: 'Followers', value: formatCount(profile.followers_count) },
              { label: 'Likes', value: formatCount(profile.likes_count) }
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{s.value}</div>
                <div style={{ color: '#888', fontSize: 13 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Action button */}
          {isMyProfile ? (
            <button onClick={() => navigate('/settings/edit-profile')} style={{ background: 'transparent', border: '1px solid #555', color: '#fff', borderRadius: 4, padding: '8px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleFollow} className={`follow-btn ${isFollowing ? 'following' : ''}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button onClick={() => navigate(`/inbox/chat/${profile.id}`)} style={{ background: 'transparent', border: '1px solid #555', color: '#fff', borderRadius: 4, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                Message
              </button>
            </div>
          )}
        </div>

        {/* Videos Grid */}
        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 2 }}>
          <div style={{ display: 'flex', padding: '0 16px 8px', borderBottom: '1px solid #2a2a2a' }}>
            <div style={{ flex: 1, textAlign: 'center', paddingBottom: 8, borderBottom: '2px solid white' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ verticalAlign: 'middle' }}>
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: 'center', paddingBottom: 8, borderBottom: '2px solid transparent' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#888" style={{ verticalAlign: 'middle' }}>
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
          </div>

          <div className="profile-grid">
            {profile.videos?.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
                <p style={{ color: '#888' }}>No videos yet</p>
              </div>
            ) : (
              profile.videos?.map(v => (
                <div key={v.id} className="profile-grid-item" onClick={() => navigate('/')}>
                  {v.thumbnail_url ? (
                    <img src={`${API}${v.thumbnail_url}`} alt="" />
                  ) : (
                    <video src={`${API}${v.video_url}`} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{formatCount(v.views_count)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
