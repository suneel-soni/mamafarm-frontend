# MamaFarm Frontend

Next.js 15 App Router Frontend UI for MamaFarm Organic Sprouts Business Tracker.

## Prerequisites
- Node.js v18+
- npm or yarn

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Features
- Dashboard KPI Overview & Real-Time Metrics
- Shop & Client Ledger Tracking
- Dispatch & Delivery Record Entry
- Payments & Outstanding Collection Management
- Returns & Unsold Sprouts Logging
- Raw Grain & Packaging Material Stock Tracking
- Operating Expense Manager
- Business Profit & Loss Analytics
- Complete Offline Fallback & Local Storage Backup for Mobile Delivery Personnel

## Deployment (Vercel)
1. Push `mamafarm-frontend` to GitHub.
2. Import project into Vercel.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-mamafarm-backend.onrender.com/api`
4. Deploy!
