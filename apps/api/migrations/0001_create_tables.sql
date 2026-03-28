-- ============================================
-- Festival India — D1 Database Schema
-- ============================================

-- Core festivals table
CREATE TABLE IF NOT EXISTS festivals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  day TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('Festival Day', 'Social Day', 'Observance')),
  scope TEXT NOT NULL CHECK(scope IN ('Global', 'National', 'Regional')),
  category TEXT NOT NULL CHECK(category IN ('Religious', 'Cultural', 'Environmental', 'Health', 'Social', 'Political', 'Fun')),
  description TEXT NOT NULL DEFAULT '',
  where_celebrated TEXT NOT NULL DEFAULT '',
  why_celebrated TEXT NOT NULL DEFAULT '',
  how_celebrated TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  is_public_holiday INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('calendarific', 'supplementary', 'manual')),
  country TEXT NOT NULL DEFAULT 'IN',
  regions TEXT, -- JSON array of region codes
  year INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_festivals_year ON festivals(year);
CREATE INDEX IF NOT EXISTS idx_festivals_date ON festivals(date);
CREATE INDEX IF NOT EXISTS idx_festivals_type ON festivals(type);
CREATE INDEX IF NOT EXISTS idx_festivals_scope ON festivals(scope);
CREATE INDEX IF NOT EXISTS idx_festivals_category ON festivals(category);
CREATE INDEX IF NOT EXISTS idx_festivals_country ON festivals(country);
CREATE INDEX IF NOT EXISTS idx_festivals_year_month ON festivals(year, date);
CREATE INDEX IF NOT EXISTS idx_festivals_name ON festivals(name);

-- User calendar entries
CREATE TABLE IF NOT EXISTS calendar_entries (
  id TEXT PRIMARY KEY,
  festival_id TEXT NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  notes TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(festival_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_user ON calendar_entries(user_id);

-- Social media posts
CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  festival_id TEXT NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('instagram', 'twitter', 'facebook', 'linkedin')),
  scheduled_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_festival ON social_posts(festival_id);

-- Scrape log to track when data was last fetched
CREATE TABLE IF NOT EXISTS scrape_log (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  year INTEGER NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'partial')),
  festivals_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source, year, country)
);

-- Settings / metadata
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
