import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('tt_token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API}/api/auth/me`)
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('tt_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const applyAuth = (data) => {
    localStorage.setItem('tt_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const r = await axios.post(`${API}/api/auth/login`, { email, password });
    applyAuth(r.data);
    return r.data;
  };

  const register = async (username, email, password) => {
    const r = await axios.post(`${API}/api/auth/register`, { username, email, password, display_name: username });
    applyAuth(r.data);
    return r.data;
  };

  const sendOtp = async (email) => {
    const r = await axios.post(`${API}/api/auth/otp/send`, { email });
    return r.data;
  };

  const verifyOtp = async (email, code) => {
    const r = await axios.post(`${API}/api/auth/otp/verify`, { email, code });
    applyAuth(r.data);
    return r.data;
  };

  const loginWithGoogle = async (credential) => {
    const r = await axios.post(`${API}/api/auth/google`, { credential });
    applyAuth(r.data);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('tt_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, token, sendOtp, verifyOtp, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
