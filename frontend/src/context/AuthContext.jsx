import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete api.defaults.headers.common.Authorization;
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete api.defaults.headers.common.Authorization;
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data;

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      api.defaults.headers.common.Authorization = `Bearer ${userData.token}`;
      setUser(userData);

      return userData;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const data = response.data;

    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('token', data.token);
    api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setUser(data);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    const updatedUser = response.data;

    localStorage.setItem('user', JSON.stringify(updatedUser));

    if (updatedUser.token) {
      localStorage.setItem('token', updatedUser.token);
      api.defaults.headers.common.Authorization = `Bearer ${updatedUser.token}`;
    }

    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};