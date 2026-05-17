'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Gift, Lock, CheckCircle2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reward } from '@/types';
import Image from 'next/image';

interface RewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rewards: Reward;
}

export default function RewardsView() {
  const { user, refreshUser } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);

  useEffect(() => {
    const fetchRewards = async () => {
      const { data: rewardsData } = await supabase.from('rewards').select('*').order('required_points', { ascending: true });
      if (rewardsData) setRewards(rewardsData);

      if (user) {
        const { data: claimsData } = await supabase
          .from('reward_claims')
          .select('*, rewards(*)')
          .eq('user_id', user.id);
        if (claimsData) setClaims(claimsData);
      }
    };
    fetchRewards();
  }, [user]);

  const handleClaim = async (reward: Reward) => {
    if (!user || user.points < reward.required_points) return;
    
    try {
      const { error: claimError } = await supabase
        .from('reward_claims')
        .insert([{ user_id: user.id, reward_id: reward.id, status: 'pending' }]);

      if (claimError) throw claimError;

      // Update user points
      const { error: userError } = await supabase
        .from('users')
        .update({ points: user.points - reward.required_points })
        .eq('id', user.id);

      if (userError) throw userError;

      alert('Reward claimed! Please show this to the shopkeeper for approval.');
      refreshUser();
    } catch (error) {
      console.error('Claim error:', error);
      alert('Failed to claim reward.');
    }
  };

  return (
    <div className="pb-24 pt-6 px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rewards</h1>
        <Image 
          src="/logo_WT.jpg" 
          alt="Layani Logo" 
          width={40} 
          height={40} 
          className="rounded-xl object-cover border border-border shadow-sm" 
        />
      </div>
      <p className="text-muted-foreground mt-2">Earn points and unlock exclusive treats.</p>

      {/* Points Summary */}
      <div className="mt-8 bg-surface border border-border rounded-3xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Available Balance</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-primary">{user?.points}</span>
            <span className="font-bold text-muted-foreground">Points</span>
          </div>
        </div>
        <Trophy className="w-12 h-12 text-primary/20" />
      </div>

      {/* Rewards List */}
      <div className="mt-10 space-y-6">
        <h3 className="text-xl font-bold">Unlockable Rewards</h3>
        {rewards.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-[2rem] border border-dashed border-border">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No rewards available</h3>
            <p className="text-muted-foreground mt-2">We are brewing some new rewards. Check back soon!</p>
          </div>
        ) : rewards.map((reward, idx) => {
            const isUnlocked = (user?.points || 0) >= reward.required_points;
          const pointsNeeded = reward.required_points - (user?.points || 0);

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "relative bg-white border p-5 rounded-3xl premium-shadow overflow-hidden group",
                isUnlocked ? "border-primary/30" : "border-border"
              )}
            >
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                    isUnlocked ? "bg-primary text-white" : "bg-surface text-muted-foreground"
                  )}>
                    {isUnlocked ? <Gift className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{reward.title}</h4>
                    <p className="text-sm text-muted-foreground font-medium">
                      {isUnlocked ? "Ready to claim" : `${pointsNeeded} points left`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-xl font-bold block",
                    isUnlocked ? "text-primary" : "text-muted-foreground"
                  )}>
                    {reward.required_points}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Points</span>
                </div>
              </div>

              {isUnlocked && (
                <button
                  onClick={() => handleClaim(reward)}
                  className="mt-4 w-full btn-primary py-2.5 text-sm"
                >
                  Claim Reward
                </button>
              )}

              {/* Progress Line */}
              {!isUnlocked && (
                <div className="mt-4 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-border rounded-full" 
                    style={{ width: `${Math.min(100, (user?.points || 0) / reward.required_points * 100)}%` }} 
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Recent Claims */}
      {claims.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-4">Claim History</h3>
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="flex justify-between items-center p-4 bg-surface border border-border rounded-2xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={cn(
                    "w-5 h-5",
                    claim.status === 'approved' ? "text-green-500" : "text-amber-500"
                  )} />
                  <div>
                    <p className="font-bold text-sm">{claim.rewards.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{claim.status}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {new Date(claim.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
