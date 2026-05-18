'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Sparkles } from 'lucide-react';
import { Offer } from '@/types';
import Image from 'next/image';

export default function OffersView() {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    const fetchOffers = async () => {
      const { data } = await supabase.from('offers').select('*');
      if (data) setOffers(data as Offer[]);
    };
    fetchOffers();

    const channelOffers = supabase
      .channel('offers_view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        fetchOffers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelOffers);
    };
  }, []);

  return (
    <div className="pb-24 pt-6 px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Special Offers <Sparkles className="w-6 h-6 text-primary fill-primary" />
        </h1>
        <Image 
          src="/logo_WT.jpg" 
          alt="Layani Logo" 
          width={40} 
          height={40} 
          className="rounded-xl object-cover border border-border shadow-sm" 
        />
      </div>
      <p className="text-muted-foreground mt-2">Handpicked deals just for you.</p>

      <div className="mt-10 space-y-8">
        {offers.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-[2rem] border border-dashed border-border">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No active offers</h3>
            <p className="text-muted-foreground mt-2">Check back later for new deals and special promotions!</p>
          </div>
        ) : offers.map((offer, idx) => (
            <motion.div
              key={offer.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="group relative"
          >
            <div className="relative w-full h-[210px] rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl flex group">
              {/* Full Bleed Background Image & Overlay */}
              <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
                <Image
                  src={offer.image_url || 'https://images.unsplash.com/photo-1544787210-2211d4d98342?q=80&w=800'}
                  alt={offer.title}
                  fill
                  className="object-cover transition-transform duration-1000 scale-100 group-hover:scale-[1.03]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/35" />
              </div>

              {/* Left Column: Details (68% width) */}
              <div className="w-[68%] p-6 flex flex-col justify-between relative z-10 text-left h-full">
                <div>
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-full w-fit mb-3 block select-none backdrop-blur-md">
                    {offer.discount_percent}% OFF
                  </span>
                  <h4 className="text-white font-extrabold text-lg leading-snug line-clamp-2 select-none drop-shadow-md">
                    {offer.title}
                  </h4>
                  <p className="text-white/70 text-xs mt-1.5 leading-relaxed line-clamp-2 select-none">
                    {offer.description}
                  </p>
                </div>
              </div>

              {/* Voucher Top/Bottom Notches and Separator Line */}
              <div className="absolute -top-3 right-[32%] w-6 h-6 rounded-full bg-background z-20 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15)] pointer-events-none" />
              <div className="absolute -bottom-3 right-[32%] w-6 h-6 rounded-full bg-background z-20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] pointer-events-none" />
              <div className="absolute top-3 bottom-3 right-[32%] w-[1px] border-r-2 border-dashed border-white/20 z-20 pointer-events-none" />

              {/* Right Column: Stub / Promo code (32% width) */}
              <div className="w-[32%] relative z-10 h-full flex items-center justify-center pr-4">
                {offer.code ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] uppercase font-black tracking-widest text-white/50 mb-1.5 select-none font-bold">PROMO CODE</span>
                    <span className="text-xs font-black tracking-widest text-emerald-300 bg-emerald-500/20 px-3 py-2 rounded-2xl border border-emerald-500/35 backdrop-blur-md shadow-inner select-all max-w-full truncate">
                      {offer.code}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black tracking-widest text-emerald-400 select-none bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                      AUTO-APPLIED
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
