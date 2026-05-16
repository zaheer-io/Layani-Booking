'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  phone: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (name: string, phone: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        } catch (e) {
          localStorage.removeItem('layani_user');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (name: string, phone: string) => {
    setLoading(true);
    try {
      // Check if user exists
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (existingUser) {
        setUser(existingUser);
        localStorage.setItem('layani_user', JSON.stringify(existingUser));
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ name, phone, points: 0 }])
          .select()
          .single();

        if (insertError) throw insertError;
        setUser(newUser);
        localStorage.setItem('layani_user', JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('layani_user');
  };

  const refreshUser = async () => {
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
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
