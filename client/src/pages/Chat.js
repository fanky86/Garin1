import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const POLL_INTERVAL = 3000;

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const loadMessages = (showLoading = false) => {
    if (showLoading) setLoading(true);
    axios.get(`${API}/api/messages/conversations/with/${userId}`)
      .then(r => setMessages(r.data.messages))
      .finally(() => showLoading && setLoading(false));
  };

  useEffect(() => {
    axios.get(`${API}/api/users/by-id/${userId}`).then(r => setOtherUser(r.data)).catch(() => {});
    loadMessages(true);

    pollRef.current = setInterval(() => loadMessages(false), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const tempText = text.trim();
    setText('');
    try {
      const r = await axios.post(`${API}/api/messages/conversations/with/${userId}`, { text: tempText });
      setMessages(prev => [...prev, r.data]);
    } catch {
      setText(tempText);
    }
    setSending(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ background: '#000', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: '#000', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 680, margin: '0 auto' }}>
          <button onClick={() => navigate('/inbox')} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          </button>
          {otherUser?.avatar ? (
            <img src={`${API}${otherUser.avatar}`} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fe2c55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
              {(otherUser?.display_name || otherUser?.username || '?')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
              {otherUser?.display_name || otherUser?.username || 'Pengguna'}
              {otherUser?.verified ? ' ✓' : ''}
            </p>
            <p style={{ color: '#888', fontSize: 12 }}>@{otherUser?.username}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
              <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #fe2c55', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
              <p style={{ color: '#888', fontSize: 14 }}>Mulai percakapan dengan menyapa!</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.sender_id === me.id;
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                  <div style={{
                    maxWidth: '75%',
                    background: isMe ? '#fe2c55' : '#262626',
                    color: '#fff',
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                    padding: '10px 14px',
                    fontSize: 14,
                    lineHeight: 1.4,
                    wordBreak: 'break-word'
                  }}>
                    {m.text}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>{formatTime(m.created_at)}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '12px 16px', borderTop: '1px solid #1a1a1a', background: '#000' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', width: '100%', maxWidth: 680, margin: '0 auto' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Kirim pesan..."
            rows={1}
            style={{ flex: 1, background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 20, padding: '10px 16px', color: '#fff', fontSize: 14, resize: 'none', maxHeight: 100 }}
          />
          <button onClick={send} disabled={!text.trim() || sending}
            style={{ background: text.trim() ? '#fe2c55' : '#333', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: text.trim() ? 'pointer' : 'default', border: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
