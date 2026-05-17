# Layani Booking System: Project Analysis & Future Roadmap

This document provides a comprehensive overview of the current client application's data flow, session management, and the planned features for the upcoming Admin/Shopkeeper application.

---

## 1. Current Client App Analysis

### A. Core Data Flow
The application follows a standard React/Next.js data flow, utilizing **Supabase** as the primary backend and **React Context** for state management.

1.  **Authentication Flow**:
    *   **Initialization**: On load, `AuthContext` checks `localStorage` for `layani_user`.
    *   **Verification**: If found, it fetches the latest user data from the Supabase `users` table to ensure points and profile info are synced.
    *   **Login/Signup**: New users enter Name/Phone. The system checks for existing records; if none exist, it creates a new entry in the `users` table.
    *   **Persistence**: User sessions are pinned to the device's `localStorage` for a seamless "always-on" experience.

2.  **Shopping & Cart Flow**:
    *   **Discovery**: `DashboardView` and `StoreView` pull data from the `products` and `offers` tables.
    *   **State Management**: `CartContext` handles adding/removing items. It automatically calculates totals and persists the cart state to `localStorage` (`layani_cart`) to prevent data loss on refresh.
    *   **Checkout**: When a user taps "Checkout", a transaction is initiated:
        1.  A new record is created in the `bookings` table (status: `pending`).
        2.  Individual items are mapped to the `booking_items` table, linked to the booking ID.
        3.  The cart is cleared upon success.

3.  **Order Tracking**:
    *   **History**: `OrderHistoryView` performs a complex join across `bookings`, `booking_items`, and `products` to show the user exactly what they ordered and the current status.

### B. Client Capabilities & Data Access
*   **Identified Sessions**: All actions are tied to a unique `id` and `phone` number.
*   **Loyalty System**: Users can view their total `points` and see a dynamic progress bar for their next reward.
*   **Booking Management**: Users can view their history but currently cannot modify a booking once placed (Read-Only history).

---

## 2. Future: Admin/Shopkeeper App Requirements

To complete the ecosystem, a dedicated **Shopkeeper App** is required to manage the lifecycle of these bookings.

### A. Order Management (Priority 1)
*   **Live Order Feed**: A real-time dashboard of "Pending" orders with sound notifications.
*   **Status Control**: Ability to change order status:
    *   `Pending` → `Approved` (Start preparation)
    *   `Approved` → `Completed` (Ready for pickup/delivered)
    *   `Any` → `Cancelled` (With reason)
*   **Order Details**: View user contact details (phone) to clarify order specifics if needed.

### B. Product & Inventory Management
*   **Availability Toggle**: One-tap toggle to mark products as "Sold Out" (instantly updates the client app).
*   **Menu Editor**: Add new products, update prices, and change images.
*   **Offer Manager**: Create and schedule "Featured Offers" for the client dashboard.

### C. Loyalty & Rewards Management
*   **Point Adjustments**: Manually add or deduct points for users.
*   **Reward Verification**: A way to "Claim" a reward (e.g., scanning a user's phone or entering their ID) and deducting the points.

### D. Analytics & Reporting
*   **Sales Tracking**: View daily/weekly revenue.
*   **Popular Items**: Insights into which products are trending.
*   **User Growth**: Track new user registrations.

---

## 3. Technical Roadmap Summary

| Component | Current (Client) | Future (Admin) |
| :--- | :--- | :--- |
| **Auth** | Phone/Name Persistence | Role-based (Admin Login) |
| **Database** | Read Products / Write Bookings | Full CRUD on all Tables |
| **State** | Cart/Auth Context | Global Order Store (Real-time) |
| **Supabase** | Client-side SDK | Real-time Subscriptions |

> **Note**: The current architecture is designed to be shared. The `src/types` and `src/lib/supabase.ts` can be reused in the Admin app to maintain data integrity across both platforms.
