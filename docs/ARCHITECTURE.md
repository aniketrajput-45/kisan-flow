# KisanFlow Architecture Document

## 1. System Overview

KisanFlow is designed as a monolithic backend REST API serving two client interfaces:
- **Farmer Mobile App** (React Native)
- **Officer & Admin Dashboard** (React Web)

```
+---------------------+        +-------------------------+
|  Farmer Mobile App  |        | Officer/Admin Web App   |
|   (React Native)    |        |        (React)          |
+----------+----------+        +------------+------------+
           |                                |
           +----------------+---------------+
                            | REST API (JWT)
                            v
              +---------------------------+
              |      Node.js / Express    |
              |       Monolithic API      |
              +-------------+-------------+
                            |
           +----------------+----------------+
           |                                 |
           v                                 v
+-----------------------+        +-----------------------+
|  PostgreSQL Database  |        |      Redis Cache      |
|  (Persistent Source   |        |  (Live Serving State  |
|      of Truth)        |        |     & Queue Count)    |
+-----------------------+        +-----------------------+
```

## 2. Core Technical Decisions

- **Persistence Layer**: PostgreSQL handles authoritative relational records (`users`, `centres`, `slots`, `bookings`, `procurements`, `payments`, `sms_verifications`).
- **Live Queue Layer**: Redis maintains current active token counters per centre/slot for real-time serving updates and rolling ETA calculations (`ETA = farmers_ahead * avg_service_time`).
- **Concurrency Control**: Concurrency-safe slot booking enforced at PostgreSQL level using explicit row locking (`SELECT slot FOR UPDATE`) inside atomic database transactions.
- **SMS Abstraction**: `smsService` interface supports outbound dispatch and inbound webhook processing (`1` -> `CONFIRMED`, `2` -> `DISPUTED`).
- **Payment State Machine**: Internal PostgreSQL-backed transition states (`RECORDED` -> `INITIATED` -> `PROCESSING` -> `CREDITED`).

## 3. Core Database Schema & Entities

```
+-----------------------------------------------------------------------------------+
| ENTITY           | CORE FIELDS                                                    |
+------------------+----------------------------------------------------------------+
| users            | id, phone, name, role (FARMER|OFFICER|ADMIN), created_at       |
| centres          | id, name, code, district, state, capacity, is_active           |
| slots            | id, centre_id, date, start_time, end_time, capacity, booked    |
| bookings         | id, user_id, centre_id, slot_id, token_num, qr_code, crop, kg  |
| procurements     | id, booking_id, officer_id, weight_kg, grade, total_amount     |
| payments         | id, procurement_id, booking_id, farmer_id, amount, status     |
| sms_verifications| id, procurement_id, farmer_phone, message, response, status    |
+-----------------------------------------------------------------------------------+
```

## 4. State Machines

### Booking State Machine
`BOOKED` -> `ARRIVED` -> `IN_QUEUE` -> `PROCESSING` -> `COMPLETED` (or `CANCELLED` / `NO_SHOW`)

### Payment State Machine
`RECORDED` -> `INITIATED` -> `PROCESSING` -> `CREDITED`

### SMS Verification Flow
Procurement Saved -> Outbound SMS -> Webhook Receives Response (`1`/`2`) -> `CONFIRMED` / `DISPUTED`
