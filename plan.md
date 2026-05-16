Create a modern, premium, highly interactive Progressive Web App (PWA) for a tea and snack brand named “Layani”.

Main Goal:
The application is a QR-based loyalty and product browsing system for a tea/snack shop startup. Customers scan a QR code and instantly access the web app without downloading anything. The experience should feel like a modern premium mobile app while running entirely in the browser.

Core Concept:

* Fast onboarding
* Modern white-themed UI
* Smooth mobile experience
* Loyalty and rewards system
* Menu and offers browsing
* Order booking/request system
* Repeat customer retention
* Youth-focused branding

Design Style:

* Clean white-themed UI
* Premium modern aesthetics
* Soft shadows and glassmorphism
* Smooth animations and transitions
* Rounded modern cards
* Minimal and elegant
* Fast and responsive
* Warm orange/golden accent colors inspired by tea
* Highly polished mobile-first interface

Technology Stack:

* Next.js App Router
* React
* Tailwind CSS
* Framer Motion
* Supabase backend
* PWA support
* Mobile-first responsive design

PWA Features:

* Installable to home screen
* Fullscreen mobile app feel
* Splash screen
* Offline caching for basic pages
* Fast loading
* Smooth page transitions
* Sticky bottom navigation
* App-like gestures and interactions

Authentication Flow:
When the website opens:

* Automatically check whether the user already exists and has a valid active session.
* If session exists:

  * directly open the main dashboard/homepage
* If no session:

  * show onboarding/login page

Login System:

* Very simple onboarding
* User enters:

  * Name
  * Phone Number
* No OTP initially
* Store session securely
* Auto-login on future visits unless session expires

Important:
One phone number should only have one account.

Main User Flow:
Scan QR
↓
Open PWA
↓
Auto-check session
↓
If new user → Register
↓
If existing user → Enter app directly
↓
Browse products/offers
↓
Select products
↓
Book/request order
↓
Store request in database
↓
Staff approves manually
↓
Points added to customer account

Main Screens Required:

1. Splash Screen

* Animated Layani logo
* Smooth loading animation
* Premium startup-style intro

2. Authentication Screen

* Minimal and elegant
* Large modern inputs
* Continue button
* Mobile optimized
* Attractive illustration/background

3. Home Dashboard
   Main landing screen after login.

Features:

* Personalized greeting
* Current points
* Progress toward next reward
* Featured offers banner slider
* Trending items
* Popular snacks
* Recommended products
* Daily specials
* Nearby/new offers feeling

4. Menu Screen
   Beautiful categorized menu.

Categories:

* Tea
* Snacks
* Drinks
* Combos
* Special items

Features:

* Product image
* Price
* Animated hover/tap effects
* Add button
* Quantity controls
* Search functionality
* Smooth filtering
* Favorite button

5. Rewards Screen
   Gamified loyalty experience.

Features:

* Current points
* Animated progress bar
* Reward cards
* Redeemable snacks
* Locked/unlocked rewards
* “Only 20 points left” style motivation

Example rewards:

* Free Tea
* Free Samosa
* Combo Discount
* Special Offer Unlock

6. Booking/Cart Screen
   Features:

* Selected products
* Quantity management
* Notes section
* Total estimate
* “Request Order” button

Important:
This is NOT direct automated ordering initially.
Orders should be stored as booking/request entries in database for manual approval by shopkeeper.

7. Offers Screen

* Daily offers
* Combo offers
* Festival discounts
* Animated banners
* Swipeable cards
* Time-limited promotions

8. Profile Screen
   Features:

* Name
* Phone number
* Total points
* Order history
* Claimed rewards
* Logout button

UI/UX Requirements:

* White background for clean readability
* Premium café/startup aesthetics
* Very smooth scrolling
* Micro-interactions everywhere
* Skeleton loading states
* Smooth card animations
* Sticky bottom navigation
* Pull-to-refresh effect
* Floating action buttons
* App-quality transitions
* Highly polished mobile responsiveness

Animation Ideas:

* Animated points counter
* Floating reward effects
* Smooth product card reveals
* Hero transitions
* Animated banners
* Motion-based scrolling

Database Structure Suggestions:

users

* id
* name
* phone
* points
* created_at

products

* id
* name
* category
* price
* image
* available

offers

* id
* title
* description
* image

bookings

* id
* user_id
* status
* total
* created_at

booking_items

* id
* booking_id
* product_id
* quantity

rewards

* id
* title
* required_points

reward_claims

* id
* user_id
* reward_id
* status

Important Business Logic:

* Points should NOT be automatically added after booking.
* Shopkeeper manually approves orders and reward claims.
* This prevents fake/spam point farming.
* Loyalty system is the primary goal.

Performance Requirements:

* Extremely fast mobile performance
* SEO optimized
* Lazy loading images
* Optimized animations
* PWA optimized
* Clean architecture
* Reusable components

Overall Goal:
The final experience should feel like a premium modern café loyalty app similar to Starbucks or Zomato-inspired experiences, but lightweight, elegant, fast, and optimized for a small startup tea/snack brand named Layani.
