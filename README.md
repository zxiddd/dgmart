# Degloor Mart — Hyperlocal Food Delivery Ecosystem

**Degloor Mart** is a complete, production-grade food delivery platform consisting of 5 interconnected applications.

## 🏗️ Architecture

| Application | Tech Stack | Port | Description |
|---|---|---|---|
| **Backend API** | Node.js, Express, Socket.io | `5000` | The brain of the system. Handles Auth, Database, and Real-time events. |
| **User App** | React Native (Expo) | N/A | Android app for customers to browse, order, and track food. |
| **Restaurant App** | Next.js (PWA) | `3003` | Dashboard for restaurant owners to manage menus and orders. |
| **Delivery App** | Next.js (PWA) | `3002` | App for delivery partners to accept and fulfill orders. |
| **Admin Dashboard** | Next.js | `3000` | Control center for platform administrators. |

**Database**: PostgreSQL (via Supabase)
**Authentication**: Supabase Auth (Email/Phone/OTP)
**Real-time notifications**: Socket.io + Web Push + Expo Push

---

## 🚀 How to Run

### 1. Start the Backend (Prerequisite)
The backend must be running for other apps to function.
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

### 2. Start the Apps (In separate terminals)

**Restaurant App**
```bash
cd restaurant-app
npm run dev
# Visit http://localhost:3003
```

**Admin Dashboard**
```bash
cd admin-dashboard
npm run dev
# Visit http://localhost:3000
```

**Delivery App**
```bash
cd delivery-app
npm run dev
# Visit http://localhost:3002
```

**User App (Android)**
```bash
cd user-app
npx expo start --go
# Scan the QR code with the Expo Go app on your Android phone.
# Ensure your phone is connected to the same Wi-Fi as your computer.
```

---

## 🔧 Configuration & Troubleshooting

### Database Connection
The system is configured to use **Supabase (PostgreSQL)**.
- **Backend Setup**: Ensure your `.env` file contains `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
- **Database Schema**: Run `backend/database/schema.sql` in your Supabase SQL Editor to set up the necessary tables and triggers.

### API Connection
- **Web Apps**: Connect to `https://api.degloormart.in/api` (Production) or `http://localhost:5000/api` (Local).
- **User App**: Configure `EXPO_PUBLIC_API_URL` in your `.env` or set it in the services/api.js.

---

## 📱 Features Implemented
- **Authentication**: Role-based login (Customer, Restaurant, Delivery, Admin).
- **Forgot Password**: Secure password reset via Phone OTP using APIHome.
- **Real-time Updates**: Socket.io integration for instant order alerts.
- **Dashboards**: Full analytics and management interfaces for all stakeholders.
- **Resilience**: Robust error handling and transaction monitoring.

---

© 2026 Degloor Mart
