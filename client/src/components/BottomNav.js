import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const POLL_INTERVAL = 15000;

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadTotal(0); return; }

    const fetchUnread = () => {
      Promise.all([
        axios.get(`${API}/api/messages/unread-count`).then(r => r.data.count).catch(() => 0),
        axios.get(`${API}/api/notifications/unread-count`).then(r => r.data.count).catch(() => 0)
      ]).then(([msgCount, notifCount]) => setUnreadTotal(msgCount + notifCount));
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, path]);

  const goTo = (p) => navigate(p);

  return (
    <div className="bottom-nav">
      <button className={`nav-item ${path === '/' ? 'active' : ''}`} onClick={() => goTo('/')}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill={path === '/' ? 'white' : 'rgba(255,255,255,0.6)'}>
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>Home</span>
      </button>

      <button className={`nav-item ${path === '/search' ? 'active' : ''}`} onClick={() => goTo('/search')}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={path === '/search' ? 'white' : 'rgba(255,255,255,0.6)'} strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span>Discover</span>
      </button>

      <button className="nav-item nav-upload-btn" onClick={() => goTo(user ? '/upload' : '/login')}>
        <div className="nav-upload-inner">
          <span style={{ zIndex: 1, fontWeight: 400, fontSize: 22 }}>+</span>
        </div>
      </button>

      <button className={`nav-item ${path.startsWith('/inbox') ? 'active' : ''}`} onClick={() => goTo(user ? '/inbox' : '/login')} style={{ position: 'relative' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={path.startsWith('/inbox') ? 'white' : 'rgba(255,255,255,0.6)'} strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {unreadTotal > 0 && (
          <span style={{ position: 'absolute', top: -2, right: 4, background: '#fe2c55', color: '#fff', borderRadius: 10, minWidth: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
        <span>Inbox</span>
      </button>

      <button
        className={`nav-item ${path.includes('/profile') ? 'active' : ''}`}
        onClick={() => goTo(user ? `/profile/${user.username}` : '/login')}
      >
        {user?.avatar ? (
          <img src={user.avatar.startsWith('http') ? user.avatar : `${API}${user.avatar}`} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: path.includes('/profile') ? '2px solid white' : 'none' }} />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill={path.includes('/profile') ? 'white' : 'rgba(255,255,255,0.6)'}>
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        )}
        <span>Profile</span>
      </button>
    </div>
  );
}
