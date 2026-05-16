# 🍵 Layani | Premium Tea & Snacks Booking PWA

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-blue?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

Layani is a premium, mobile-first Progressive Web App (PWA) designed for a high-end tea and snack booking experience. It features a QR-based loyalty system, real-time product browsing, and a seamless booking workflow integrated with Supabase.

---

## ✨ Key Features

- **🚀 App-like Experience**: Fully optimized for mobile with smooth Framer Motion transitions and a sticky bottom navigation.
- **🍵 Premium Menu**: Browse through high-quality tea and snacks with real-time search and categorization.
- **🎁 Loyalty & Rewards**: Automated points tracking. Users earn points with every order to unlock exclusive rewards.
- **📅 Real-time Booking**: Seamless "Request Order" flow that syncs directly with the shopkeeper's dashboard via Supabase.
- **🔐 Simple Onboarding**: Quick phone-number-based access without complex password management.
- **📱 PWA Ready**: Installable on iOS and Android devices for a native app feel.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend/Database**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/zaheer-io/Layani-Booking.git
cd Layani-Booking
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Apply the initial schema provided in the Supabase dashboard or use the following tables:
- `users`: ID, Name, Phone, Points
- `products`: Name, Category, Price, ImageURL
- `offers`: Title, Description, ImageURL
- `bookings`: UserID, Total, Status
- `rewards`: Title, RequiredPoints

### 5. Run the application
```bash
npm run dev
```

---

## 🎨 Design Philosophy

Layani follows a **premium, white-themed aesthetic** with:
- **Warm Accents**: Using Amber-500 (`#f59e0b`) to evoke the warmth of fresh tea.
- **Glassmorphism**: Subtle blur effects on navigation and cards for a modern feel.
- **Micro-animations**: Interactive elements that respond to user touch and gestures.

## 📱 PWA Support

To install Layani on your device:
1. Open the site in your mobile browser.
2. Tap "Share" (iOS) or the three dots (Android).
3. Select **"Add to Home Screen"**.

---

Developed with ❤️ for Layani Premium Tea & Snacks.
