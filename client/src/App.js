import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Search from './pages/Search';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';
import BottomNav from './components/BottomNav';
import './App.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const HIDE_NAV_PREFIXES = ['/login', '/inbox/chat', '/settings'];

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#000' }}>
      <div className="tiktok-loader">
        <span style={{ color: '#fe2c55', fontWeight: 700, fontSize: 24 }}>Tik</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 24 }}>Tok</span>
      </div>
    </div>
  );

  const hideNav = HIDE_NAV_PREFIXES.some(p => location.pathname.startsWith(p));

  return (
    <div className="app">
      <div className={`main-content ${hideNav ? 'no-sidebar-offset' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={user ? <Upload /> : <Navigate to="/login" />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/profile" element={user ? <Profile username={user?.username} /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/inbox" element={user ? <Inbox /> : <Navigate to="/login" />} />
          <Route path="/inbox/chat/:userId" element={user ? <Chat /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/settings/edit-profile" element={user ? <EditProfile /> : <Navigate to="/login" />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
};

export default function App() {
  const content = (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );

  // Hanya bungkus dengan GoogleOAuthProvider jika Client ID sudah dikonfigurasi,
  // supaya tidak muncul error di console saat developer belum setup Google Login.
  if (!GOOGLE_CLIENT_ID) return content;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
}
