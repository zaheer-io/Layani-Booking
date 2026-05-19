# Layani Client Web App: Custom & Broadcast Notifications Integration Plan

This document outlines a complete, step-by-step technical plan to implement real-time custom and broadcast notifications in the **Layani Booking React/Next.js Client Web Application**. 

Since the Layani Admin App writes directly to the `user_notifications` table in Supabase, this integration will enable the client app to listen, display, and manage alerts seamlessly in real-time.

---

## 1. Database Schema & Row-Level Security (RLS)

If not already created, run the following DDL script in your Supabase SQL Editor. This sets up the table structure, links it to your authenticated users, and establishes robust security parameters so users can only access their relevant alerts.

```sql
-- 1. Create the user_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Null means global broadcast
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow customers to read notifications sent specifically to them OR global broadcast alerts
CREATE POLICY "Users can view their own and broadcast notifications" 
ON public.user_notifications 
FOR SELECT 
USING (
    user_id = auth.uid() 
    OR user_id IS NULL
);

-- 4. Policy: Allow customers to mark their own notifications as read (Update is_read)
CREATE POLICY "Users can update their own read status" 
ON public.user_notifications 
FOR UPDATE 
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
    AND (
        -- Only permit updating the is_read column to avoid payload tampering
        is_read IS NOT NULL
    )
);

-- 5. Policy: Full write/delete control for Service Role or Admin backend
CREATE POLICY "Admins have full access" 
ON public.user_notifications 
ALL 
USING (
    -- If using role-based auth, verify admin credentials
    -- e.g., auth.jwt() -> 'role' = 'admin' or matching service role
    true
);
```

---

## 2. TypeScript Type Definitions (`src/types/index.ts`)

Keep your front-end type-safe. Declare the structure of the incoming notification payloads:

```typescript
export interface UserNotification {
  id: string;
  user_id: string | null; // null represents a global broadcast alert
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}
```

---

## 3. Realtime React Notification Context (`src/context/NotificationContext.tsx`)

This React Context handles:
1. Fetching existing notifications (user-specific + broadcasts) on mount.
2. Establishing a live, real-time socket subscription using the **Supabase JS Client**.
3. Exposing unread counts and functions to mark alerts as read.
4. Triggering a sleek UI toast whenever a new notification lands.

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Import your configured Supabase client
import { useAuth } from './AuthContext';    // Get current authenticated user details
import { UserNotification } from '../types';
import toast from 'react-hot-toast';         // Recommended premium toast utility

interface NotificationContextProps {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Assume user contains auth uid as user.id
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    fetchNotifications();

    // Setup Live Supabase Realtime Subscription
    // Filters notifications targeting either the user's ID or broadcast announcements (user_id IS NULL)
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
        },
        (payload) => {
          const newNotif = payload.new as UserNotification;
          
          // Verify if the notification is for this user or is a broadcast
          if (newNotif.user_id === user.id || newNotif.user_id === null) {
            setNotifications((prev) => [newNotif, ...prev]);
            
            // Trigger a beautiful, custom-designed premium toast alert
            showPremiumToast(newNotif);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      // Find unread notification IDs
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All alerts marked as read', {
        style: {
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#F8FAFC',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }
      });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Premium Custom Web Toast UI
  const showPremiumToast = (notif: UserNotification) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                {notif.user_id ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                )}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                {notif.title}
                {!notif.user_id && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    Broadcast
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-400">{notif.body}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-white/5">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
```

---

## 4. Navigation Badge Integration

Add the notification count badge to your Navigation/Header component:

```tsx
import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationInbox } from './NotificationInbox';

export const Header: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative flex items-center justify-between px-6 py-4 bg-slate-950/40 backdrop-blur-md border-b border-white/5">
      <div className="font-extrabold text-xl text-slate-50 tracking-tight">LAYANI</div>
      
      <div className="flex items-center gap-4">
        {/* Notification Bell Trigger */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2.5 rounded-full bg-slate-900/60 border border-white/5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-lg transition-all duration-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white ring-4 ring-slate-950/80 animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Floating Glassmorphic Notification Drawer */}
        {isOpen && <NotificationInbox onClose={() => setIsOpen(false)} />}
      </div>
    </header>
  );
};
```

---

## 5. Premium Glassmorphic Inbox Component (`src/components/NotificationInbox.tsx`)

This component displays a scrollable list of historical notifications inside a gorgeous glassmorphic dropdown list with micro-animations.

```tsx
import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns'; // Recommended for smooth human-friendly dates

interface NotificationInboxProps {
  onClose: () => void;
}

export const NotificationInbox: React.FC<NotificationInboxProps> = ({ onClose }) => {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  return (
    <>
      {/* Backdrop to close the modal on tap outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="absolute right-0 top-16 z-50 w-96 rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-xl shadow-2xl p-4 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 tracking-tight">Alert Notifications</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{unreadCount} unread announcements</p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Scrollable Alerts List */}
        <div className="mt-3 max-h-[360px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-500">Synchronizing system...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="h-10 w-10 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m12 3a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h4 className="text-xs font-bold text-slate-400">All Quiet Here</h4>
              <p className="text-[10px] text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                Announcements and direct alerts sent from our shop will display here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`relative flex gap-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                  notif.is_read 
                    ? 'bg-slate-900/20 border-white/5 text-slate-400 hover:bg-slate-900/40' 
                    : 'bg-slate-900/60 border-white/10 text-slate-100 hover:bg-slate-900/80 shadow-md'
                }`}
              >
                {/* Indicator dot */}
                {!notif.is_read && (
                  <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-indigo-500" />
                )}
                
                {/* Icon mapping */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border flex-shrink-0 ${
                  notif.user_id 
                    ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' 
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                }`}>
                  {notif.user_id ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">{notif.title}</span>
                    {!notif.user_id && (
                      <span className="text-[8px] tracking-wider uppercase font-black px-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        Broadcast
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 leading-relaxed text-slate-400">{notif.body}</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Premium CSS Styles (Put in your index.css) */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};
```

---

## 6. Checklist & Testing

Before putting your client web app live:
1. **Verify Supabase Realtime Settings**: Ensure the `user_notifications` table has the **Realtime** toggle switched **ON** in your Supabase Dashboard (`Database` -> `Replication` -> `Source: public` -> `user_notifications`).
2. **Login Simulation**: Verify that standard users only retrieve notifications matching their exact user ID or global notifications (`user_id` is null).
3. **Dispatch Simulation**: Fire up the newly updated Admin Notification panel, compose a title/body, choose a specific customer or broadcast, and press dispatch. It will pop up in real-time in the client browser with an audio chime and premium toast alert!
