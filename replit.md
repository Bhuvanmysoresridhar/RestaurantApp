# Stones & Spices — Cloud Kitchen App

## Overview

A full-stack cloud kitchen web application for "Stones & Spices". Features a customer-facing ordering app with OTP authentication, live menu, cart/checkout, order history, and reviews — plus a fully separate admin/staff dashboard with role-based access control.

## Architecture

- **Frontend**: React 18 + Vite 5 (port 5000)
- **Backend**: Express.js (port 3001)
- **Database**: PostgreSQL (via DATABASE_URL)
- **Auth**: JWT (shared secret for both customer and admin tokens)
- **Styling**: Inline styles throughout (no CSS framework)
- **Email**: Replit Mail integration (EMAIL_USER / EMAIL_PASS)
- **SMS**: Twilio integration

## Admin Access

- **URL**: `/admin/login`
- **Owner credentials**: `owner@stonesandspices.com` / `Admin@2024`
- **Roles**: OWNER (full access) / STAFF (orders, menu, kitchen)

## Project Structure

```
server/
  index.js              # Express server, DB init, seeding, routes mount
  db.js                 # PostgreSQL pool
  email.js              # OTP email sending
  sms.js                # Twilio SMS
  middleware/
    auth.js             # Customer JWT middleware + JWT_SECRET
    admin-auth.js       # Admin JWT middleware + ownerOnly guard
  routes/
    auth.js             # Customer auth (signup/login/OTP/forgot-password)
    orders.js           # Customer order placement + history
    reviews.js          # Reviews + comments
    admin-auth.js       # Admin login/signup/OTP/forgot-password/find-account
    admin.js            # Admin: orders, kitchen, menu, analytics, staff

src/
  App.jsx               # Router — customer + admin routes; intro skip for admin paths
  context/
    AuthContext.jsx     # Customer auth state (sas_token / sas_user)
    AdminAuthContext.jsx # Admin auth state (sas_admin_token / sas_admin)
  components/
    ProtectedRoute.jsx  # Customer protected routes
    AdminRoute.jsx      # Admin protected routes (+ ownerOnly prop)
    IntroVideo.jsx      # Intro video (skipped for /admin/* paths)
  pages/
    HomePage.jsx        # Landing page
    AuthPage.jsx        # Customer auth (multi-step OTP signup/login/reset)
    MenuDashboard.jsx   # Menu (fetches from /api/menu), kitchen banner, cart, checkout
    OrdersPage.jsx      # Order history with status badges
    ReviewsPage.jsx     # Reviews and comments
    admin/
      AdminAuthPage.jsx    # Admin login/signup/forgot-password/find-email
      AdminLayout.jsx      # Sidebar nav + kitchen toggle (shared wrapper)
      AdminDashboard.jsx   # Orders list with search/filter/auto-refresh
      AdminOrderDetail.jsx # Order detail + per-item status + action buttons
      AdminMenu.jsx        # Menu CRUD + availability/stock toggles
      AdminAnalytics.jsx   # Revenue analytics (owner only)
      AdminStaff.jsx       # Staff management (owner only)
```

## Database Tables

- `users` — customer accounts
- `orders` — customer orders (status lifecycle: pending→accepted→preparing→ready_for_delivery→out_for_delivery→delivered→completed)
- `order_items` — items in each order (item_status: pending→preparing→done)
- `reviews` / `review_comments` — customer reviews
- `otps` — OTP codes for both customer and admin (otp_type differentiates)
- `admin_users` — admin/staff accounts (role: OWNER/STAFF)
- `kitchen_status` — single-row toggle for open/closed
- `menu_items` — DB-backed menu (is_available, stock_status, is_active)

## Key API Endpoints

**Public**
- `GET /api/menu` — active menu items
- `GET /api/kitchen` — kitchen open/closed status
- `GET /api/stats` — meals served, bestsellers

**Customer (JWT required)**
- `POST /api/auth/*` — signup, login, OTP, forgot-password, find-email
- `POST /api/orders` — place order
- `GET /api/orders` — order history
- `POST /api/reviews` — submit review

**Admin (admin JWT required)**
- `POST /api/admin/auth/*` — admin login/signup/OTP/reset/find-account
- `GET/PATCH /api/admin/orders` — list and update orders
- `PATCH /api/admin/orders/:id/status` — advance order status
- `PATCH /api/admin/order-items/:id/status` — mark item done
- `GET/PATCH /api/admin/kitchen` — toggle kitchen
- `GET/POST/PATCH /api/admin/menu` — menu management
- `GET /api/admin/analytics` — revenue analytics (OWNER only)
- `GET/POST/PATCH /api/admin/staff` — staff management (OWNER only)

## LocalStorage Keys

- `sas_token` / `sas_user` — customer auth
- `sas_admin_token` / `sas_admin` — admin auth
- `sas_intro_seen` (sessionStorage) — intro video state
