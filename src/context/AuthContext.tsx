'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  message: string | null;
  setMessage: (msg: string | null) => void;
  login: (name: string, phone: string, mode?: 'login' | 'register') => Promise<{ user: User, isExisting: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem('layani_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Verify with Supabase
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', parsedUser.phone)
            .single();

          if (data && !error) {
            setUser(data);
            localStorage.setItem('layani_user', JSON.stringify(data));
          } else {
            localStorage.removeItem('layani_user');
          }
        } catch {
          localStorage.removeItem('layani_user');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('public:users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            setUser(payload.new as User);
            localStorage.setItem('layani_user', JSON.stringify(payload.new));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const login = React.useCallback(async (name: string, phone: string, mode: 'login' | 'register' = 'register') => {
    setLoading(true);
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (existingUser) {
        setUser(existingUser);
        localStorage.setItem('layani_user', JSON.stringify(existingUser));
        return { user: existingUser, isExisting: true };
      } else {
        if (mode === 'login') {
          throw new Error('User not found. Please register first.');
        }
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ name, phone, points: 0 }])
          .select()
          .single();

        if (insertError) throw insertError;
        setUser(newUser);
        localStorage.setItem('layani_user', JSON.stringify(newUser));
        return { user: newUser, isExisting: false };
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    localStorage.removeItem('layani_user');
  }, []);

  const refreshUser = React.useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setUser(data);
      localStorage.setItem('layani_user', JSON.stringify(data));
    }
  }, [user]);

  const value = React.useMemo(() => ({ 
    user, 
    loading, 
    message,
    setMessage,
    login, 
    logout, 
    refreshUser 
  }), [user, loading, message, setMessage, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
