import { useState, useCallback } from 'react';
import { api, type ApiUser } from '../services/api.js';

const STORAGE_KEY = 'scene-genie-auth';
const TOKEN_KEY = 'scene-genie-token';

export interface User {
  id: number;
  email: string;
  name: string;
}

function parseUser(stored: string | null): User | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as ApiUser;
    return { id: parsed.id, email: parsed.email, name: parsed.name };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return parseUser(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, user: apiUser } = await api.login(email, password);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiUser));
      setUser({ id: apiUser.id, email: apiUser.email, name: apiUser.name });
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, code: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const { token, user: apiUser } = await api.register(email, password, name, code);
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiUser));
        setUser({ id: apiUser.id, email: apiUser.email, name: apiUser.name });
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors (e.g., private mode)
    }
    setUser(null);
    setError(null);
  }, []);

  return { user, isLoggedIn, isLoading, error, login, logout, register };
}
