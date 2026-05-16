'use client';

import React from 'react';
import { Home, Utensils, Award, Tag, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'menu', icon: Utensils, label: 'Menu' },
    { id: 'rewards', icon: Award, label: 'Rewards' },
    { id: 'offers', icon: Tag, label: 'Offers' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-border px-6 py-3 flex justify-between items-center z-40 safe-area-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "bottom-nav-item no-tap-highlight",
              isActive ? "text-primary scale-110 font-semibold" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("w-6 h-6 mb-1 transition-all", isActive && "fill-primary/10")} />
            <span className="text-[10px] tracking-wide">{tab.label}</span>
            {isActive && (
              <span className="absolute -top-1 w-1 h-1 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
