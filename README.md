# Festival India — Social Media Calendar

A complete Indian festivals & events calendar with **200+ events per year** across all categories. Built for social media teams to plan content around festivals, observances, and special days.

**Data sources:** Calendarific API + 150 hand-curated regional/cultural events
**Coverage:** 2026–2030 (auto-renews yearly)

## Tech Stack

- **Frontend:** Next.js 15 (TypeScript), Tailwind CSS
- **Backend:** Cloudflare Workers + tRPC v11
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2
- **Real-time:** Durable Objects (WebSocket)
- **Monorepo:** Turborepo with npm workspaces

## Project Structure

```
festival-india/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # Cloudflare Worker API (port 8787)
├── packages/
│   └── shared/       # Shared types & utilities
└── scripts/          # Scraping & seed scripts
```

## Quick Start

### Prerequisites

- Node.js >= 20
- npm
- A [Calendarific API key](https://calendarific.com/signup) (free tier — 1000 req/month)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/dinesh-choudhary123/festival-india.git
cd festival-india
npm install
```

### 2. Set Up Cloudflare Resources

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create festival-india-db
# Note the database_id from the output

# Create R2 bucket
npx wrangler r2 bucket create festival-india-assets
```

### 3. Configure the API

```bash
# Copy the example config
cp apps/api/wrangler.toml.example apps/api/wrangler.toml
```

Edit `apps/api/wrangler.toml` and fill in your values:
- `CALENDARIFIC_API_KEY` — your API key from calendarific.com
- `database_id` — the D1 database ID from step 2

### 4. Set Up the Database

```bash
cd apps/api

# Run migrations (creates tables)
npm run db:migrate

# Seed with 793 festivals (works offline without Calendarific)
npm run db:seed
```

### 5. Configure the Frontend

```bash
# Create env file for the web app
echo "NEXT_PUBLIC_API_URL=http://localhost:8787" > apps/web/.env.local
```

### 6. Start Development

```bash
# From project root — starts both frontend and API
npm run dev
```

Or start them separately:
```bash
npm run dev:api   # API on http://localhost:8787
npm run dev:web   # Frontend on http://localhost:3000
```

### 7. (Optional) Scrape Live Data from Calendarific

The seed data is enough to run the app. To fetch fresh data from Calendarific:

```bash
# Scrape all years (2026-2030) — uses your API key
curl "http://localhost:8787/trpc/scraper.scrapeAll?input=%7B%7D"
```

## Features

- **Filters:** Year, Month, Category, Type, Scope, Search — all work client-side for instant results
- **Festival types:** Festival Day, Social Day, Observance
- **Scopes:** Global, National, Regional
- **7 categories:** Religious, Cultural, Environmental, Health, Social, Political, Fun
- **Info tooltips:** Hover the (i) icon to see festival description and where it's celebrated
- **Dashboard:** Analytics with charts showing distribution by month, type, scope, category
- **Calendar view:** Monthly grid view of all festivals
- **Moment Marketing:** Upcoming festivals prioritized by urgency
- **Offline mode:** Frontend works with built-in seed data even without the API
- **Auto-renewal:** Cron trigger scrapes new data each January 1st

## Deploying to Production

```bash
cd apps/api

# Run migrations on remote D1
npm run db:migrate:remote

# Seed remote database
npm run db:seed:remote

# Deploy worker
npm run deploy
```

Then deploy the Next.js frontend to Vercel/Cloudflare Pages and set `NEXT_PUBLIC_API_URL` to your worker URL.
