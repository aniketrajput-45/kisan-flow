# KisanFlow REST API Contract

Version: 1.0.0
Base URL: `/api`

---

## 1. Authentication Module (`/api/auth`)

### 1.1 Register User
- **HTTP Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth**: None
- **Role**: Public
- **Request Body**:
```json
{
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "role": "FARMER",
  "password": "optional_or_default"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_101",
      "name": "Ramesh Kumar",
      "phone": "9876543210",
      "role": "FARMER"
    },
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}
```
- **Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Phone number already registered"
}
```

### 1.2 Login User
- **HTTP Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: None
- **Role**: Public
- **Request Body**:
```json
{
  "phone": "9876543210",
  "password": "optional_or_default"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_101",
      "name": "Ramesh Kumar",
      "phone": "9876543210",
      "role": "FARMER"
    },
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

---

## 2. Farmer Module (`/api/farmer`)

### 2.1 Get Centres
- **HTTP Method**: `GET`
- **URL**: `/api/centres`
- **Auth**: Bearer JWT
- **Role**: `FARMER`, `OFFICER`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cnt_1",
      "name": "Burdwan Central Mandi",
      "district": "Burdwan",
      "state": "West Bengal",
      "capacity": 500
    }
  ]
}
```

### 2.2 Get Slots
- **HTTP Method**: `GET`
- **URL**: `/api/slots?centreId=cnt_1&date=2026-09-10`
- **Auth**: Bearer JWT
- **Role**: `FARMER`, `OFFICER`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "slt_10",
      "centre_id": "cnt_1",
      "date": "2026-09-10",
      "start_time": "09:00",
      "end_time": "11:00",
      "capacity": 50,
      "booked_count": 12,
      "available_seats": 38
    }
  ]
}
```

### 2.3 Create Booking (Concurrency Safe)
- **HTTP Method**: `POST`
- **URL**: `/api/bookings`
- **Auth**: Bearer JWT
- **Role**: `FARMER`
- **Request Body**:
```json
{
  "centre_id": "cnt_1",
  "slot_id": "slt_10",
  "crop": "Wheat",
  "quantity_kg": 4800
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "bkg_501",
    "token_number": "BDW-042",
    "qr_code": "KF-BKG-501-BDW-042",
    "status": "BOOKED",
    "centre_id": "cnt_1",
    "slot_id": "slt_10",
    "crop": "Wheat",
    "quantity_kg": 4800,
    "created_at": "2026-09-09T20:15:00Z"
  }
}
```
- **Error Response (409 Conflict)**:
```json
{
  "success": false,
  "error": "Slot capacity reached. Please select a different slot."
}
```

### 2.4 Get Booking Details
- **HTTP Method**: `GET`
- **URL**: `/api/bookings/:id`
- **Auth**: Bearer JWT
- **Role**: `FARMER`, `OFFICER`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "bkg_501",
    "farmer_name": "Ramesh Kumar",
    "farmer_phone": "9876543210",
    "token_number": "BDW-042",
    "qr_code": "KF-BKG-501-BDW-042",
    "crop": "Wheat",
    "quantity_kg": 4800,
    "status": "BOOKED",
    "centre_name": "Burdwan Central Mandi",
    "slot_time": "09:00 - 11:00"
  }
}
```

---

## 3. Queue Module (`/api/queue`)

### 3.1 Get Live Queue Status & ETA
- **HTTP Method**: `GET`
- **URL**: `/api/queue/:bookingId`
- **Auth**: Bearer JWT
- **Role**: `FARMER`, `OFFICER`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "booking_id": "bkg_501",
    "centre_id": "cnt_1",
    "slot_id": "slt_10",
    "your_token": "BDW-042",
    "current_serving_token": "BDW-035",
    "serving_number": 35,
    "people_ahead": 7,
    "average_service_time_mins": 10,
    "estimated_waiting_time_mins": 70,
    "queue_status": "IN_PROGRESS"
  }
}
```

---

## 4. Officer Module (`/api/officer`)

### 4.1 Lookup Booking by QR/Token or Search Query
- **HTTP Method**: `GET`
- **URL**: `/api/officer/booking/lookup?query=BDW-042` or `/api/officer/booking/:qrToken`
- **Auth**: Bearer JWT
- **Role**: `OFFICER`, `ADMIN`
- **Query Parameters**: `query` (QR string, Token number, or Farmer Phone)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "booking_id": "bkg_501",
    "farmer_name": "Ramesh Kumar",
    "farmer_phone": "9876543210",
    "token_number": "BDW-042",
    "crop": "Wheat",
    "declared_quantity_kg": 4800,
    "status": "ARRIVED"
  }
}
```

### 4.2 Record Procurement
- **HTTP Method**: `POST`
- **URL**: `/api/procurements`
- **Auth**: Bearer JWT
- **Role**: `OFFICER`
- **Request Body**:
```json
{
  "booking_id": "bkg_501",
  "weight_kg": 4800,
  "grade": "A",
  "rate_per_kg": 22.75
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "procurement_id": "prc_901",
    "booking_id": "bkg_501",
    "weight_kg": 4800,
    "grade": "A",
    "total_amount": 109200,
    "procurement_status": "COMPLETED",
    "payment": {
      "payment_id": "pmt_301",
      "status": "RECORDED",
      "amount": 109200
    },
    "sms": {
      "status": "DISPATCHED",
      "recipient": "9876543210"
    }
  }
}
```

---

## 5. Payment Module (`/api/payments`)

### 5.1 Get Payment Status
- **HTTP Method**: `GET`
- **URL**: `/api/payments/:bookingId`
- **Auth**: Bearer JWT
- **Role**: `FARMER`, `OFFICER`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "payment_id": "pmt_301",
    "booking_id": "bkg_501",
    "amount": 109200,
    "status": "RECORDED",
    "reference_number": "PAY-2026-BDW-901",
    "updated_at": "2026-09-09T20:15:00Z"
  }
}
```

### 5.2 Advance Payment Status (State Machine Simulation)
- **HTTP Method**: `PATCH`
- **URL**: `/api/payments/:id/status`
- **Auth**: Bearer JWT
- **Role**: `ADMIN`
- **Request Body**:
```json
{
  "status": "INITIATED"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "payment_id": "pmt_301",
    "previous_status": "RECORDED",
    "current_status": "INITIATED",
    "updated_at": "2026-09-09T20:16:00Z"
  }
}
```

---

## 6. SMS Webhook Module (`/api/sms`)

### 6.1 Receive SMS Webhook
- **HTTP Method**: `POST`
- **URL**: `/api/sms/webhook`
- **Auth**: None / Webhook Secret
- **Role**: Public / SMS Gateway Provider
- **Request Body**:
```json
{
  "from": "9876543210",
  "text": "1",
  "procurement_id": "prc_901"
}
```
*Note: Backend auto-correlates via `procurement_id` or latest unconfirmed procurement for `from` phone number.*
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "procurement_id": "prc_901",
    "verification_status": "CONFIRMED",
    "message": "SMS confirmation processed successfully"
  }
}
```


---

## 7. Admin Module (`/api/admin`)

### 7.1 Overview Metrics
- **HTTP Method**: `GET`
- **URL**: `/api/admin/overview`
- **Auth**: Bearer JWT
- **Role**: `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_bookings": 150,
    "completed_procurements": 98,
    "total_procured_kg": 470400,
    "total_payout_amount": 10701600,
    "active_queue_count": 22,
    "payment_breakdown": {
      "RECORDED": 20,
      "INITIATED": 30,
      "PROCESSING": 18,
      "CREDITED": 30
    }
  }
}
```

### 7.2 List Bookings
- **HTTP Method**: `GET`
- **URL**: `/api/admin/bookings`
- **Auth**: Bearer JWT
- **Role**: `ADMIN`

### 7.3 List Payments
- **HTTP Method**: `GET`
- **URL**: `/api/admin/payments`
- **Auth**: Bearer JWT
- **Role**: `ADMIN`
