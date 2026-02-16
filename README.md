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

**Database**: Firebase (Auth + Firestore)
**Real-time**: Socket.io + Firebase Cloud Messaging

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
The system is configured to use **Firebase Firestore**.
- **Issue**: If you see empty lists (no restaurants/orders), it likely means Firestore is not enabled in your Firebase Console.
- **Fix**: Go to [Firebase Console](https://console.firebase.google.com/) -> Select Project `degloormart` -> Build -> Firestore Database -> **Create Database**.
- **Fallback**: All apps have a **Robust Demo Mode**. If the database is unreachable, they will automatically show demo data (e.g., "Biryani Palace" restaurant) so you can test the UI and flow immediately.

### API Connection
- **Web Apps**: Connect to `http://localhost:5000`.
- **User App**: Connects to `http://172.20.10.2:5000` (Your Wi-Fi IP).
  - *If your IP changes*: Update `API_BASE_URL` in `user-app/src/services/api.js`.

---

## 📱 Features Implemented
- **Authentication**: Role-based login (Customer, Restaurant, Delivery, Admin).
- **Real-time Updates**: Socket.io integration for instant order alerts.
- **Dashboards**: Full analytics and management interfaces for all stakeholders.
- **Resilience**: "Graceful degradation" ensures apps don't crash even if the backend is down.

---

© 2026 Degloor Mart
