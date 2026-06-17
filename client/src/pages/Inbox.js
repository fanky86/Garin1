import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'j';
  if (diff < 604800) return Math.floor(diff / 86400) + 'h';
  return new Date(dateStr).toLocaleDateString('id-ID');
}

function Avatar({ src, name, size = 44 }) {
  if (src) return <img src={src.startsWith('http') ? src : `${API}${src}`} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #fe2c55, #ff6b35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function notifText(n) {
  switch (n.type) {
    case 'like': return 'menyukai video kamu';
    case 'comment': return `mengomentari: "${(n.comment_text || '').slice(0, 40)}${n.comment_text?.length > 40 ? '...' : ''}"`;
    case 'follow': return 'mengikuti kamu';
    default: return '';
  }
}

export default function Inbox() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('activity'); // 'activity' | 'messages'
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = () => {
    setLoading(true);
    axios.get(`${API}/api/notifications`)
      .then(r => setNotifications(r.data))
      .finally(() => setLoading(false));
    axios.post(`${API}/api/notifications/read-all`).catch(() => {});
  };

  const loadMessages = () => {
    setLoading(true);
    axios.get(`${API}/api/messages/conversations`)
      .then(r => setConversations(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'activity') loadActivity();
    else loadMessages();
  }, [tab]);

  const handleNotifClick = (n) => {
    if (n.type === 'follow') navigate(`/profile/${n.actor_username}`);
    else navigate('/'); // bisa diarahkan ke video tertentu kalau ada halaman detail video
  };

  return (
    <div style={{ background: '#000', height: '100%', overflowY: 'auto', paddingBottom: 70 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 0', position: 'sticky', top: 0, background: '#000', zIndex: 10 }}>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 16, textAlign: 'center' }}>Kotak Masuk</h2>
          <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
            <button onClick={() => setTab('activity')}
              style={{ flex: 1, padding: '12px 0', color: tab === 'activity' ? '#fff' : '#888', fontWeight: tab === 'activity' ? 700 : 500, fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === 'activity' ? '2px solid white' : '2px solid transparent' }}>
              Aktivitas
            </button>
            <button onClick={() => setTab('messages')}
              style={{ flex: 1, padding: '12px 0', color: tab === 'messages' ? '#fff' : '#888', fontWeight: tab === 'messages' ? 700 : 500, fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === 'messages' ? '2px solid white' : '2px solid transparent' }}>
              Pesan
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #fe2c55', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : tab === 'activity' ? (
          <div style={{ padding: '8px 16px' }}>
            {notifications.length === 0 ? (
              <EmptyState icon="🔔" title="Belum ada aktivitas" subtitle="Like, komentar, dan follower baru akan muncul di sini" />
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => handleNotifClick(n)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}>
                  <Avatar src={n.actor_avatar} name={n.actor_display_name || n.actor_username} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.4 }}>
                      <strong>@{n.actor_username}</strong>{n.actor_verified ? ' ✓' : ''} {notifText(n)}
                    </p>
                    <p style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {n.video_url && n.type !== 'follow' && (
                    <div style={{ width: 44, height: 56, borderRadius: 6, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                      <video src={`${API}${n.video_url}`} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fe2c55', flexShrink: 0 }} />}
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {conversations.length === 0 ? (
              <EmptyState icon="💬" title="Belum ada pesan" subtitle="Mulai chat dengan kreator atau teman kamu" />
            ) : (
              conversations.map(c => (
                <div key={c.id} onClick={() => navigate(`/inbox/chat/${c.other_user_id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
                  <Avatar src={c.other_user?.avatar} name={c.other_user?.display_name || c.other_user?.username} size={50} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
                      {c.other_user?.display_name || c.other_user?.username}
                      {c.other_user?.verified ? ' ✓' : ''}
                    </p>
                    <p style={{ color: '#888', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.last_message || 'Mulai percakapan'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ color: '#666', fontSize: 11 }}>{timeAgo(c.last_message_at)}</span>
                    {c.unread_count > 0 && (
                      <span style={{ background: '#fe2c55', color: '#fff', borderRadius: 10, minWidth: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <p style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{title}</p>
      <p style={{ color: '#888', fontSize: 13 }}>{subtitle}</p>
    </div>
  );
}
