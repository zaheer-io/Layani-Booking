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

export default function Home() {
  const { user, loading } = useAuth();
  const { cart } = useCart();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [viewCart, setViewCart] = useState(false);

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
    if (viewCart) return <CartView onSuccess={() => setViewCart(false)} />;
    
    switch (activeTab) {
      case 'home': return <DashboardView />;
      case 'menu': return <MenuView onViewCart={() => setViewCart(true)} />;
      case 'rewards': return <RewardsView />;
      case 'offers': return <OffersView />;
      case 'profile': return <ProfileView />;
      default: return <DashboardView />;
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

      {/* Cart Navigation Intercept */}
      {activeTab === 'menu' && cart.length > 0 && !viewCart && (
        <div className="hidden">
           {/* Logic handled inside MenuView for the floating button */}
        </div>
      )}
    </main>
  );
}
