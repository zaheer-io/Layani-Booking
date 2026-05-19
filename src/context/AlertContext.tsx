'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Trophy, Check, AlertCircle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'info' | 'reward';

interface AlertOptions {
  buttonText?: string;
  onConfirm?: () => void;
}

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  options?: AlertOptions;
}

interface AlertContextType {
  showAlert: (title: string, message: string, type?: AlertType, options?: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    options?: AlertOptions
  ) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      options,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (alertState.options?.onConfirm) {
      alertState.options.onConfirm();
    }
  };

  // Helper to parse double quotes to highlight reward names inside messages
  const renderMessageContent = (msg: string) => {
    if (!msg) return '';
    const parts = msg.split(/(".*?")/);
    return parts.map((part, index) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return (
          <span key={index} className="font-extrabold text-primary block my-1 text-base">
            {part.replace(/"/g, '')}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getStyleForType = () => {
    switch (alertState.type) {
      case 'reward':
        return {
          icon: <Trophy className="w-8 h-8 text-amber-500 animate-pulse" />,
          accentColor: 'primary',
          bgCircle: 'bg-amber-50 border-amber-100',
          btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200/50',
          textColor: 'text-amber-800',
          badgeText: 'REWARD UNLOCKED',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'success':
        return {
          icon: <Check className="w-8 h-8 text-emerald-500" />,
          accentColor: 'emerald-500',
          bgCircle: 'bg-emerald-50 border-emerald-100',
          btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200/50',
          textColor: 'text-emerald-800',
          badgeText: 'SUCCESS',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
          accentColor: 'rose-500',
          bgCircle: 'bg-rose-50 border-rose-100',
          btnBg: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-200/50',
          textColor: 'text-rose-800',
          badgeText: 'ALERT',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-8 h-8 text-amber-500" />,
          accentColor: 'primary',
          bgCircle: 'bg-amber-50 border-amber-100',
          btnBg: 'bg-primary hover:bg-primary-dark shadow-primary/20',
          textColor: 'text-neutral-800',
          badgeText: 'INFORMATION',
          badgeBg: 'bg-neutral-100 text-neutral-800 border-neutral-200',
        };
    }
  };

  const currentStyles = getStyleForType();

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <AnimatePresence>
        {alertState.isOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 no-tap-highlight">
            {/* Dark glassmorphic backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideAlert}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            />

            {/* Premium Dialog Card - Highly compact & optimized for small mobile viewports */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white border border-neutral-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] rounded-[2rem] p-6 max-w-[310px] w-full mx-auto relative overflow-hidden flex flex-col items-center text-center z-10"
            >
              {/* Confetti-like sparkles in reward situations */}
              {alertState.type === 'reward' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-6 left-6 text-amber-400/40 animate-bounce"><Sparkles className="w-4 h-4" /></div>
                  <div className="absolute top-12 right-8 text-amber-400/30 animate-pulse"><Sparkles className="w-3.5 h-3.5" /></div>
                  <div className="absolute bottom-12 left-8 text-amber-400/30 animate-pulse"><Sparkles className="w-3.5 h-3.5" /></div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={hideAlert}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors rounded-full hover:bg-neutral-50"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Situation Badge */}
              <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border rounded-full mb-4 ${currentStyles.badgeBg}`}>
                {currentStyles.badgeText}
              </span>

              {/* Central Glowing Icon Circle */}
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 shadow-sm relative ${currentStyles.bgCircle}`}>
                {currentStyles.icon}
              </div>

              {/* Alert Title */}
              <h3 className="text-xl font-black text-neutral-900 tracking-tight leading-none mb-2">
                {alertState.title}
              </h3>

              {/* Message Details */}
              <div className="text-neutral-500 text-xs font-medium leading-relaxed mb-5 px-1">
                {renderMessageContent(alertState.message)}
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={hideAlert}
                className={`w-full py-3 text-sm text-white font-extrabold tracking-wide rounded-xl transition-all shadow-md text-center cursor-pointer ${currentStyles.btnBg}`}
              >
                {alertState.options?.buttonText || 'Got it!'}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
