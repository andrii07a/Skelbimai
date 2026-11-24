// Keeps "who is logged in" for the whole React app.
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load ask the server if the session cookie belongs to someone
  useEffect(() => {
    api
      .get('/api/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(loginName, password) {
    const data = await api.post('/api/login', { login: loginName, password });
    setUser(data.user);
    return data.user;
  }

  async function register(values) {
    const data = await api.post('/api/register', values);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await api.post('/api/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
