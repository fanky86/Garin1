import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || '';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return Math.floor(diff / 86400) + 'd';
}

export default function CommentsSheet({ videoId, onClose, commentsCount }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/api/comments/${videoId}`)
      .then(r => setComments(r.data))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 400);
  }, [videoId]);

  const submit = async () => {
    if (!user) { navigate('/login'); return; }
    if (!text.trim()) return;
    try {
      const r = await axios.post(`${API}/api/comments/${videoId}`, { text });
      setComments(prev => [r.data, ...prev]);
      setText('');
    } catch {}
  };

  const handleKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{commentsCount || comments.length} comments</span>
          <button onClick={onClose} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#fff', fontSize: 20 }}>✕</button>
        </div>

        {/* Comments List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ color: '#888', textAlign: 'center', paddingTop: 40 }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
              <div>No comments yet. Be the first!</div>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.avatar ? <img src={`${API}${c.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{(c.display_name || c.username || '?')[0].toUpperCase()}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>@{c.username}</span>
                  <p style={{ color: '#e8e8e8', fontSize: 14, marginTop: 2, lineHeight: 1.4 }}>{c.text}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <span style={{ color: '#888', fontSize: 12 }}>{timeAgo(c.created_at)}</span>
                    <span style={{ color: '#888', fontSize: 12, cursor: 'pointer' }}>Reply</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#888"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  <span style={{ color: '#888', fontSize: 10 }}>{c.likes_count || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 10, alignItems: 'center', background: '#1c1c1c' }}>
          {user?.avatar ? (
            <img src={`${API}${user.avatar}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fe2c55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {user ? (user.display_name || user.username || '?')[0].toUpperCase() : '?'}
            </div>
          )}
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={user ? 'Add comment...' : 'Login to comment'}
            readOnly={!user}
            onClick={() => !user && navigate('/login')}
            style={{ flex: 1, background: '#333', border: 'none', borderRadius: 20, padding: '8px 14px', color: '#fff', fontSize: 14 }}
          />
          <button onClick={submit} disabled={!text.trim()} style={{ color: text.trim() ? '#fe2c55' : '#555', fontWeight: 700, fontSize: 15, background: 'none', border: 'none', cursor: text.trim() ? 'pointer' : 'default' }}>
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
