# KisanFlow — Farmer Mobile Application (React Native / Expo)

The **Farmer App** is the mobile application for KisanFlow, allowing farmers to book procurement slots at government Mandis, view backend-generated Token Passes & QR codes, track live queue ETA in real time, and monitor Direct Benefit Transfer (DBT) payment progression.

---

## 🚀 Key Features

1. **Authentication**: Farmer registration & login using JWT authentication.
   - *Security Rule*: Public registration automatically assigns the `FARMER` role on the backend (role parameter is never sent from frontend).
2. **Procurement Centre & Slot Booking**:
   - Fetches active procurement centres (`GET /api/centres`).
   - Fetches live slot capacity and remaining availability (`GET /api/slots`).
   - Concurrency-safe booking submission (`POST /api/bookings`) with strictly bounded payloads (`{ centre_id, slot_id, crop, quantity_kg }`).
3. **Digital Token Pass & QR Display**:
   - Visual scannable token pass displaying backend-generated Token Number (e.g. `BDW-042`) and backend QR code string.
4. **Live Queue & Real-time ETA Tracker**:
   - Displays live token count, currently served farmer token, farmers ahead in queue, and calculated estimated waiting time (`GET /api/queue/:bookingId`).
5. **DBT Payment Status Tracker**:
   - Visual progress stepper (`RECORDED` -> `INITIATED` -> `PROCESSING` -> `CREDITED`) showing backend payout amount and payment reference number (`GET /api/payments/:bookingId`).

---

## 🛠️ Running the Application

### Development Server (Expo / Mobile Web)

```bash
cd farmer-app
npm install
npm start
```

### Environment Configuration

The backend API base URL is resolved dynamically via `src/config.js`:
- Web / Local Dev: `http://localhost:5000/api`
- Android Emulator: `http://10.0.2.2:5000/api`
- Custom URL: set `EXPO_PUBLIC_API_URL` environment variable.

---

## 🔒 Compliance & Security Rules

- **Backend as Source of Truth**: Token numbers, QR identifiers, queue positions, ETAs, and payment amounts are never generated or altered on the frontend.
- **No Derived Fields Sent**: The booking request sends ONLY `{ centre_id, slot_id, crop, quantity_kg }`. User identity and booking dates are derived strictly by backend JWT verification.
- **Centralized API Client**: All HTTP requests flow through `src/api/client.js` with automatic Bearer token injection and explicit error handling (400, 401, 403, 409, 500).
