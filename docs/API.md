# KisanFlow REST API Contract

Version: 1.0.0
Base URL: `/api`

---

## 1. Authentication Module (`/api/auth`)

### 1.1 Register User
- **HTTP Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth**: None
- **Role**: Public (Registers as `FARMER`)
- **Request Body**:
```json
{
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "password": "password123"
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

## 4. Officer Module (`/api/officer`) & Procurement (`/api/procurements`)

### 4.1 Lookup Booking by QR Code or Token Number
- **HTTP Method**: `GET`
- **URL**: `/api/officer/booking/lookup?query=BDW-001` or `/api/officer/booking/:qrToken`
- **Auth**: Bearer JWT
- **Role**: `OFFICER`, `ADMIN` (Farmer gets `403 Forbidden`)
- **Query Parameters**: `query` (QR string or Token number)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "booking_id": 100,
    "token_number": "BDW-001",
    "qr_code": "KF-BKG-100-BDW-001",
    "crop": "WHEAT",
    "booked_quantity_kg": 4800,
    "booking_status": "BOOKED",
    "created_at": "2026-09-09T20:00:00.000Z",
    "farmer_name": "Ramesh Kumar",
    "farmer_phone": "9876543210",
    "centre_id": 1,
    "centre_name": "Burdwan Procurement Centre",
    "centre_code": "BDW",
    "slot_id": 1,
    "slot_date": "2026-09-10",
    "start_time": "09:00:00",
    "end_time": "11:00:00"
  }
}
```
- **Error Response (403 Forbidden)**:
```json
{
  "success": false,
  "error": "Access denied. Requires one of roles: OFFICER, ADMIN"
}
```
- **Error Response (404 Not Found)**:
```json
{
  "success": false,
  "error": "No booking found matching the provided lookup criteria"
}
```

### 4.2 Record Procurement
- **HTTP Method**: `POST`
- **URL**: `/api/procurements`
- **Auth**: Bearer JWT
- **Role**: `OFFICER`, `ADMIN` (Farmer gets `403 Forbidden`)
- **Request Body**:
```json
{
  "booking_id": 100,
  "weight_kg": 4800,
  "grade": "A"
}
```
- **Validation Rules**:
  - `booking_id` must exist, belong to valid centre/slot, and be in a processable status (`BOOKED`, `ARRIVED`, `IN_QUEUE`, `PROCESSING`).
  - `weight_kg` > 0.
  - `grade` must be present.
  - Procurement must NOT already exist for this booking.
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "procurement": {
      "id": 10,
      "booking_id": 100,
      "officer_id": 2,
      "weight_kg": 4800,
      "grade": "A",
      "total_amount": 109200,
      "status": "COMPLETED",
      "created_at": "2026-09-09T21:50:00.000Z"
    },
    "payment": {
      "id": 100,
      "procurement_id": 10,
      "booking_id": 100,
      "farmer_id": 1,
      "amount": 109200,
      "status": "RECORDED",
      "reference_number": "PAY-2026-100-1788971193719",
      "updated_at": "2026-09-09T21:50:00.000Z"
    }
  }
}
```
- **Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Booking is in 'COMPLETED' state and cannot be processed for procurement"
}
```

---

## 5. Payment Module (`/api/payments`)

### 5.1 Get Payment Status
- **HTTP Method**: `GET`
- **URL**: `/api/payments/:bookingId`
- **Auth**: Bearer JWT
- **Role**: `FARMER` (own payments only), `OFFICER`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "payment_id": 100,
    "procurement_id": 10,
    "booking_id": 100,
    "farmer_id": 1,
    "amount": 109200,
    "status": "RECORDED",
    "reference_number": "PAY-2026-100-1788971193719",
    "updated_at": "2026-09-09T21:50:00.000Z"
  }
}
```

### 5.2 Payment State Machine Status Transition
- **HTTP Method**: `PATCH`
- **URL**: `/api/payments/:id/status`
- **Auth**: Bearer JWT
- **Role**: `OFFICER`, `ADMIN` (Farmer gets `403 Forbidden`)
- **Request Body**:
```json
{
  "status": "INITIATED"
}
```
- **State Transition Rules**:
  - `RECORDED` -> `INITIATED`
  - `INITIATED` -> `PROCESSING`
  - `PROCESSING` -> `CREDITED`
- Arbitrary jumps (e.g. `RECORDED` -> `CREDITED`) are strictly rejected.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "payment_id": 100,
    "previous_status": "RECORDED",
    "current_status": "INITIATED",
    "amount": 109200,
    "reference_number": "PAY-2026-100-1788971193719",
    "updated_at": "2026-09-09T21:52:00.000Z"
  }
}
```
- **Error Response (409 Conflict)**:
```json
{
  "success": false,
  "error": "Invalid payment state transition from 'RECORDED' to 'CREDITED'. Allowed transition: INITIATED"
}
```


---

## 6. SMS Module (`/api/sms`)

### 6.1 Outbound SMS Format
Upon successful procurement recording, an outbound SMS verification record is generated with direction `OUTBOUND` and initial status `SENT`:
```text
Your procurement details:
Farmer: {farmer_name}
Crop: {crop}
Weight: {weight_kg} kg
Grade: {grade}
Centre: {centre_name}

Reply 1 to CONFIRM
Reply 2 to DISPUTE
```

### 6.2 Inbound SMS Webhook
- **HTTP Method**: `POST`
- **URL**: `/api/sms/webhook`
- **Auth**: None (Public gateway webhook endpoint)
- **Request Body**:
```json
{
  "procurement_id": 10,
  "from": "9876543210",
  "message": "1"
}
```
- **Correlation Logic**:
  - Primary correlation uses `procurement_id` if supplied.
  - Fallback correlation uses `from` phone number to match the latest pending `SENT` outbound SMS verification for that farmer.
- **Accepted Replies & Normalization**:
  - `1`, ` 1 `, `confirm`, `CONFIRM` $\rightarrow$ Status updated to `CONFIRMED`
  - `2`, ` 2 `, `dispute`, `DISPUTE` $\rightarrow$ Status updated to `DISPUTED`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "procurement_id": 10,
    "status": "CONFIRMED",
    "response": "1",
    "updated_at": "2026-09-09T22:26:42.735Z"
  }
}
```
- **Error Response (404 Not Found)**:
```json
{
  "success": false,
  "error": "No pending SMS verification found for phone: 9876543210"
}
```
- **Error Response (409 Conflict - Duplicate Reply)**:
```json
{
  "success": false,
  "error": "Procurement #10 SMS verification is already resolved as 'CONFIRMED'"
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
