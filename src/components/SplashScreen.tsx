'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="w-48 h-48 relative flex items-center justify-center">
          <Image 
            src="/logo_DT.png" 
            alt="Layani Logo" 
            width={192}
            height={192}
            className="object-contain"
          />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="mt-12 text-center"
      >
        <p className="text-white/60 tracking-[0.3em] uppercase text-xs font-semibold">Premium Tea & Snacks</p>
      </motion.div>

      <div className="absolute bottom-16">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="w-1.5 h-1.5 bg-white/40 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>

  );
}
