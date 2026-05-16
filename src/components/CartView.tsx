'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Minus, Send, CheckCircle } from 'lucide-react';

interface CartViewProps {
  onSuccess: () => void;
}

export default function CartView({ onSuccess }: CartViewProps) {
  const { cart, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [notes, setNotes] = useState('');

  const handleBooking = async () => {
    if (!user || cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      // 1. Create Booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{ user_id: user.id, total, status: 'pending' }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 2. Create Booking Items
      const bookingItems = cart.map(item => ({
        booking_id: booking.id,
        product_id: item.id,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(bookingItems);

      if (itemsError) throw itemsError;

      setIsSuccess(true);
      clearCart();
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to place booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-200"
        >
          <CheckCircle className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-bold">Request Sent!</h2>
        <p className="text-muted-foreground mt-4">
          Your booking has been sent to the shopkeeper. Please wait for manual approval.
        </p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center text-muted-foreground mb-6">
          <Trash2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2">Go to the menu and add some treats!</p>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-6 px-6">
      <h1 className="text-3xl font-bold">Your Order</h1>
      <p className="text-muted-foreground mt-2">Review your selected items.</p>

      <div className="mt-10 space-y-4">
        <AnimatePresence>
          {cart.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-border"
            >
              <div className="w-16 h-16 bg-surface rounded-xl overflow-hidden flex-shrink-0">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold">{item.name}</h4>
                <p className="text-primary font-bold">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-3 bg-surface rounded-xl p-1 border border-border">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-border rounded-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-8">
        <label className="text-sm font-bold text-muted-foreground ml-1">Special Instructions</label>
        <textarea
          placeholder="Add sugar, less spicy, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field mt-2 min-h-[100px] resize-none py-4"
        />
      </div>

      <div className="mt-10 bg-surface border border-border rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-bold">₹{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Taxes & Fee</span>
          <span className="font-bold text-green-500">FREE</span>
        </div>
        <div className="pt-4 border-t border-border flex justify-between items-center">
          <span className="text-xl font-bold">Total Amount</span>
          <span className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleBooking}
          disabled={isSubmitting}
          className="btn-primary w-full h-16 text-lg"
        >
          {isSubmitting ? 'Sending Request...' : 'Request Order'}
          {!isSubmitting && <Send className="w-5 h-5" />}
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-bold">
          Pay after approval at the counter
        </p>
      </div>
    </div>
  );
}
