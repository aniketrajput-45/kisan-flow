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

3. Run development server:
```bash
npm run dev
```

4. Verify health endpoint:
```bash
curl http://localhost:5000/health
```
