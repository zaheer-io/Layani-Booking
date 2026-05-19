'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { 
  Gift, 
  Lock, 
  CheckCircle2, 
  Trophy, 
  ArrowLeft, 
  Search, 
  Coins, 
  Medal, 
  Star, 
  Clock, 
  XCircle, 
  Calendar, 
  Sparkles,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reward } from '@/types';
import Image from 'next/image';

interface RewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'refunded' | 'refund';
  created_at: string;
  rewards: Reward;
}

interface RewardsViewProps {
  onBack?: () => void;
}

// High-Fidelity Real QR Code Generator using a secure, free public API with 30% Error Correction (to support center logo overlay)
const QRCode = ({ value }: { value: string }) => {
  return (
    <div className="relative w-36 h-36 bg-white border border-neutral-100 rounded-2xl p-2.5 flex items-center justify-center shadow-inner select-none">
      {/* Real scannable QR Code */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value)}&ecc=H&color=17-17-17`}
        alt="Redemption QR Code"
        width={110}
        height={110}
        className="w-[110px] h-[110px] object-contain select-none"
        draggable={false}
      />
      {/* Center Layani Premium Badge */}
      <div className="absolute w-8 h-8 bg-amber-500 rounded-xl border-2 border-white shadow-md flex items-center justify-center font-black text-white text-[10px] select-none pointer-events-none">
        LYN
      </div>
    </div>
  );
};

export default function RewardsView({ onBack }: RewardsViewProps) {
  const { user, refreshUser } = useAuth();
  const { showAlert } = useAlert();
  
  // Tabs & Searching
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  
  // Dropdown & Expand State
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  // Tier Thresholds: Static 300 and 800 milestones
  const maxRewardPoints = rewards.length > 0 ? Math.max(...rewards.map(r => r.required_points)) : 1000;
  const bronzeThreshold = 300; // Gold Milestone
  const goldThreshold = 800;   // Platinum Milestone



  const fetchData = useCallback(async () => {
    const { data: rewardsData } = await supabase
      .from('rewards')
      .select('*')
      .order('required_points', { ascending: true });
    if (rewardsData) setRewards(rewardsData);

    if (user) {
      const { data: claimsData } = await supabase
        .from('reward_claims')
        .select('*, rewards(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (claimsData) setClaims(claimsData as unknown as RewardClaim[]);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    // Subscribe to reward_claims postgres changes
    const claimsChannel = supabase
      .channel('rewards_claims_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_claims' }, () => {
        fetchData();
        refreshUser();
      })
      .subscribe();

    // Subscribe to rewards postgres changes
    const rewardsChannel = supabase
      .channel('rewards_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => {
        fetchData();
      })
      .subscribe();

    // Subscribe to users table to sync points automatically in real-time
    let usersChannel: any;
    if (user?.id) {
      usersChannel = supabase
        .channel('users_points_realtime')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
          () => {
            refreshUser();
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(claimsChannel);
      supabase.removeChannel(rewardsChannel);
      if (usersChannel) {
        supabase.removeChannel(usersChannel);
      }
    };
  }, [fetchData, refreshUser, user?.id]);

  // Reward Tier Details based on required points
  const getRewardTierDetails = (points: number) => {
    if (points <= 250) {
      return {
        name: 'BRONZE',
        color: '#b07d62',
        gradient: 'linear-gradient(135deg, #3d1f08 0%, #201004 60%, #0d0601 100%)',
        icon: <Trophy className="w-5 h-5 text-[#b07d62]" />,
        watermark: <Trophy className="w-28 h-28 text-white/5" />
      };
    } else if (points <= 750) {
      return {
        name: 'GOLD',
        color: '#fbbf24',
        gradient: 'linear-gradient(135deg, #5c300d 0%, #2c1706 60%, #0d0601 100%)',
        icon: <Medal className="w-5 h-5 text-[#fbbf24]" />,
        watermark: <Medal className="w-28 h-28 text-white/5" />
      };
    } else {
      return {
        name: 'PLATINUM',
        color: '#94a3b8',
        gradient: 'linear-gradient(135deg, #1f2f42 0%, #101924 60%, #060b10 100%)',
        icon: <Star className="w-5 h-5 text-[#94a3b8]" />,
        watermark: <Star className="w-28 h-28 text-white/5" />
      };
    }
  };

  const handleClaim = async (reward: Reward) => {
    if (!user || user.points < reward.required_points) return;
    
    try {
      const { error: claimError } = await supabase
        .from('reward_claims')
        .insert([{ user_id: user.id, reward_id: reward.id, status: 'pending' }]);

      if (claimError) throw claimError;

      // Deduct points
      const { error: userError } = await supabase
        .from('users')
        .update({ points: user.points - reward.required_points })
        .eq('id', user.id);

      if (userError) throw userError;

      showAlert(
        'Claim Placed Successfully!',
        `"${reward.title}" has been successfully claimed! Check your Claims History for details.`,
        'reward'
      );
      refreshUser();
      fetchData(); // Refresh history
      setActiveTab('history'); // Switch automatically to show their active pending claim
    } catch (error) {
      console.error('Claim error:', error);
      showAlert('Claim Failed', 'Failed to claim reward. Please try again.', 'error');
    }
  };



  // Math mapping for dynamic progress bar (Adaptive piecewise algorithm to prevent marker congestion)
  const userPoints = user?.points || 0;
  const progressMax = Math.max(maxRewardPoints, 1000);

  // Dynamically calculate Gold and Platinum marker percentages to avoid visual congestion
  const interpolationFactor = Math.min(1, (progressMax - 1000) / 2000);
  const goldMarkerPercent = 40 - 15 * interpolationFactor; // Dynamically slides between 40% and 25%
  const platinumMarkerPercent = 85 - 25 * interpolationFactor; // Dynamically slides between 85% and 60%

  const getProgressPercentage = (pts: number) => {
    if (pts <= 0) return 0;
    if (pts <= 300) {
      return (pts / 300) * goldMarkerPercent;
    }
    if (pts <= 800) {
      return goldMarkerPercent + ((pts - 300) / 500) * (platinumMarkerPercent - goldMarkerPercent);
    }
    const extraRange = progressMax - 800;
    if (extraRange <= 0) return platinumMarkerPercent;
    const progressOverGold = pts - 800;
    return platinumMarkerPercent + (Math.min(extraRange, progressOverGold) / extraRange) * (100 - platinumMarkerPercent);
  };

  const percentage = getProgressPercentage(userPoints);

  // Encouragement helper
  const nextLockedReward = rewards.find(r => userPoints < r.required_points);

  // Catalog filtering
  const filteredRewards = rewards.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 pt-6 px-6 relative min-h-screen bg-background">
      
      {/* Centered Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        {onBack ? (
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-surface border border-border rounded-xl text-foreground hover:bg-neutral-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
        <h1 className="text-xl font-extrabold text-foreground tracking-tight select-none">Loyalty Rewards Catalog</h1>
        <Image 
          src="/logo_WT.jpg" 
          alt="Layani Logo" 
          width={40} 
          height={40} 
          className="rounded-xl object-cover border border-border shadow-sm" 
        />
      </div>

      {/* Search Bar */}
      <div className="mt-6 flex items-center bg-white border border-border rounded-2xl p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rewards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border-0 focus:ring-0 rounded-xl pl-10 pr-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/60 transition-all font-medium"
          />
        </div>
      </div>

      {/* Points Summary & Premium Milestones progress bar */}
      <div className="mt-6 bg-white border border-border rounded-[2rem] p-6 premium-shadow flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute right-4 top-4 text-primary/10 pointer-events-none transform -rotate-12 scale-150">
          <Trophy className="w-16 h-16" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Available Balance</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-4xl font-extrabold text-primary select-all">{userPoints}</span>
              <span className="font-bold text-muted-foreground text-xs uppercase tracking-wider pl-1">Points</span>
            </div>
          </div>
          
          <div className="px-4 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] rounded-full text-xs font-black uppercase tracking-wider">
            {userPoints >= goldThreshold ? 'Platinum Tier' : userPoints >= bronzeThreshold ? 'Gold Tier' : 'Bronze Tier'}
          </div>
        </div>

        {/* Milestone Progress bar */}
        <div className="w-full flex flex-col gap-2 relative z-10 pt-2 border-t border-neutral-50">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground mb-1 select-none">
            <span>Prestige Level</span>
            <span className="text-primary font-bold">{userPoints} Total Points</span>
          </div>
          
          <div className="h-3 bg-neutral-100 rounded-full w-full relative flex items-center">
            {/* Fill */}
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-[#fbbf24] shadow-[0_0_10px_rgba(245,158,11,0.35)] rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${percentage}%` }}
            />
            
            {/* Steps */}
            <div className="absolute left-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-md bg-amber-600" />
            
            <div 
              className={cn(
                "absolute -translate-x-1/2 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all duration-500",
                userPoints >= bronzeThreshold ? "bg-[#f59e0b]" : "bg-neutral-300"
              )}
              style={{ left: `${goldMarkerPercent}%` }}
            >
              {userPoints >= bronzeThreshold ? <Check className="w-2.5 h-2.5 text-white stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>

            <div 
              className={cn(
                "absolute -translate-x-1/2 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all duration-500",
                userPoints >= goldThreshold ? "bg-slate-400" : "bg-neutral-300"
              )}
              style={{ left: `${platinumMarkerPercent}%` }}
            >
              {userPoints >= goldThreshold ? <Check className="w-2.5 h-2.5 text-white stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          <div className="flex relative w-full text-[9px] font-black text-muted-foreground select-none h-6 mt-1">
            <span className="absolute left-0 font-bold text-amber-700">BRONZE</span>
            <span 
              className={cn("absolute -translate-x-1/2 whitespace-nowrap transition-all duration-500", userPoints >= bronzeThreshold ? "text-amber-600 font-extrabold" : "text-muted-foreground")}
              style={{ left: `${goldMarkerPercent}%` }}
            >
              GOLD ({bronzeThreshold})
            </span>
            <span 
              className={cn("absolute -translate-x-1/2 whitespace-nowrap transition-all duration-500", userPoints >= goldThreshold ? "text-slate-600 font-extrabold" : "text-muted-foreground")}
              style={{ left: `${platinumMarkerPercent}%` }}
            >
              PLATINUM ({goldThreshold})
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 pt-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>
              {nextLockedReward ? (
                <>Earn <span className="font-bold text-primary">{nextLockedReward.required_points - userPoints}</span> more points to unlock <span className="font-bold text-foreground">&ldquo;{nextLockedReward.title}&rdquo;</span>! 🎁</>
              ) : (
                "Congratulations! You've unlocked every premium reward! 🏆"
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Tabs Menu (Sliding pill design) */}
      <div className="mt-8 bg-surface border border-border p-1 rounded-2xl flex relative overflow-hidden">
        <button
          onClick={() => setActiveTab('catalog')}
          className={cn(
            "flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10",
            activeTab === 'catalog' ? "text-primary bg-white shadow-sm" : "text-muted-foreground"
          )}
        >
          Catalog Rewards
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10 flex items-center justify-center gap-2",
            activeTab === 'history' ? "text-primary bg-white shadow-sm" : "text-muted-foreground"
          )}
        >
          Claims History
          {claims.filter(c => c.status === 'pending').length > 0 && (
            <span className="w-2.5 h-2.5 bg-[#f59e0b] rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Rewards Catalog */}
          {activeTab === 'catalog' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {filteredRewards.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-border p-8">
                  <Gift className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-25" />
                  <h3 className="text-lg font-bold text-foreground">No rewards match search</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">Brew a different search query to find your unlocked rewards.</p>
                </div>
              ) : (
                filteredRewards.map((reward, idx) => {
                  const isUnlocked = userPoints >= reward.required_points;
                  const pointsNeeded = reward.required_points - userPoints;
                  const { name: tierName, color: tierColor, gradient: gradientColor, icon: tierIcon, watermark: watermarkIcon } = getRewardTierDetails(reward.required_points);

                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative w-full rounded-3xl overflow-hidden shadow-lg border border-white/5 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] flex group h-[155px]"
                      style={{
                        background: gradientColor,
                      }}
                    >
                      {/* Left Badge Area */}
                      <div className="w-[28%] flex flex-col items-center justify-center relative z-10 px-2 py-4">
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shadow-md">
                          {tierIcon}
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-center mt-2.5 select-none" style={{ color: tierColor }}>
                          {tierName}
                        </span>
                      </div>

                      {/* Ticket Cutouts */}
                      <div className="absolute -top-2 left-[28%] -translate-x-1/2 w-4 h-4 rounded-full bg-background z-20 shadow-[inset_0_-2px_3px_rgba(0,0,0,0.15)]" />
                      <div className="absolute -bottom-2 left-[28%] -translate-x-1/2 w-4 h-4 rounded-full bg-background z-20 shadow-[inset_0_2px_3px_rgba(0,0,0,0.15)]" />

                      {/* Right Content Area */}
                      <div className="w-[72%] p-5 flex flex-col justify-between relative z-10">
                        {/* Silhouette Watermark */}
                        <div className="absolute right-2 bottom-2 text-white/5 pointer-events-none transform rotate-12 scale-125 z-0">
                          {watermarkIcon}
                        </div>

                        <div className="relative z-10">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-lg leading-tight select-none">
                              {reward.title}
                            </h4>
                          </div>

                          {/* Points badge */}
                          <div className="mt-2.5 px-3 py-1 bg-black/35 border border-white/10 rounded-full w-fit flex items-center gap-1.5 text-xs text-[#fbbf24] font-bold shadow-inner select-none">
                            <Coins className="w-3.5 h-3.5 fill-[#fbbf24]/10" />
                            <span>{reward.required_points} Points</span>
                          </div>
                        </div>

                        {/* Action buttons at bottom */}
                        <div className="flex items-center justify-between mt-auto pt-2 relative z-10">
                          {isUnlocked ? (
                            <button
                              onClick={() => handleClaim(reward)}
                              className="py-1.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] transition-all duration-300 hover:scale-[1.03] active:scale-95 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Claim Reward
                            </button>
                          ) : (
                            <div className="py-1.5 px-4 bg-white/5 border border-white/5 text-white/30 font-bold text-xs rounded-xl flex items-center gap-1.5 select-none">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </div>
                          )}

                          {!isUnlocked && (
                            <span className="text-[10px] font-bold text-white/40 select-none">
                              {pointsNeeded} pts left
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* TAB 2: Claims History (Maximum details, three distinct states) */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {claims.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-border p-8">
                  <Clock className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-25" />
                  <h3 className="text-lg font-bold text-foreground">No Claims Logged</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">Your claims list is currently empty. Go claim some tasty rewards from the catalog!</p>
                </div>
              ) : (
                claims.map((claim) => {
                  const isPending = claim.status === 'pending';
                  const isApproved = claim.status === 'approved' || claim.status === 'completed';
                  const isRefunded = claim.status === 'refunded' || claim.status === 'refund';
                  const isRejected = claim.status === 'rejected';

                  return (
                    <motion.div
                      layout
                      key={claim.id}
                      className={cn(
                        "w-full rounded-3xl p-5 border premium-shadow transition-all duration-300 flex flex-col gap-4 cursor-pointer overflow-hidden select-none",
                        isPending ? "bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/35 hover:border-amber-500/50" :
                        isApproved ? "bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20 hover:border-emerald-500/35" :
                        isRefunded ? "bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/25 hover:border-blue-500/40" :
                        "bg-gradient-to-br from-red-500/5 to-transparent border-red-500/25 hover:border-red-500/40"
                      )}
                      onClick={() => setExpandedClaimId(expandedClaimId === claim.id ? null : claim.id)}
                    >
                      {/* Top Header Summary */}
                      <div className="flex justify-between items-start w-full">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isPending ? "bg-amber-500/15 text-amber-600" :
                            isApproved ? "bg-emerald-500/15 text-emerald-600" :
                            isRefunded ? "bg-blue-500/15 text-blue-600" :
                            "bg-red-500/15 text-red-600"
                          )}>
                            {isPending ? <Clock className="w-5 h-5" /> :
                             isApproved ? <CheckCircle2 className="w-5 h-5" /> :
                             isRefunded ? <RotateCcw className="w-5 h-5" /> :
                             <XCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{claim.rewards.title}</h4>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(claim.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className={cn(
                            "text-sm font-bold flex items-center gap-1",
                            isPending ? "text-amber-600" :
                            isApproved ? "text-emerald-600" :
                            isRefunded ? "text-blue-600" :
                            "text-red-600"
                          )}>
                            {isRejected || isRefunded ? '+' : '-'}{claim.rewards.required_points}
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">pts</span>
                          </span>
                          
                          {/* Pulsing Status Badge */}
                          <span className={cn(
                            "text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border mt-1.5 flex items-center gap-1 w-fit",
                            isPending ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" :
                            isApproved ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            isRefunded ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            "bg-red-500/10 text-red-500 border-red-500/20"
                          )}>
                            {isPending && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                            {isPending ? 'Pending' : isApproved ? 'Redeemed' : isRefunded ? 'Refunded' : 'Rejected'}
                          </span>
                        </div>
                      </div>

                      {/* Expandable details with beautiful components */}
                      <AnimatePresence>
                        {expandedClaimId === claim.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="w-full border-t border-dashed border-border pt-4 mt-2 flex flex-col items-center gap-4 relative overflow-hidden"
                          >
                            {isPending ? (
                              <>
                                {/* Real scannable QR Code containing the Claim ID */}
                                <QRCode value={claim.id} />
                                
                                <div className="text-center px-4">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Redemption Code</p>
                                  <p className="text-lg font-black text-foreground mt-0.5 select-all">
                                    LYN-{claim.id.slice(-6).toUpperCase()}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">
                                    Present this QR code or Code to the shopkeeper. They will scan or approve it from their dashboard to hand over your reward.
                                  </p>
                                </div>
                              </>
                            ) : isApproved ? (
                              <div className="text-center px-4 w-full">
                                <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                                  <Check className="w-5 h-5 stroke-[2.5]" />
                                </div>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Transaction ID</p>
                                <p className="text-xs font-mono text-muted-foreground mt-0.5 select-all">
                                  {claim.id}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed font-medium">
                                  Redeemed successfully! Show this receipt to shop keepers if you need to trace your points history.
                                </p>
                              </div>
                            ) : isRefunded ? (
                              <div className="text-center px-4 w-full">
                                <div className="w-11 h-11 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
                                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                                </div>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Refund Status</p>
                                <p className="text-xs text-blue-500 font-bold mt-0.5 select-all">
                                  Refunded &bull; Points Returned
                                </p>
                                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed font-medium">
                                  This claim request has been refunded. The full points balance has been returned back to your wallet.
                                </p>
                              </div>
                            ) : (
                              <div className="text-center px-4 w-full">
                                <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                                  <X className="w-5 h-5 stroke-[2.5]" />
                                </div>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Refund Status</p>
                                <p className="text-xs text-red-500 font-bold mt-0.5 select-all">
                                  Reversed &bull; Points Returned
                                </p>
                                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed font-medium">
                                  This claim request has been cancelled/rejected. The full points balance has been returned back to your wallet.
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      
    </div>
  );
}
