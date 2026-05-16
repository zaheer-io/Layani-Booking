export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  available: boolean;
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
  description: string;
  image_url: string;
  created_at: string;
}

export interface Reward {
  id: string;
  title: string;
  required_points: number;
  created_at: string;
}
