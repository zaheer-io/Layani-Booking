'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { Offer, Product, Booking, BookingItem, Reward } from '@/types';
import { Bell, Gift, TrendingUp, Plus, X, Coffee, User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BookingWithItems extends Booking {
  booking_items: (BookingItem & { products: Product })[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'welcome' | 'order' | 'points' | 'promo';
}

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.25 }
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.25 }
    }
  })
};

export default function DashboardView({ onViewCart }: { onViewCart?: () => void }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [activeBookings, setActiveBookings] = useState<BookingWithItems[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });

  const [activeOfferIdx, setActiveOfferIdx] = useState(0);
  const [direction, setDirection] = useState(0);

  const getNotificationIcon = (type?: string, title?: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'welcome':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <span className="text-sm">👋</span>
          </div>
        );
      case 'points':
      case 'promo':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
            <Gift className={iconClass} />
          </div>
        );
      case 'order':
      default:
        if (title?.toLowerCase().includes('cancelled') || title?.toLowerCase().includes('cancel')) {
          return (
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 flex-shrink-0">
              <span className="text-[10px] font-bold">❌</span>
            </div>
          );
        }
        return (
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 flex-shrink-0">
            <Coffee className={iconClass} />
          </div>
        );
    }
  };

  const deleteNotification = (id: string) => {
    if (id === 'welcome' && user) {
      localStorage.setItem(`welcome_dismissed_${user.id}`, 'true');
    }
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (user) {
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const activeOffers = offers;

  useEffect(() => {
    if (activeOffers.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setActiveOfferIdx((prev) => (prev + 1) % activeOffers.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeOffers.length]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: offersData } = await supabase.from('offers').select('*').limit(3);
      const { data: productsData } = await supabase.from('products').select('*').limit(4);
      const { data: rewardsData } = await supabase.from('rewards').select('*').order('required_points', { ascending: true });
      
      if (offersData) setOffers(offersData);
      if (productsData) setFeaturedProducts(productsData);
      if (rewardsData) setRewards(rewardsData);

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

    const channelRewards = supabase
      .channel('dashboard_rewards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, async () => {
        const { data } = await supabase.from('rewards').select('*').order('required_points', { ascending: true });
        if (data) setRewards(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelProducts);
      supabase.removeChannel(channelOffers);
      supabase.removeChannel(channelRewards);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let timerId: NodeJS.Timeout | undefined;

    // Load initial notifications from localstorage
    const stored = localStorage.getItem(`notifications_${user.id}`);
    const welcomeDismissed = localStorage.getItem(`welcome_dismissed_${user.id}`);
    
    if (stored) {
      timerId = setTimeout(() => {
        setNotifications(JSON.parse(stored));
      }, 0);
    } else {
      if (welcomeDismissed === 'true') {
        timerId = setTimeout(() => {
          setNotifications([]);
        }, 0);
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify([]));
      } else {
        const defaultNotif: NotificationItem[] = [
          {
            id: 'welcome',
            title: 'Welcome to Layani! 🌿',
            message: 'Order fresh chai, earn points, and claim exclusive rewards!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            type: 'welcome'
          }
        ];
        timerId = setTimeout(() => {
          setNotifications(defaultNotif);
        }, 0);
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(defaultNotif));
      }
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
            const ordId = `ORD-${booking.id.slice(-6).toUpperCase()}`;
            let title = 'Order Update';
            let message = `Your order ${ordId} status is now ${booking.status}.`;
            if (booking.status === 'approved') {
              title = 'Order Approved! 🍵';
              message = `Our kitchen is now preparing your order ${ordId}.`;
            } else if (booking.status === 'completed') {
              title = 'Order Completed! 🎉';
              message = `Your order ${ordId} is ready. Thank you for booking with Layani!`;
            } else if (booking.status === 'cancelled') {
              title = 'Order Cancelled ❌';
              message = `Your order ${ordId} has been cancelled.`;
            } else if (payload.eventType === 'INSERT') {
              title = 'Order Placed! 🛒';
              message = `We have received your order ${ordId} and it is pending approval.`;
            }

            const newNotif: NotificationItem = {
              id: `${booking.id}_${booking.status}_${Date.now()}`,
              title,
              message,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
              type: 'order'
            };

            setNotifications(prev => {
              // Safeguard against duplicate notifications from Postgres real-time
              const exists = prev.some(n => n.id.startsWith(`${booking.id}_${booking.status}`));
              if (exists) return prev;

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
      if (timerId) clearTimeout(timerId);
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

  const userPoints = user?.points || 0;
  
  // Find next locked reward
  const nextLocked = rewards.find(r => userPoints < r.required_points);
  // Find last unlocked reward
  const lastUnlocked = [...rewards].reverse().find(r => userPoints >= r.required_points);

  let progressPercent = 0;
  let nextRewardText = '';

  if (rewards.length === 0) {
    progressPercent = 0;
    nextRewardText = 'Unlock your first reward soon!';
  } else if (!nextLocked) {
    progressPercent = 100;
    nextRewardText = 'You have unlocked all rewards! 🎉';
  } else {
    const maxPoints = nextLocked.required_points;
    progressPercent = Math.round(Math.min(100, Math.max(0, (userPoints / maxPoints) * 100)));
    const pointsNeeded = maxPoints - userPoints;
    nextRewardText = `Earn ${pointsNeeded} more points for a ${nextLocked.title}!`;
  }

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
        
        <div className="flex items-center gap-3">
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
              className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-border shadow-sm text-foreground active:scale-95 transition-all relative group cursor-pointer"
            >
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                  {notifications.filter(n => !n.read).length}
                </span>
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
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications([]);
                          if (user) {
                            localStorage.setItem(`notifications_${user.id}`, JSON.stringify([]));
                            localStorage.setItem(`welcome_dismissed_${user.id}`, 'true');
                          }
                        }}
                        className="text-[10px] text-muted-foreground hover:text-primary font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No new notifications</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {notifications.map(n => (
                        <motion.div 
                          key={n.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className={cn(
                            "flex gap-3 p-2.5 rounded-xl transition-all relative group text-left",
                            n.read ? "bg-white hover:bg-neutral-50" : "bg-emerald-50/40 border-l-2 border-primary hover:bg-emerald-50/60"
                          )}
                        >
                          {getNotificationIcon(n.type, n.title)}
                          <div className="flex-grow text-xs min-w-0 pr-6">
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-extrabold text-foreground truncate">{n.title}</span>
                              <span className="text-[8px] text-muted-foreground font-semibold flex-shrink-0">{n.time}</span>
                            </div>
                            <p className="text-muted-foreground mt-0.5 leading-relaxed break-words">{n.message}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 rounded-md transition-all duration-200"
                            title="Dismiss notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-surface flex items-center justify-center shadow-sm">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={user.avatar_url} 
                alt={user?.name || 'User'} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
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
            <span className="text-[10px] font-medium text-muted-foreground">ORD-{activeBookings[0].id.slice(-6).toUpperCase()}</span>
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
        className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden"
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
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 bg-white/15 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.65)]"
              />
            </div>
            <p className="text-[10.5px] mt-2.5 text-emerald-100/90 font-medium">
              ✨ {nextRewardText}
            </p>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/5 rounded-full blur-xl" />
      </motion.div>

      {/* Offers Slider / Interactive Carousel */}
      {activeOffers.length > 0 && (
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-foreground tracking-tight">Special Offers & Promos</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Premium deals curated just for you</p>
            </div>
          </div>

          {/* Carousel Outer Wrapper - Glassmorphic / Vignette Card */}
          <div className="relative w-full h-[210px] rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl flex group">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeOfferIdx}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full flex"
              >
                {/* Full Bleed Background Image & Overlay */}
                <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
                  <Image
                    src={activeOffers[activeOfferIdx].image_url || 'https://images.unsplash.com/photo-1544787210-2211d4d98342?q=80&w=800'}
                    alt={activeOffers[activeOfferIdx].title}
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
                      {activeOffers[activeOfferIdx].discount_percent}% OFF
                    </span>
                    <h4 className="text-white font-extrabold text-lg leading-snug line-clamp-2 select-none drop-shadow-md">
                      {activeOffers[activeOfferIdx].title}
                    </h4>
                    <p className="text-white/70 text-xs mt-1.5 leading-relaxed line-clamp-2 select-none">
                      {activeOffers[activeOfferIdx].description}
                    </p>
                  </div>
                </div>

                {/* Voucher Top/Bottom Notches and Separator Line */}
                <div className="absolute -top-3 right-[32%] w-6 h-6 rounded-full bg-background z-20 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15)] pointer-events-none" />
                <div className="absolute -bottom-3 right-[32%] w-6 h-6 rounded-full bg-background z-20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] pointer-events-none" />
                <div className="absolute top-3 bottom-3 right-[32%] w-[1px] border-r-2 border-dashed border-white/20 z-20 pointer-events-none" />

                {/* Right Column: Stub / Promo code (32% width) */}
                <div className="w-[32%] relative z-10 h-full flex items-center justify-center pr-4">
                  {activeOffers[activeOfferIdx].code ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] uppercase font-black tracking-widest text-white/50 mb-1.5 select-none font-bold">PROMO CODE</span>
                      <span className="text-xs font-black tracking-widest text-emerald-300 bg-emerald-500/20 px-3 py-2 rounded-2xl border border-emerald-500/35 backdrop-blur-md shadow-inner select-all max-w-full truncate">
                        {activeOffers[activeOfferIdx].code}
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
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Pagination Dots */}
          {activeOffers.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {activeOffers.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > activeOfferIdx ? 1 : -1);
                    setActiveOfferIdx(i);
                  }}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    i === activeOfferIdx
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
                        <Plus className="w-3.5 h-3.5" /> Add to Plate
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
