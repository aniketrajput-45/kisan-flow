# KisanFlow Backend

Node.js + Express REST API for KisanFlow procurement coordination system.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
npm run migrate
```

4. Seed database with demo data:
```bash
npm run seed
```

5. Run development server:
```bash
npm run dev
```

6. Verify health endpoint:
```bash
curl http://localhost:5000/health
```

---

## Seed Data & Demo Credentials

When `npm run seed` is executed, the following pre-configured demo users and procurement centres are created:

### Demo Users (Password for all: `password123`)

| Role | Name | Phone Number | Password |
|---|---|---|---|
| **FARMER** | Ramesh Kumar | `9876543210` | `password123` |
| **OFFICER** | Suresh Sharma | `9876543211` | `password123` |
| **ADMIN** | Anita Roy | `9876543212` | `password123` |

### Demo Procurement Centres

1. **Burdwan Central Procurement Centre**
   - Code: `BDW-01`
   - Location: Burdwan, West Bengal
   - Daily Capacity: 500
2. **Durgapur Sub-Division Procurement Centre**
   - Code: `DGP-01`
   - Location: Paschim Bardhaman, West Bengal
   - Daily Capacity: 400

### Demo Slots
Initial slots created for demo date `2026-09-10`:
- `09:00 - 11:00` (Capacity: 50)
- `11:00 - 13:00` (Capacity: 50)
- `14:00 - 16:00` (Capacity: 50)
