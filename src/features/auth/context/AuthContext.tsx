import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      const raw = await AsyncStorage.getItem('auth:user');
      if (raw) {
        setUser(JSON.parse(raw));
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: replace with real API
    const fakeUser = { id: '1', email };
    setUser(fakeUser);
    await AsyncStorage.setItem('auth:user', JSON.stringify(fakeUser));
  };

  const register = async (email: string, password: string) => {
    // TODO: replace with real API
    const fakeUser = { id: '1', email };
    setUser(fakeUser);
    await AsyncStorage.setItem('auth:user', JSON.stringify(fakeUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('auth:user');
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
