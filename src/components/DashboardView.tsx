'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Offer, Product } from '@/types';
import { Star, Gift, TrendingUp, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function DashboardView() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: offersData } = await supabase.from('offers').select('*').limit(3);
      const { data: productsData } = await supabase.from('products').select('*').limit(4);
      if (offersData) setOffers(offersData);
      if (productsData) setFeaturedProducts(productsData);
    };
    fetchData();
  }, []);

  const progress = (user?.points || 0) % 100;
  const nextReward = 100 - progress;

  return (
    <div className="pb-24 pt-6 px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="h-8">
          <Image 
            src="/logo_WT.jpg" 
            alt="Layani Logo" 
            width={120}
            height={32}
            className="h-full w-auto object-contain"
          />
        </div>
        <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-border shadow-sm">
          <Star className="text-primary w-5 h-5 fill-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-muted-foreground font-medium text-sm">Hello,</p>
        <h1 className="text-2xl font-bold">{user?.name} 👋</h1>
      </motion.div>


      {/* Points Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 bg-primary rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Points</p>
              <h2 className="text-4xl font-bold mt-1">{user?.points}</h2>
            </div>
            <Gift className="w-10 h-10 text-white/40" />
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span>Next Reward Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              />
            </div>
            <p className="text-[10px] mt-2 text-white/70 italic">
              * Earn {nextReward} more points for a free tea!
            </p>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/5 rounded-full blur-xl" />
      </motion.div>

      {/* Offers Slider */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Featured Offers</h3>
          <button className="text-primary text-sm font-semibold flex items-center">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
          {offers.map((offer, idx) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="min-w-[280px] h-40 bg-surface rounded-2xl relative overflow-hidden border border-border group"
            >
              <Image
                src={offer.image_url || 'https://images.unsplash.com/photo-1544787210-2211d4d98342?q=80&w=500'}
                alt={offer.title}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h4 className="text-white font-bold text-lg leading-tight">{offer.title}</h4>
                <p className="text-white/80 text-xs mt-1 line-clamp-1">{offer.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending Items */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Trending Now <TrendingUp className="w-4 h-4 text-primary" />
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {featuredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="bg-white border border-border p-3 rounded-2xl premium-shadow active:scale-95 transition-transform"
            >
              <div className="aspect-square bg-surface rounded-xl overflow-hidden mb-3">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="font-bold text-sm line-clamp-1">{product.name}</h4>
              <p className="text-primary font-bold mt-1">₹{product.price}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
