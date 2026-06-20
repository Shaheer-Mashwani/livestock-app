import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as loginAPI, getMe } from '../services/api';

// Create the context — like a "global box" to store auth data
const AuthContext = createContext();

// Custom hook — lets any component do: const { user, login } = useAuth();
export const useAuth = () => useContext(AuthContext);

// Provider component — wraps the whole app and provides auth data
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if a token already exists (user stayed logged in)
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token      = localStorage.getItem('token');

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // ── login function ──────────────────────────────────────────
  const login = async (username, password) => {
    const { data } = await loginAPI({ username, password });
    // data = { _id, username, fullName, role, token }

    // Save token + user info to localStorage so it survives page refresh
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));

    setUser(data);
    return data;
  };

  // ── logout function ─────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Helper: is the user allowed to do full actions (entry/edit)?
  const canEdit = user && (user.role === 'operator' || user.role === 'manager');

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
};
