'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { Offer, Product, Booking, BookingItem } from '@/types';
import { Bell, Gift, TrendingUp, ChevronRight, Plus } from 'lucide-react';
import Image from 'next/image';

interface BookingWithItems extends Booking {
  booking_items: (BookingItem & { products: Product })[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function DashboardView({ onViewCart }: { onViewCart?: () => void }) {
  const { user } = useAuth();
  const { addToCart, updateQuantity, cart } = useCart();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [activeBookings, setActiveBookings] = useState<BookingWithItems[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });

  const getProductQuantity = (id: string) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: offersData } = await supabase.from('offers').select('*').limit(3);
      const { data: productsData } = await supabase.from('products').select('*').limit(4);
      if (offersData) setOffers(offersData);
      if (productsData) setFeaturedProducts(productsData);

      if (user) {
        const { data: activeBookingsData } = await supabase
          .from('bookings')
          .select(`
            *,
            booking_items (
              *,
              products (*)
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['pending', 'approved'])
          .order('created_at', { ascending: false });

        if (activeBookingsData) {
          setActiveBookings(activeBookingsData as unknown as BookingWithItems[]);
        }
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const channelProducts = supabase
      .channel('dashboard_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*').limit(4);
        if (data) setFeaturedProducts(data);
      })
      .subscribe();

    const channelOffers = supabase
      .channel('dashboard_offers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, async () => {
        const { data } = await supabase.from('offers').select('*').limit(3);
        if (data) setOffers(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelProducts);
      supabase.removeChannel(channelOffers);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Load initial notifications from localstorage
    const stored = localStorage.getItem(`notifications_${user.id}`);
    if (stored) {
      setNotifications(JSON.parse(stored));
    } else {
      const defaultNotif: NotificationItem[] = [
        {
          id: 'welcome',
          title: 'Welcome to Layani! 🌿',
          message: 'Order fresh chai, earn points, and claim exclusive rewards!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false
        }
      ];
      setNotifications(defaultNotif);
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(defaultNotif));
    }

    const channel = supabase
      .channel('public:bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Realtime change received:', payload);
          // Refetch active bookings
          const { data: activeBookingsData } = await supabase
            .from('bookings')
            .select(`
              *,
              booking_items (
                *,
                products (*)
              )
            `)
            .eq('user_id', user.id)
            .in('status', ['pending', 'approved'])
            .order('created_at', { ascending: false });

          if (activeBookingsData) {
            setActiveBookings(activeBookingsData as unknown as BookingWithItems[]);
          }

          // If UPDATE or INSERT event, add notification
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const booking = payload.new as Booking;
            let title = 'Order Update';
            let message = `Your order status is now ${booking.status}.`;
            if (booking.status === 'approved') {
              title = 'Order Approved! 🍵';
              message = 'Our kitchen is now preparing your delicious tea.';
            } else if (booking.status === 'completed') {
              title = 'Order Completed! 🎉';
              message = 'Your order is ready. Thank you for booking with Layani!';
            } else if (booking.status === 'cancelled') {
              title = 'Order Cancelled ❌';
              message = 'Your order has been cancelled.';
            } else if (payload.eventType === 'INSERT') {
              title = 'Order Placed! 🛒';
              message = 'We have received your order and it is pending approval.';
            }

            const newNotif: NotificationItem = {
              id: `${booking.id}_${booking.status}_${Date.now()}`,
              title,
              message,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false
            };

            setNotifications(prev => {
              const updated = [newNotif, ...prev];
              localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
              return updated;
            });
            
            setToast({
              show: true,
              title: newNotif.title,
              message: newNotif.message
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Preparing your tea 🌿',
          percent: 66,
          color: 'text-blue-500 bg-blue-50 border-blue-100',
          barColor: 'bg-primary',
          step: 2
        };
      case 'pending':
      default:
        return {
          label: 'Order received',
          percent: 33,
          color: 'text-amber-500 bg-amber-50 border-amber-100',
          barColor: 'bg-amber-500',
          step: 1
        };
    }
  };

  const progress = (user?.points || 0) % 100;
  const nextReward = 100 - progress;

  return (
    <div className="pb-24 pt-6 px-6 relative">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-6 right-6 z-50 bg-foreground/95 text-white p-4 rounded-2xl border border-white/10 shadow-2xl flex gap-3 backdrop-blur-md"
          >
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/30">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-grow text-left">
              <h4 className="font-extrabold text-sm text-emerald-400">{toast.title}</h4>
              <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(prev => ({ ...prev, show: false }))} 
              className="text-white/40 hover:text-white text-xs font-bold self-start px-2 py-1 rounded"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <p className="text-muted-foreground font-medium text-xs">Hello,</p>
          <h1 className="text-2xl font-bold text-foreground leading-tight">{user?.name} 👋</h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (notifications.some(n => !n.read)) {
                setNotifications(prev => {
                  const updated = prev.map(n => ({ ...n, read: true }));
                  if (user) {
                    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
                  }
                  return updated;
                });
              }
            }}
            className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-border shadow-sm text-foreground active:scale-95 transition-all relative group"
          >
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-2xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                  <h4 className="font-extrabold text-sm">Notifications</h4>
                  <button 
                    onClick={() => {
                      setNotifications([]);
                      if (user) {
                        localStorage.removeItem(`notifications_${user.id}`);
                      }
                    }}
                    className="text-[10px] text-muted-foreground hover:text-primary font-bold"
                  >
                    Clear All
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No new notifications</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className="text-xs pb-2.5 border-b border-border last:border-0 text-left">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-extrabold text-foreground">{n.title}</span>
                          <span className="text-[9px] text-muted-foreground font-semibold">{n.time}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Live Order Status Card */}
      {activeBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/80 rounded-3xl p-5 shadow-lg shadow-emerald-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl animate-pulse" />
          
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Order Tracker</span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">#{activeBookings[0].id.slice(-6).toUpperCase()}</span>
          </div>

          <h3 className="font-extrabold text-foreground text-base text-left">
            {getStatusDetails(activeBookings[0].status).label}
          </h3>

          <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center">
            <p className="line-clamp-1 max-w-[70%] font-medium text-left">
              {activeBookings[0].booking_items?.map(item => `${item.quantity}x ${item.products?.name}`).join(', ')}
            </p>
            <p className="font-extrabold text-foreground">₹{activeBookings[0].total}</p>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-emerald-100/50 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getStatusDetails(activeBookings[0].status).percent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${getStatusDetails(activeBookings[0].status).barColor} rounded-full`}
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-muted-foreground mt-2">
              <span className={activeBookings[0].status === 'pending' || activeBookings[0].status === 'approved' ? 'text-emerald-600 font-extrabold' : ''}>Received</span>
              <span className={activeBookings[0].status === 'approved' ? 'text-emerald-600 font-extrabold' : ''}>Preparing</span>
              <span>Ready</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Points Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-primary rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden"
      >
        <div className="relative z-10 text-left">
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
              <div className="absolute bottom-4 left-4 right-4 text-left">
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
          {featuredProducts.map((product, idx) => {
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-white border border-border p-3 rounded-2xl premium-shadow transition-transform flex flex-col justify-between"
              >
                <div className="flex flex-col h-full">
                  <div className="aspect-square bg-surface rounded-xl overflow-hidden mb-3 relative shrink-0">
                    <Image
                      src={product.image_url || ""}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-grow justify-between text-left">
                    <h4 className="font-bold text-sm line-clamp-2 text-foreground mb-2 leading-tight">{product.name}</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-extrabold text-base">₹{product.price}</p>
                        {product.points && product.points > 0 ? (
                          <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded border border-amber-100 flex items-center gap-0.5 shadow-sm">
                            🪙 +{product.points}
                          </span>
                        ) : null}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                          onViewCart?.();
                        }}
                        className="w-full bg-primary text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-transform"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
