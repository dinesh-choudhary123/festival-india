export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  CALENDAR_ROOM: DurableObjectNamespace;
  CALENDARIFIC_API_KEY: string;
  ENVIRONMENT: string;
}

export interface D1Festival {
  id: string;
  name: string;
  date: string;
  day: string;
  type: string;
  scope: string;
  category: string;
  description: string;
  where_celebrated: string;
  why_celebrated: string;
  how_celebrated: string;
  image_url: string | null;
  is_public_holiday: number;
  source: string;
  country: string;
  regions: string | null;
  year: number;
  created_at: string;
  updated_at: string;
}
