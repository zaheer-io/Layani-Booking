'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Phone, User, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsSubmitting(true);
    try {
      await login(name, phone);
    } catch {
      alert('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 pt-20 pb-10 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center"
      >
        <div className="w-32 h-32 mb-8 relative">
          <Image 
            src="/logo_WT.jpg" 
            alt="Layani Logo" 
            width={128}
            height={128}
            className="object-contain rounded-2xl"
          />
        </div>
        <h2 className="text-4xl font-bold text-foreground leading-tight text-center">
          Welcome to <span className="text-primary">Layani</span>
        </h2>
        <p className="text-muted-foreground mt-4 text-lg text-center">
          Join our loyalty program and enjoy premium rewards with every sip.
        </p>
      </motion.div>


      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onSubmit={handleSubmit}
        className="mt-12 space-y-6 flex-grow"
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Your Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field pl-12 h-14"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field pl-12 h-14"
              required
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full h-14 text-lg"
          >
            {isSubmitting ? 'Joining...' : 'Get Started'}
            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-sm text-muted-foreground mt-auto pt-10"
      >
        By continuing, you agree to our Terms and Conditions.
      </motion.div>
    </div>
  );
}
