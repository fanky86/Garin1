import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '';

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [music, setMusic] = useState('Original Sound');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) { setError('Please select a video file'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const upload = async () => {
    if (!file) { setError('Please select a video'); return; }
    setUploading(true);
    setError('');

    const fd = new FormData();
    fd.append('video', file);
    fd.append('description', description);
    fd.append('music', music);
    fd.append('tags', JSON.stringify(tags.split(' ').filter(t => t.startsWith('#')).map(t => t.slice(1))));

    try {
      await axios.post(`${API}/api/videos/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total))
      });
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <div style={{ background: '#000', minHeight: '100%', paddingBottom: 80, overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', position: 'sticky', top: 0, background: '#000', zIndex: 10, borderBottom: '1px solid #222' }}>
        <button onClick={() => navigate(-1)} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, flex: 1, textAlign: 'center' }}>Upload Video</h2>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Drop Zone */}
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed #333', borderRadius: 16, padding: 48, textAlign: 'center', cursor: 'pointer', marginBottom: 20, background: '#111' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎬</div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Select or drag video</p>
            <p style={{ color: '#888', fontSize: 13 }}>MP4, MOV, AVI supported · Up to 500MB</p>
            <div style={{ marginTop: 20, background: '#fe2c55', color: '#fff', borderRadius: 8, padding: '10px 28px', display: 'inline-block', fontWeight: 600 }}>
              Choose File
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 20, background: '#111', aspectRatio: '9/16', maxHeight: 400 }}>
            <video src={preview} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => { setFile(null); setPreview(null); }}
              style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} style={{ display: 'none' }} />

        {/* Form */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#888', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>DESCRIPTION</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your video... #trending #viral"
            rows={3}
            maxLength={150}
            style={{ width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, resize: 'none' }}
          />
          <div style={{ textAlign: 'right', color: '#555', fontSize: 12 }}>{description.length}/150</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#888', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>TAGS (with #)</label>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="#viral #fyp #indonesia"
            style={{ width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14 }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: '#888', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>MUSIC</label>
          <input
            value={music}
            onChange={e => setMusic(e.target.value)}
            placeholder="Original Sound"
            style={{ width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14 }}
          />
        </div>

        {error && (
          <div style={{ background: 'rgba(254,44,85,0.1)', border: '1px solid rgba(254,44,85,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fe2c55', fontSize: 13 }}>
            {error}
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ background: '#2a2a2a', borderRadius: 6, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#fe2c55', transition: 'width 0.3s' }} />
            </div>
            <p style={{ color: '#888', fontSize: 12, textAlign: 'center', marginTop: 6 }}>Uploading... {progress}%</p>
          </div>
        )}

        <button onClick={upload} disabled={uploading || !file}
          style={{ width: '100%', background: !file || uploading ? '#555' : '#fe2c55', color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px', borderRadius: 10, cursor: !file || uploading ? 'not-allowed' : 'pointer', border: 'none' }}>
          {uploading ? `Uploading ${progress}%...` : 'Post Video'}
        </button>
      </div>
    </div>
  );
}
