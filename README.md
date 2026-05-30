# nippon-incentive-dashboard

🚀 **Live Demo:** [https://nippon-incentive-dashboard.vercel.app/](https://nippon-incentive-dashboard.vercel.app/)

A full-stack internal dashboard built with **Next.js 14** and **Supabase** for managing sales incentives at Nippon Toyota, Kochi Branch, Kerala. Sales officers log monthly car volumes and see progressive incentive payouts in real time, while admins manage inventory, configure slab tiers, and monitor branch-wide performance.

---

## Overview

| Portal | Who Uses It | Key Features |
|---|---|---|
| **Admin** | Branch Manager | Dashboard analytics, car inventory, slab config, employee directory, reports |
| **Officer** | Sales Staff | Log sales per model, real-time payout calculator, progressive tier tracker |

---

## Live Demo Accounts

If you are testing this application on Vercel, you can use the following credentials to explore the different role-based views:

**ADMIN ACCOUNT**
- Email: `admin@toyota.com`
- Password: `admin123`

**OFFICER ACCOUNT**
- Email: `officer@toyota.com`
- Password: `admin123`

---

## Features

### Authentication
- Supabase email/password login with role-based routing
- Dynamic real names fetched from the `users` table — no hardcoded placeholders
- Session persistence via SSR-safe middleware

### Admin Portal
- **Performance Dashboard** — KPI cards (monthly sales, incentive earned, target %, best-selling model), live line/bar charts, branch leaderboard
- **Car Inventory** — CRUD for Toyota models with stock levels, variant, tier badges (`Tier A / S / Premium`), and status indicators (`In Stock / Low Stock / Out of Stock`)
- **Incentive Slabs** — Visual tier cards + editor table; create/edit/delete slabs with live payout preview; real-time Supabase Realtime sync
- **Employee Directory** — Staff listing with sales figures and role badges
- **Reports** — Historical revenue and payout bar charts, downloadable report entries

### Officer Portal
- **Log Sales & Incentives** — Input quantities per car model; progressive slab logic calculates payout across all qualifying tiers simultaneously
- **Real-Time Breakdown** — Animated per-tier card showing cars counted, rate, and partial payout
- **Save to Database** — Logs `total_cars`, `total_incentive`, and full `breakdown` JSON to `monthly_sales` table for historical comparison
- **Officer Dashboard** — Personal overview of current month's figures

### Incentive Logic (Progressive Slabs)
The system applies a progressive/tiered model — not a flat rate. Selling 10 cars with three configured slabs pays out across all qualifying tiers:

```
Slab 1: 1–3 cars   → Rs.1,000/car
Slab 2: 4–7 cars   → Rs.2,000/car
Slab 3: 8+ cars    → Rs.3,500/car

Officer sells 10 cars:
  Cars 1–3  (3 cars x Rs.1,000) = Rs.3,000
  Cars 4–7  (4 cars x Rs.2,000) = Rs.8,000
  Cars 8–10 (3 cars x Rs.3,500) = Rs.10,500
  ─────────────────────────────────────────
  Total Incentive                = Rs.21,500
```

### Design
- Toyota Red (`#EB0A1E`) brand color system with CSS variables throughout
- `Plus Jakarta Sans` headings, `Inter` body, `Bebas Neue` for stat numbers
- Framer Motion animations on slab cards and payout display
- Fully responsive — desktop sidebar and mobile bottom tab bar
- All currency formatted as Indian Rupee via `Intl.NumberFormat('en-IN')`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel (recommended) |

---

## Supabase Schema
 
Paste the entire block below into your Supabase SQL editor and run it once. It creates all four tables, enables Row Level Security with appropriate policies, seeds the default incentive slabs, and sets up a trigger that auto-creates a `public.users` row whenever a new auth user signs up.
 
```sql
-- ==========================================
-- COMPLETE SUPABASE SCHEMA FOR NIPPON TOYOTA
-- ==========================================
 
-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 
 
-- 1. USERS TABLE
-- Tracks user roles and metadata
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'officer' CHECK (role IN ('admin', 'officer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 
-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
 
-- Auto-create a users row on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Toyota Employee'),
    COALESCE(new.raw_user_meta_data->>'role', 'officer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
 
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
 
 
-- 2. INCENTIVE SLABS TABLE
-- Dynamic tiered incentive configuration
CREATE TABLE IF NOT EXISTS public.incentive_slabs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name TEXT NOT NULL,
  min_cars INTEGER NOT NULL,
  max_cars INTEGER,                  -- NULL means no upper limit (open-ended tier)
  incentive_per_car INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 
ALTER TABLE public.incentive_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view slabs" ON public.incentive_slabs
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage slabs" ON public.incentive_slabs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
 
-- Default slabs (1-3, 4-7, 8+)
INSERT INTO public.incentive_slabs (tier_name, min_cars, max_cars, incentive_per_car)
VALUES
  ('Tier A',       1, 3,    1000),
  ('Tier S',       4, 7,    2000),
  ('Tier Premium', 8, NULL, 3500)
ON CONFLICT DO NOTHING;
 
 
-- 3. CARS TABLE (INVENTORY)
-- Admin configuration for car models and stock
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  base_suffix TEXT,
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'In Stock',
  tier TEXT DEFAULT 'Tier A',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cars" ON public.cars
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage cars" ON public.cars
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
 
 
-- 4. MONTHLY SALES TABLE
-- Officer portal tracking for calculated sales payouts
CREATE TABLE IF NOT EXISTS public.monthly_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  user_name TEXT,
  month TEXT NOT NULL,
  total_cars INTEGER DEFAULT 0,
  total_incentive NUMERIC(10, 2) DEFAULT 0,
  breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 
ALTER TABLE public.monthly_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sales" ON public.monthly_sales
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sales" ON public.monthly_sales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can insert their own sales" ON public.monthly_sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales" ON public.monthly_sales
  FOR UPDATE USING (auth.uid() = user_id);
```
 
### RLS Summary
 
| Table | Officers | Admins |
|---|---|---|
| `users` | View own row only | View all rows |
| `incentive_slabs` | Read only | Full CRUD |
| `cars` | Read only | Full CRUD |
| `monthly_sales` | View/insert/update own rows | View all rows |
 
---
 
## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
git clone https://github.com/<your-username>/nippon-incentive-dashboard.git
cd nippon-incentive-dashboard
npm install
```

### Environment Setup

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from your Supabase project under **Settings → API**.

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

### Creating Users

In Supabase under **Authentication → Users**, invite a user. Then assign them a role via SQL:

```sql
insert into users (id, name, role) values
  ('<paste-user-uuid>', 'Your Name', 'admin');
  -- or 'officer' for sales staff
```

---

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/      # KPIs, charts, leaderboard
│   │   ├── cars/           # Vehicle inventory CRUD
│   │   ├── slabs/          # Incentive tier configuration
│   │   ├── employees/      # Staff directory
│   │   ├── reports/        # Analytics and exports
│   │   └── layout.tsx      # Admin shell with Sidebar
│   ├── officer/
│   │   ├── dashboard/      # Personal monthly overview
│   │   ├── calculator/     # Sales logger + payout engine
│   │   └── layout.tsx      # Officer shell with Sidebar
│   ├── login/              # Auth page
│   └── globals.css         # CSS variables and Toyota theme
├── components/
│   ├── Sidebar.tsx         # Desktop sidebar + mobile tab bar
│   └── ui/                 # shadcn/ui primitives
├── context/
│   └── AuthContext.tsx     # Global user/role/name state
├── lib/
│   ├── incentiveCalc.ts    # Progressive slab logic + INR formatter
│   └── supabase/           # Client, server, middleware helpers
└── middleware.ts            # Session refresh on every request
```

---

## AI Disclosure

AI assistance (Claude by Anthropic) was used in this project to improve code structure, suggest integration patterns, and assist with documentation. The project is not AI-dependent — all business logic, database design, incentive calculation architecture, and feature decisions were independently developed and implemented.

---

## License

Not licensed for commercial deployment without explicit permission.
