'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Booking, BookingItem, Product } from '@/types';
import { ChevronLeft, ShoppingBag, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BookingWithItems extends Booking {
  booking_items: (BookingItem & { products: Product })[];
}

interface OrderHistoryViewProps {
  onBack: () => void;
}

export default function OrderHistoryView({ onBack }: OrderHistoryViewProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
      } else if (data) {
        setBookings(data as unknown as BookingWithItems[]);
      }
      setLoading(false);
    };

    fetchHistory();

    if (!user?.id) return;

    const channel = supabase
      .channel('history_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'approved': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="pb-32 pt-6 px-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-border shadow-sm active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold">Order History</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground mt-4 font-medium">Loading your history...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-border">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold">No orders yet</h3>
          <p className="text-muted-foreground mt-2">Your tea journey starts when you place your first order!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const totalBookingPoints = booking.booking_items?.reduce(
              (acc, item) => acc + (item.products?.points || 0) * item.quantity, 
              0
            ) || 0;
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-border rounded-3xl overflow-hidden premium-shadow"
              >
                <div className="p-5 border-b border-border bg-surface/50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order ID</p>
                    <p className="font-bold text-sm">#...{booking.id.slice(-6)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</p>
                    <p className="font-bold text-sm">{new Date(booking.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {booking.booking_items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface rounded-lg overflow-hidden relative border border-border">
                          <Image 
                            src={item.products?.image_url || '/placeholder.jpg'} 
                            alt={item.products?.name || 'Product'} 
                            fill 
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.products?.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                            {item.products?.points && item.products.points > 0 ? (
                              <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded border border-amber-100/50 flex items-center gap-0.5">
                                🪙 +{item.products.points * item.quantity}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-sm">₹{item.products?.price * item.quantity}</p>
                    </div>
                  ))}

                  {totalBookingPoints > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-amber-600 bg-amber-50/40 px-3 py-2 rounded-xl border border-amber-100/50">
                      <span className="flex items-center gap-1 font-medium">Points to Earn</span>
                      <span className="flex items-center gap-0.5 font-bold">🪙 +{totalBookingPoints}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border flex justify-between items-end">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {getStatusIcon(booking.status)}
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-tighter",
                          booking.status === 'completed' ? "text-green-500" :
                          booking.status === 'approved' ? "text-blue-500" :
                          booking.status === 'cancelled' ? "text-red-500" : "text-amber-500"
                        )}>
                          {booking.status}
                        </span>
                      </div>
                      {booking.notes && (
                        <p className="text-[10px] text-muted-foreground italic line-clamp-1 max-w-[150px]">
                          &ldquo;{booking.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Paid</p>
                      <p className="text-xl font-bold text-primary">₹{booking.total}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
