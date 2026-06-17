import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || '';

const TRENDING = ['#fyp', '#viral', '#indonesia', '#trending', '#funny', '#dance', '#food', '#travel', '#music', '#gaming'];

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n || 0);
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setUsers([]); setVideos([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const [u, v] = await Promise.all([
        axios.get(`${API}/api/users/search/query?q=${query}`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/feed/search?q=${query}`).catch(() => ({ data: [] }))
      ]);
      setUsers(u.data || []);
      setVideos(v.data || []);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div style={{ background: '#000', height: '100%', overflowY: 'auto', paddingBottom: 70 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Search bar */}
        <div style={{ padding: '16px 16px 8px', position: 'sticky', top: 0, background: '#000', zIndex: 10 }}>
          <div className="search-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a8b91" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search accounts, videos, tags"
              autoFocus
            />
            {query && <button onClick={() => setQuery('')} style={{ color: '#888', fontSize: 18, background: 'none', border: 'none' }}>✕</button>}
          </div>
        </div>

        {!query.trim() ? (
          /* Trending */
          <div style={{ padding: 16 }}>
            <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 16 }}>Trending</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {TRENDING.map(tag => (
                <button key={tag} onClick={() => setQuery(tag.slice(1))}
                  style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 20, padding: '8px 16px', color: '#fff', fontSize: 14, cursor: 'pointer' }}>
                  {tag}
                </button>
              ))}
            </div>

            {/* Trending videos */}
            <h3 style={{ color: '#fff', fontWeight: 700, margin: '24px 0 12px' }}>Discover</h3>
            <VideoGrid videos={[]} navigate={navigate} />
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #222', padding: '0 16px' }}>
              {['users', 'videos'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex: 1, padding: '12px 0', color: tab === t ? '#fff' : '#888', fontWeight: tab === t ? 700 : 500, fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === t ? '2px solid white' : '2px solid transparent' }}>
                  {t === 'users' ? 'Accounts' : 'Videos'}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #fe2c55', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : tab === 'users' ? (
              <div style={{ padding: '12px 16px' }}>
                {users.length === 0 ? <p style={{ color: '#888', textAlign: 'center', paddingTop: 32 }}>No accounts found</p> : (
                  users.map(u => (
                    <div key={u.id} onClick={() => navigate(`/profile/${u.username}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {u.avatar ? <img src={`${API}${u.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{(u.display_name || u.username || '?')[0].toUpperCase()}</span>}
                      </div>
                      <div>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>@{u.username}</p>
                        <p style={{ color: '#888', fontSize: 13 }}>{formatCount(u.followers_count)} followers</p>
                      </div>
                      {u.verified && <span style={{ color: '#20d5ec', marginLeft: 'auto' }}>✓</span>}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ padding: '12px 8px' }}>
                {videos.length === 0 ? <p style={{ color: '#888', textAlign: 'center', paddingTop: 32 }}>No videos found</p> : (
                  <VideoGrid videos={videos} navigate={navigate} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoGrid({ videos, navigate }) {
  if (videos.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 4 }}>
      {videos.map(v => (
        <div key={v.id} onClick={() => navigate('/')} style={{ aspectRatio: '9/16', background: '#1a1a1a', position: 'relative', overflow: 'hidden', cursor: 'pointer', borderRadius: 4 }}>
          {v.thumbnail_url ? (
            <img src={`${API}${v.thumbnail_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <video src={`${API}${v.video_url}`} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', bottom: 4, left: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>
              {v.views_count >= 1000 ? (v.views_count / 1000).toFixed(1) + 'K' : v.views_count || 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
