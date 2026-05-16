'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LogOut, History, User, Phone, MapPin, ChevronRight, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfileView() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    };
    fetchHistory();
  }, [user]);

  return (
    <div className="pb-24 pt-6 px-6">
      <h1 className="text-3xl font-bold">Your Profile</h1>

      {/* User Info Card */}
      <div className="mt-8 bg-white border border-border rounded-3xl p-6 premium-shadow flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center border-4 border-primary/10 shadow-inner">
          <User className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mt-4">{user?.name}</h2>
        <div className="flex items-center gap-2 text-muted-foreground mt-1 font-medium">
          <Phone className="w-4 h-4" />
          <span>{user?.phone}</span>
        </div>
        
        <div className="flex gap-4 mt-8 w-full">
          <div className="flex-1 bg-surface rounded-2xl p-4 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Points</p>
            <p className="text-xl font-bold text-primary mt-1">{user?.points}</p>
          </div>
          <div className="flex-1 bg-surface rounded-2xl p-4 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Orders</p>
            <p className="text-xl font-bold text-foreground mt-1">{history.length}</p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="mt-10 space-y-4">
        <h3 className="text-xl font-bold">Activity</h3>
        
        <button className="w-full flex items-center justify-between p-4 bg-white border border-border rounded-2xl active:bg-surface transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <span className="font-bold">Order History</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 bg-white border border-border rounded-2xl active:bg-surface transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="font-bold">Store Locations</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Recent Orders */}
      {history.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {history.slice(0, 3).map((order) => (
              <div key={order.id} className="p-4 bg-white border border-border rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Order #...{order.id.slice(-4)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">₹{order.total}</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter",
                    order.status === 'pending' ? "text-amber-500" : "text-green-500"
                  )}>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="mt-12">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-2xl font-bold active:scale-95 transition-all border border-red-100"
        >
          <LogOut className="w-5 h-5" />
          Logout from Account
        </button>
      </div>
    </div>
  );
}
