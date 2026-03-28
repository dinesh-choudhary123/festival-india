export type FestivalType = "Festival Day" | "Social Day" | "Observance";
export type FestivalScope = "Global" | "National" | "Regional";
export type FestivalCategory =
  | "Religious"
  | "Cultural"
  | "Environmental"
  | "Health"
  | "Social"
  | "Political"
  | "Fun";

export interface Festival {
  id: string;
  name: string;
  date: string;
  day: string;
  type: FestivalType;
  scope: FestivalScope;
  category: FestivalCategory;
  description: string;
  where_celebrated: string;
  why_celebrated: string;
  how_celebrated: string;
  image_url: string | null;
  is_public_holiday: boolean;
  source: string;
  country: string;
  regions: string[];
  year: number;
}

export interface FestivalFilters {
  year: number;
  month: number;
  category: string;
  type: string;
  scope: string;
  search: string;
}

export interface CalendarEntry {
  id: string;
  festival_id: string;
  name: string;
  date: string;
  day: string;
  type: string;
  scope: string;
  category: string;
  description: string;
  notes: string | null;
  added_at: string;
}
