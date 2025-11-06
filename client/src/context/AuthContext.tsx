import { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../config';

type User = { id: string; email: string; username: string } | null;

type AuthContextValue = {
  user: User;
  // True while we are waiting for the backend health check and auth refresh
  initializing: boolean;
  // True while just the auth refresh call is in-flight
  loading: boolean;
  // Optional status message for splash screen
  status?: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUserInMemory: (user: NonNullable<User> | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [status, setStatus] = useState<string | undefined>('Starting server...');

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
    let cancelled = false;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const checkHealth = async () => {
      let attempt = 0;
      while (!cancelled) {
        attempt += 1;
        try {
          setStatus(attempt === 1 ? 'Checking server health...' : 'Waking backend on Render...');
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
          clearTimeout(id);
          if (res.ok) return true;
        } catch (_e) {
          // ignore and retry
        }
        // backoff up to 2.5s
        const delay = Math.min(500 + attempt * 250, 2500);
        await sleep(delay);
      }
      return false;
    };

    (async () => {
      const ok = await checkHealth();
      if (cancelled) return;
      if (ok) setStatus('Signing you in...');
      await refresh();
      if (cancelled) return;
      setInitializing(false);
      setStatus(undefined);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, loading, status, refresh, logout, setUserInMemory }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}