export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
  archived?: boolean;
  points?: number;
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  points: number;
  created_at: string;
  avatar_url?: string | null;
}

export interface Booking {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  total: number;
  notes?: string;
  created_at: string;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  product_id: string;
  quantity: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  code: string | null;
  discount_percent: number;
  active: boolean;
  created_at: string;
}

export interface Reward {
  id: string;
  title: string;
  required_points: number;
  created_at: string;
}

export interface RewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  created_at: string;
}

export interface Admin {
  id: string;
  username: string;
  password?: string;
  name: string | null;
  created_at: string;
}

