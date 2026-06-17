import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '';

export default function Home() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState('foryou'); // 'foryou' | 'following'
  const feedRef = useRef(null);
  const observerRef = useRef(null);
  const videoRefs = useRef([]);

  const fetchVideos = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const endpoint = tab === 'following' && user
        ? `${API}/api/feed/following?userId=${user.id}&page=${reset ? 0 : page}`
        : `${API}/api/feed/foryou?userId=${user?.id || ''}&page=${reset ? 0 : page}`;
      const r = await axios.get(endpoint);
      if (reset) {
        setVideos(r.data);
        setPage(1);
      } else {
        setVideos(prev => [...prev, ...r.data]);
        setPage(prev => prev + 1);
      }
    } catch {}
    setLoading(false);
  }, [tab, user, page, loading]);

  useEffect(() => {
    setPage(0);
    fetchVideos(true);
  }, [tab]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const handleScroll = () => {
      const scrollTop = feed.scrollTop;
      const itemHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== activeIndex) setActiveIndex(newIndex);

      // Load more at 80% scroll
      const scrollBottom = scrollTop + feed.clientHeight;
      const scrollTotal = feed.scrollHeight;
      if (scrollBottom > scrollTotal * 0.8 && !loading) fetchVideos();
    };

    feed.addEventListener('scroll', handleScroll, { passive: true });
    return () => feed.removeEventListener('scroll', handleScroll);
  }, [activeIndex, loading, fetchVideos]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
      {/* Tab Switcher */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', gap: 24, paddingTop: 16, paddingBottom: 8 }}>
        <button onClick={() => setTab('following')}
          style={{ background: 'none', border: 'none', color: tab === 'following' ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: tab === 'following' ? 700 : 500, fontSize: 16, cursor: 'pointer', paddingBottom: 4, borderBottom: tab === 'following' ? '2px solid white' : '2px solid transparent' }}>
          Following
        </button>
        <button onClick={() => setTab('foryou')}
          style={{ background: 'none', border: 'none', color: tab === 'foryou' ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: tab === 'foryou' ? 700 : 500, fontSize: 16, cursor: 'pointer', paddingBottom: 4, borderBottom: tab === 'foryou' ? '2px solid white' : '2px solid transparent' }}>
          For You
        </button>
      </div>

      {/* Video Feed */}
      <div ref={feedRef} className="video-feed">
        {videos.length === 0 && !loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 60 }}>🎬</div>
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>No videos yet</p>
            <p style={{ color: '#888', fontSize: 14 }}>
              {tab === 'following' ? 'Follow creators to see their videos' : 'Be the first to upload!'}
            </p>
          </div>
        ) : (
          videos.map((video, i) => (
            <VideoCard
              key={`${video.id}-${i}`}
              video={video}
              isActive={i === activeIndex}
              onVideoRef={ref => videoRefs.current[i] = ref}
            />
          ))
        )}
        {loading && (
          <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #fe2c55', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}
