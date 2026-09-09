# KisanFlow — Smart Procurement-Centre Coordination Platform

KisanFlow is a smart procurement-centre coordination platform (SIH Problem Statement 26032) designed for the Ministry of Consumer Affairs, Food & Public Distribution (DoCA). It reduces farmer wait times, provides live queue & schedule visibility, and streamlines procurement and payment tracking.

## Repository Structure

```
KisanFlow/
├── backend/          # Node.js + Express REST API (PostgreSQL + Redis)
├── farmer-app/       # React Native application for Farmers
├── web-dashboard/    # React web application for Officers and Admins
├── docs/             # Technical design & API specification contracts
│   ├── API.md
│   └── ARCHITECTURE.md
└── README.md
```

## Setup & Running Backend

See [backend/README.md](file:///c:/Users/rajpu/Desktop/kisan-flow/backend/README.md) for detailed backend instructions.

```bash
cd backend
npm install
npm run dev
```

Health check verification:
```bash
curl http://localhost:5000/health
```
