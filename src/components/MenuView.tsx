'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { Search, Plus, Minus, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MenuViewProps {
  onViewCart: () => void;
}

export default function MenuView({ onViewCart }: MenuViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, updateQuantity, cart, total } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      if (data) {
        setProducts(data);
        const cats = ['All', ...new Set(data.map((p: Product) => p.category))];
        setCategories(cats as string[]);
      }
    };
    fetchProducts();

    const channelProducts = supabase
      .channel('menu_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelProducts);
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && !p.archived;
  });

  const getProductQuantity = (id: string) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };

  return (
    <div className="pb-32 pt-6">
      {/* Header & Search */}
      <div className="px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Our Menu</h1>
        <Image 
          src="/logo_WT.jpg" 
          alt="Layani Logo" 
          width={40} 
          height={40} 
          className="rounded-xl object-cover border border-border shadow-sm" 
        />
      </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Search for tea, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12 h-12 bg-surface border-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mt-6 flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
              selectedCategory === cat 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "bg-surface text-muted-foreground border border-border"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="mt-8 px-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-4 bg-white rounded-3xl border border-border/60 shadow-sm"
            >
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">No items found</h3>
              <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">
                We couldn&apos;t find anything matching your search or filter. Try something else!
              </p>
            </motion.div>
          ) : (
            filteredProducts.map((product, idx) => {
              const qty = getProductQuantity(product.id);
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "flex items-center gap-4 bg-white p-3 rounded-2xl border border-border premium-shadow transition-opacity",
                    !product.available && "opacity-60"
                  )}
                >
                  <div className="w-24 h-24 bg-surface rounded-xl overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={product.image_url || ""}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {!product.available && (
                      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] text-white font-extrabold uppercase tracking-wider px-2 py-0.5 bg-red-600 rounded-md">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-muted-foreground text-sm">{product.category}</p>
                      {product.points && product.points > 0 ? (
                        <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded-full border border-amber-100/50 flex items-center gap-0.5">
                          🪙 +{product.points}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-primary font-bold mt-1 text-lg">₹{product.price}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {!product.available ? (
                      <span className="text-[9px] text-red-500 font-extrabold uppercase px-2 py-1 bg-red-50 rounded-lg border border-red-100/50">
                        Out of Stock
                      </span>
                    ) : qty > 0 ? (
                      <div className="flex flex-col items-center bg-surface rounded-full p-1 border border-border">
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-1.5 bg-primary text-white rounded-full shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-sm py-1">{qty}</span>
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="p-1.5 bg-white border border-border rounded-full"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Floating Cart Summary */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-24 left-6 right-6 z-30"
        >
          <div className="bg-foreground text-white rounded-2xl p-4 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-bold uppercase tracking-wider">{cart.length} Items</p>
                <p className="text-lg font-bold">₹{total.toFixed(2)}</p>
              </div>
            </div>
            <button 
              onClick={onViewCart}
              className="bg-primary text-white font-bold py-2 px-6 rounded-xl text-sm"
            >
              View Plate
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
