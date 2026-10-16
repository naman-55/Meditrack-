import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User, LoginCredentials, RegisterCredentials } from '../api/auth';
import { setAccessToken, getAccessToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // Safety timeout: ensure loading state never hangs permanently
      const safetyTimeout = setTimeout(() => {
        if (isMounted) setIsLoading(false);
      }, 2000);

      try {
        const token = getAccessToken();
        if (token) {
          const userData = await authService.getCurrentUser();
          if (isMounted) setUser(userData);
        } else {
          // If no token in local storage, attempt silent session refresh via cookie
          try {
            const refreshRes = await authService.refreshSession();
            if (refreshRes?.access_token && isMounted) {
              const userData = await authService.getCurrentUser();
              if (isMounted) setUser(userData);
            } else if (isMounted) {
              setUser(null);
            }
          } catch {
            if (isMounted) setUser(null);
          }
        }
      } catch (error) {
        try {
          const refreshRes = await authService.refreshSession();
          if (refreshRes?.access_token && isMounted) {
            const userData = await authService.getCurrentUser();
            if (isMounted) setUser(userData);
          } else if (isMounted) {
            setAccessToken(null);
            setUser(null);
          }
        } catch {
          if (isMounted) {
            setAccessToken(null);
            setUser(null);
          }
        }
      } finally {
        clearTimeout(safetyTimeout);
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    await authService.login(credentials);
    const userData = await authService.getCurrentUser();
    setUser(userData);
  };

  const register = async (credentials: RegisterCredentials) => {
    await authService.register(credentials);
    await login({ email: credentials.email, password: credentials.password });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout warning:', e);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
