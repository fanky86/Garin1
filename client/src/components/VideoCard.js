import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CommentsSheet from './CommentsSheet';

const API = process.env.REACT_APP_API_URL || '';

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n || 0);
}

function Avatar({ user, size = 44 }) {
  if (user?.avatar) return <img src={`${API}${user.avatar}`} alt="" className="avatar" style={{ width: size, height: size }} />;
  const initials = (user?.display_name || user?.username || '?')[0].toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, background: 'linear-gradient(135deg, #fe2c55, #ff6b35)', fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
}

export default function VideoCard({ video, isActive, onVideoRef }) {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(video.is_liked);
  const [likesCount, setLikesCount] = useState(video.likes_count || 0);
  const [isFollowing, setIsFollowing] = useState(video.is_following);
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doubleTapPos, setDoubleTapPos] = useState(null);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (onVideoRef) onVideoRef(videoRef.current);
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isActive) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
      if (!viewedRef.current) {
        viewedRef.current = true;
        axios.post(`${API}/api/videos/${video.id}/view`).catch(() => {});
      }
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleVideoClick = useCallback((e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap - like
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDoubleTapPos({ x, y });
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      if (!isLiked) handleLike();
    } else {
      // Single tap - play/pause
      const vid = videoRef.current;
      if (vid.paused) { vid.play(); setIsPlaying(true); }
      else { vid.pause(); setIsPlaying(false); }
    }
    lastTapRef.current = now;
  }, [isLiked]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    try {
      await axios.post(`${API}/api/videos/${video.id}/like`);
    } catch {
      setIsLiked(!newLiked);
      setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  const handleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    setIsFollowing(prev => !prev);
    try {
      await axios.post(`${API}/api/users/${video.user_id}/follow`);
    } catch {
      setIsFollowing(prev => !prev);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?v=${video.id}`;
    if (navigator.share) {
      navigator.share({ title: video.description, url });
    } else {
      navigator.clipboard.writeText(url);
    }
    await axios.post(`${API}/api/videos/${video.id}/share`).catch(() => {});
  };

  const onTimeUpdate = () => {
    const vid = videoRef.current;
    if (vid && vid.duration) setProgress((vid.currentTime / vid.duration) * 100);
  };

  const tags = Array.isArray(video.tags) ? video.tags : [];

  return (
    <div className="video-item" style={{ background: '#000' }}>
      {/* VIDEO */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={handleVideoClick}>
        <video
          ref={videoRef}
          src={`${API}${video.video_url}`}
          loop
          playsInline
          muted={isMuted}
          onTimeUpdate={onTimeUpdate}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          poster={video.thumbnail_url ? `${API}${video.thumbnail_url}` : undefined}
        />

        {/* Play/Pause icon */}
        {!isPlaying && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        )}

        {/* Double tap heart */}
        {showHeart && doubleTapPos && (
          <div className="double-tap-heart" style={{ left: doubleTapPos.x, top: doubleTapPos.y }}>❤️</div>
        )}

        {/* Gradient overlay bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', pointerEvents: 'none' }} />

        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '12px 0', zIndex: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 600 }}>For You</span>
        </div>

        {/* Mute button */}
        <button
          onClick={e => { e.stopPropagation(); setIsMuted(m => !m); }}
          style={{ position: 'absolute', top: 60, right: 16, background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >
          {isMuted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          )}
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ position: 'absolute', bottom: 62, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.2)', zIndex: 20 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#fe2c55', transition: 'width 0.1s' }} />
      </div>

      {/* BOTTOM INFO */}
      <div style={{ position: 'absolute', bottom: 70, left: 16, right: 80, zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, pointerEvents: 'all' }}
          onClick={() => navigate(`/profile/${video.username}`)}>
          <Avatar user={video} size={36} />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>@{video.username}</span>
          {video.verified ? <span style={{ color: '#20d5ec', fontSize: 14 }}>✓</span> : null}
          {user?.id !== video.user_id && (
            <button onClick={e => { e.stopPropagation(); handleFollow(); }}
              style={{ marginLeft: 8, background: isFollowing ? 'transparent' : '#fe2c55', border: isFollowing ? '1px solid rgba(255,255,255,0.5)' : 'none', color: '#fff', borderRadius: 4, padding: '3px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', pointerEvents: 'all' }}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <p style={{ fontSize: 14, color: '#fff', marginBottom: 6, lineHeight: 1.4 }}>{video.description}</p>
        {tags.length > 0 && (
          <p style={{ fontSize: 14, color: '#fff' }}>
            {tags.map(t => <span key={t} style={{ color: '#fff', fontWeight: 600, marginRight: 6 }}>#{t}</span>)}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          <span style={{ fontSize: 13, color: '#fff' }}>{video.music || 'Original Sound'}</span>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div style={{ position: 'absolute', right: 12, bottom: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, zIndex: 20 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/profile/${video.username}`)}>
          <Avatar user={video} size={48} />
          {user?.id !== video.user_id && !isFollowing && (
            <div onClick={e => { e.stopPropagation(); handleFollow(); }}
              style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#fe2c55', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span style={{ color: '#fff', fontSize: 16, lineHeight: 1 }}>+</span>
            </div>
          )}
        </div>

        {/* Like */}
        <ActionButton
          onClick={handleLike}
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill={isLiked ? '#fe2c55' : 'white'} className={isLiked ? 'like-animate' : ''}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          }
          count={formatCount(likesCount)}
          active={isLiked}
          activeColor="#fe2c55"
        />

        {/* Comments */}
        <ActionButton
          onClick={() => setShowComments(true)}
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          }
          count={formatCount(video.comments_count || 0)}
        />

        {/* Share */}
        <ActionButton
          onClick={handleShare}
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
          }
          count={formatCount(video.shares_count || 0)}
        />

        {/* Spinning music disc */}
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #fff', background: 'linear-gradient(135deg, #1a1a1a, #333)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: isPlaying ? 'spin 3s linear infinite' : 'none' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {/* COMMENTS SHEET */}
      {showComments && (
        <CommentsSheet videoId={video.id} onClose={() => setShowComments(false)} commentsCount={video.comments_count} />
      )}
    </div>
  );
}

function ActionButton({ onClick, icon, count, active, activeColor }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', background: 'none', border: 'none' }}>
      {icon}
      <span style={{ color: active ? activeColor : '#fff', fontSize: 12, fontWeight: 600 }}>{count}</span>
    </button>
  );
}
