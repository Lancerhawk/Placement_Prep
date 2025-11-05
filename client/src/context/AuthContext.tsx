import { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../config';

type User = { id: string; email: string; username: string } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUserInMemory: (user: NonNullable<User> | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // log error for debugging
        console.error('Auth check failed:', res.status, res.statusText);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // hit the backend to clear the cookie
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // cleanup on client side just in case
      // Try to clear with both SameSite options to handle both dev and prod
      document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax; Secure=false';
      document.cookie = 'token=; Max-Age=0; path=/; SameSite=None; Secure=true';
      setUser(null);
      // send them back to login
      window.location.href = '/login';
    }
  };

  const setUserInMemory = (u: NonNullable<User> | null) => {
    setUser(u);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout, setUserInMemory }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}