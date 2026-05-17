'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Tag, Sparkles, Clock } from 'lucide-react';
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
            <div className="aspect-[16/9] w-full bg-surface rounded-[2rem] overflow-hidden border border-border shadow-2xl shadow-black/5 relative">
              <Image
                src={offer.image_url || ""}
                alt={offer.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                Exclusive Deal
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold text-white leading-tight">{offer.title}</h3>
                <p className="text-white/70 text-sm mt-2 font-medium">{offer.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/20">
                    <Clock className="w-3.5 h-3.5" />
                    Limited Time
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/80 font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                    <Tag className="w-3.5 h-3.5" />
                    PROMO: LAYANI20
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 bg-primary/5 border border-primary/10 rounded-[2rem] p-8 text-center border-dashed">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Have a coupon code?</h3>
        <p className="text-sm text-muted-foreground mt-2 px-6">Apply it during the checkout process to get extra points.</p>
        <button className="mt-6 text-primary font-bold text-sm uppercase tracking-widest underline decoration-2 underline-offset-8">
          Browse Active Coupons
        </button>
      </div>
    </div>
  );
}
