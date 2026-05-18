'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import SplashScreen from '@/components/SplashScreen';
import LoginScreen from '@/components/LoginScreen';
import DashboardView from '@/components/DashboardView';
import MenuView from '@/components/MenuView';
import RewardsView from '@/components/RewardsView';
import OffersView from '@/components/OffersView';
import ProfileView from '@/components/ProfileView';
import CartView from '@/components/CartView';
import BottomNav from '@/components/BottomNav';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

export default function Home() {
  const { user, loading, message, setMessage } = useAuth();
  const { cart } = useCart();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [viewCart, setViewCart] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, setMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || (loading && !user)) {
    return <SplashScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderView = () => {
    if (viewCart) return <CartView onSuccess={() => setViewCart(false)} onBack={() => setViewCart(false)} />;
    
    switch (activeTab) {
      case 'home': return <DashboardView onViewCart={() => setViewCart(true)} />;
      case 'menu': return <MenuView onViewCart={() => setViewCart(true)} />;
      case 'rewards': return <RewardsView onBack={() => setActiveTab('home')} />;
      case 'offers': return <OffersView />;
      case 'profile': return <ProfileView />;
      default: return <DashboardView onViewCart={() => setViewCart(true)} />;
    }
  };

  return (
    <main className="min-h-screen bg-background max-w-md mx-auto relative shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewCart ? 'cart' : activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      <BottomNav 
        activeTab={viewCart ? 'none' : activeTab} 
        setActiveTab={(tab) => {
          setViewCart(false);
          setActiveTab(tab);
        }} 
      />

      {/* Global Floating Cart Button for Non-Menu Tabs */}
      <AnimatePresence>
        {activeTab !== 'menu' && cart.length > 0 && !viewCart && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewCart(true)}
            className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center border-2 border-background"
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Global Toast Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-50 bg-foreground text-background px-6 py-4 rounded-xl shadow-xl flex items-center justify-center text-center font-medium"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
