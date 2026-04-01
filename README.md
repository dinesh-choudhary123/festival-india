# Festival India — Social Media Calendar

A complete Indian festivals & events calendar with **500+ events per year** across all categories. Built for social media teams to plan, budget, and benchmark content around festivals, observances, and special days.

**Data sources:** Calendarific API + 400+ hand-curated events from the Topical Master sheet
**Coverage:** 2026–2030

---

## Features

- **500+ festivals/events per year** — Religious, Cultural, National, Global, Regional, Fun/Quirky
- **Filters** — Year, Month, Category, Type, Scope, Search (all instant, client-side)
- **My Calendar** — Add events, set ownership, track Creative & Media budgets
- **Currency selector** — INR ₹, USD $, EUR €, GBP £, JPY ¥, AED, SGD S$, AUD A$
- **Benchmarking** — Paste any social media URL; auto-fetches metrics via Apify
  - YouTube: views + likes fetched instantly (no Apify needed)
  - Instagram / Twitter / Facebook: fetched via Apify (~30–60s)
- **3-dot Actions menu** — Make Post, View Details, Remove from Calendar
- **Info tooltips** — Hover the ⓘ icon for festival description & celebration details
- **Dashboard** — Analytics charts by month, type, scope, category
- **Calendar view** — Monthly grid view of all festivals
- **Moment Marketing** — Upcoming events sorted by urgency
- **Offline/seed mode** — Frontend works fully with 500+ built-in events even without the API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (TypeScript), Tailwind CSS |
| Backend | Cloudflare Workers + tRPC v11 |
| Database | Cloudflare D1 (SQLite at the edge) |
| Storage | Cloudflare R2 |
| Monorepo | Turborepo + npm workspaces |

---

## Project Structure

```
festival-india/
├── apps/
│   ├── web/          # Next.js frontend (runs on port 3000)
│   └── api/          # Cloudflare Worker API (runs on port 8787)
├── packages/
│   └── shared/       # Shared types & utilities
└── scripts/          # Scraping & seed scripts
```

---

## Quick Start — Frontend Only (Recommended for First Run)

The frontend works **completely standalone** with 500+ built-in festivals. You do **not** need Cloudflare, a database, or any API to see it running.

### Prerequisites

- Node.js >= 20
- npm >= 9

### Step 1 — Clone & Install

```bash
git clone https://github.com/dinesh-choudhary123/festival-india.git
cd festival-india
npm install
```

### Step 2 — Create the Environment File

Create a file called `.env.local` inside `apps/web/`:

```bash
# On Mac/Linux:
touch apps/web/.env.local

# On Windows (Command Prompt):
type nul > apps\web\.env.local
```

### Step 3 — Add API Keys to `.env.local`

Open `apps/web/.env.local` in any text editor and paste the following:

```env
# Cloudflare Worker API URL (leave as-is for local dev)
NEXT_PUBLIC_API_URL=http://localhost:8787

# ─── Calendarific ────────────────────────────────────────────────────
# Used to fetch real festival dates from the Calendarific API
# Get a free key at: https://calendarific.com/signup
NEXT_PUBLIC_CALENDARIFIC_KEY=ffurwBPNGQtQQS7mRcuVcYZxGAfxDZc0

# ─── Apify (for Benchmarking feature) ───────────────────────────────
# Used to auto-scrape likes/views/comments from Instagram, Twitter, Facebook
# Get your token at: https://apify.com → Settings → Integrations → API tokens
# YouTube works WITHOUT this key (it uses direct HTML scraping)
APIFY_TOKEN=your_apify_token_here
```

> ⚠️ **Security:** Never share or commit this file to Git. It is already listed in `.gitignore`.

### Step 4 — How to Get Your Apify API Token

1. Go to [https://apify.com](https://apify.com) and create a free account
2. After logging in, click your avatar (top right) → **Settings**
3. Go to the **Integrations** tab
4. Copy your **Personal API token**
5. Paste it into `.env.local` replacing `your_apify_token_here`

### Step 5 — Run the App

```bash
cd apps/web
npx next dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Benchmarking — Platform Support

In **My Calendar**, click **Add** in the Benchmarking column, paste a social media URL, and click **Auto-Fetch**.

| Platform | Speed | What Gets Fetched |
|---|---|---|
| **YouTube** | ✅ ~1 second | Views, Likes (Comments if available) |
| **Instagram** | ⚡ ~30–60s | Likes, Comments, Views (public posts only) |
| **Twitter / X** | ⚡ ~30–60s | Likes, Replies, Retweets, Views |
| **Facebook** | ⚡ ~30–60s | Likes/Reactions, Comments, Shares, Views |

> **Note on Instagram:** Instagram has heavily restricted automated access since 2023. If the post is private or Instagram blocks the request, you'll see a message to enter the numbers manually — this is a platform limitation, not a bug. YouTube always works instantly.

---

## Full Setup (with Live Cloudflare API Backend)

Skip this section if you just want to run the frontend.

### Additional Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is fine)
- Wrangler CLI: `npm install -g wrangler`

### 1. Set Up Cloudflare Resources

```bash
npx wrangler login

# Create D1 database — copy the database_id from the output
npx wrangler d1 create festival-india-db

# Create R2 bucket
npx wrangler r2 bucket create festival-india-assets
```

### 2. Configure the API Worker

```bash
cp apps/api/wrangler.toml.example apps/api/wrangler.toml
```

Edit `apps/api/wrangler.toml` and fill in:
- `database_id` — the D1 ID from above
- `CALENDARIFIC_API_KEY` — `ffurwBPNGQtQQS7mRcuVcYZxGAfxDZc0`

### 3. Set Up the Database

```bash
cd apps/api
npm run db:migrate   # Creates tables
npm run db:seed      # Seeds with festivals
```

### 4. Start Both Services

```bash
# From the project root:
npm run dev
# → Frontend on http://localhost:3000
# → API on http://localhost:8787
```

---

## Deploying to Production

```bash
cd apps/api
npm run db:migrate:remote   # Run migrations on remote D1
npm run db:seed:remote      # Seed remote database
npm run deploy              # Deploy Cloudflare Worker
```

For the Next.js frontend, deploy to **Vercel** or **Cloudflare Pages** and set these environment variables in the dashboard:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your deployed Cloudflare Worker URL |
| `APIFY_TOKEN` | Your Apify personal API token |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Page shows unstyled raw HTML | Delete `.next` folder: `rm -rf apps/web/.next` then restart |
| Benchmarking shows "APIFY_TOKEN not configured" | Add `APIFY_TOKEN=your_token` to `apps/web/.env.local` and restart server |
| Instagram auto-fetch fails | Instagram restricts bots — enter metrics manually from the post page |
| No festivals loading | The app always falls back to 500+ built-in seed festivals automatically |
| Build errors | Run `cd apps/web && npx next build` to see the exact error message |
