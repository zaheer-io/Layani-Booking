'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/types';
import { LogOut, History, User, Phone, MapPin, ChevronRight, ShoppingBag, Edit2, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

import OrderHistoryView from './OrderHistoryView';

const PRESET_AVATARS = [
  // Style 1: avataaars (7 avatars)
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',

  // Style 2: adventurer (6 avatars)
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Alexander',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=James',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sadie',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ruby',

  // Style 3: lorelei (4 avatars)
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Midnight',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Ginger',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Cookie',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Toby',

  // Style 4: fun-emoji (3 avatars)
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bubblegum',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sun',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star'
];

export default function ProfileView() {
  const { user, logout, refreshUser } = useAuth();
  const [history, setHistory] = useState<Booking[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    if (user) {
      setNewName(user.name || '');
      setSelectedAvatar(user.avatar_url || '');
    }
    setIsEditing(true);
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: newName.trim(),
          avatar_url: selectedAvatar || null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (showHistory) {
    return <OrderHistoryView onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="pb-24 pt-6 px-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Image 
          src="/logo_WT.jpg" 
          alt="Layani Logo" 
          width={40} 
          height={40} 
          className="rounded-xl object-cover border border-border shadow-sm" 
        />
      </div>

      {/* User Info Card */}
      <div className="mt-8 bg-white border border-border rounded-3xl p-6 premium-shadow flex flex-col items-center text-center relative overflow-hidden">
        {/* Soft background accents */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-xl" />

        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white premium-shadow bg-surface flex items-center justify-center relative">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={user.avatar_url} 
                alt={user.name} 
                className="w-full h-full object-cover bg-orange-50" 
              />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>
          <button 
            onClick={startEditing}
            className="absolute bottom-0 right-0 bg-primary hover:bg-orange-600 text-white p-2 rounded-full shadow-md border-2 border-white active:scale-95 transition-all cursor-pointer"
            aria-label="Edit Profile"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <h2 className="text-2xl font-bold mt-4 flex items-center justify-center gap-2 text-foreground">
          {user?.name}
          <button 
            onClick={startEditing} 
            className="text-muted-foreground hover:text-primary active:scale-90 transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </h2>

        <div className="flex items-center gap-2 text-muted-foreground mt-1.5 font-medium bg-surface px-3.5 py-1 rounded-full border border-border/50 text-xs">
          <Phone className="w-3.5 h-3.5 text-primary" />
          <span>{user?.phone}</span>
        </div>
        
        <div className="flex gap-4 mt-8 w-full">
          <div className="flex-1 bg-surface rounded-2xl p-4 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1">
              <span>🪙</span> Total Points
            </p>
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
        
        <button 
          onClick={() => setShowHistory(true)}
          className="w-full flex items-center justify-between p-4 bg-white border border-border rounded-2xl active:bg-surface transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground">Order History</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <a 
          href="https://maps.app.goo.gl/4uhRhY5ehZsYY9Tu7"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-4 bg-white border border-border rounded-2xl active:bg-surface transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground">Store Locations</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </a>
      </div>

      {/* Recent Orders Preview */}
      {history.length > 0 && (
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Recent Bookings</h3>
            <button 
              onClick={() => setShowHistory(true)}
              className="text-primary text-xs font-bold cursor-pointer"
            >
              See All
            </button>
          </div>
          <div className="space-y-3">
            {history.slice(0, 3).map((order) => (
              <div key={order.id} className="p-4 bg-white border border-border rounded-2xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-foreground">Order ORD-{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-foreground">₹{order.total}</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter",
                    order.status === 'pending' ? "text-amber-500" : 
                    order.status === 'approved' ? "text-blue-500" :
                    "text-green-500"
                  )}>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="mt-12 mb-8">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-2xl font-bold active:scale-95 transition-all border border-red-100 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Logout from Account
        </button>
      </div>

      {/* Edit Profile Bottom Sheet */}
      <AnimatePresence>
        {isEditing && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsEditing(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] border-t border-border z-50 p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Edit Profile</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Current Avatar Selection Preview */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary bg-orange-50/50 flex items-center justify-center shadow-md">
                    {selectedAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedAvatar} alt="Selected Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary/80" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">Avatar Preview</span>
                </div>

                {/* Name Input */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Your Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>

                {/* Avatar Picker Section */}
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Choose an Avatar</label>
                    <button
                      type="button"
                      onClick={() => setSelectedAvatar('')}
                      className="text-xs font-bold text-primary active:scale-95 transition-all cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-3 border border-border rounded-2xl bg-surface/50">
                    {PRESET_AVATARS.map((avatarUrl, idx) => {
                      const isSelected = selectedAvatar === avatarUrl;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(avatarUrl)}
                          disabled={isSaving}
                          className={cn(
                            "relative aspect-square rounded-full p-0.5 border-2 transition-all overflow-hidden bg-white active:scale-90 hover:border-primary/50 cursor-pointer",
                            isSelected ? "border-primary scale-105 shadow-md" : "border-transparent"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatarUrl} alt={`Avatar Preset ${idx + 1}`} className="w-full h-full object-cover rounded-full" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-full">
                              <div className="bg-primary text-white p-0.5 rounded-full shadow">
                                <Check className="w-2.5 h-2.5 stroke-[4]" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100">
                    {error}
                  </p>
                )}

                {/* Save and Cancel buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="flex-1 py-3.5 border border-border bg-white text-muted-foreground rounded-2xl font-bold active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-bold active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
