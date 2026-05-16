'use client';

import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-24 h-24 bg-primary rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-primary/40">
          <span className="text-4xl font-bold text-white -rotate-12">L</span>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 border-2 border-dashed border-primary/30 rounded-full"
        />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-center"
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Layani</h1>
        <p className="text-muted-foreground mt-2 font-medium">Premium Tea & Snacks</p>
      </motion.div>

      <div className="absolute bottom-12">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
