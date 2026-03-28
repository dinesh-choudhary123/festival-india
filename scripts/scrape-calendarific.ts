#!/usr/bin/env tsx
// ============================================
// Calendarific Scraper — Standalone Script
// Fetches festival data and outputs SQL INSERT statements
// Usage: CALENDARIFIC_API_KEY=xxx tsx scripts/scrape-calendarific.ts [year] [country]
// ============================================

const API_KEY = process.env.CALENDARIFIC_API_KEY;
const YEAR = parseInt(process.argv[2] || String(new Date().getFullYear()), 10);
const COUNTRY = process.argv[3] || "IN";

if (!API_KEY) {
  console.error("Error: Set CALENDARIFIC_API_KEY environment variable");
  console.error("Get a free key at https://calendarific.com/api-documentation");
  process.exit(1);
}

interface Holiday {
  name: string;
  description: string;
  date: { iso: string };
  type: string[];
  primary_type: string;
  locations: string;
  states: string | { name: string }[];
}

function mapType(primaryType: string): string {
  const t = primaryType.toLowerCase();
  if (t.includes("national") || t.includes("public") || t.includes("religious")) return "Festival Day";
  if (t.includes("observance") || t.includes("season")) return "Observance";
  return "Social Day";
}

function mapScope(locations: string, states: Holiday["states"]): string {
  if (locations === "All") return "National";
  if (Array.isArray(states) && states.length > 15) return "National";
  if (Array.isArray(states) && states.length > 0) return "Regional";
  return "National";
}

function mapCategory(types: string[], name: string): string {
  const combined = (types.join(" ") + " " + name).toLowerCase();
  if (/hindu|muslim|christian|sikh|jain|buddhist|jewish|religious/.test(combined)) return "Religious";
  if (/environment|earth|water|forest/.test(combined)) return "Environmental";
  if (/health|aids|cancer|yoga/.test(combined)) return "Health";
  if (/republic|independence|army|gandhi|political/.test(combined)) return "Political";
  if (/women|children|labour|social/.test(combined)) return "Social";
  if (/fun|joke|fool/.test(combined)) return "Fun";
  return "Cultural";
}

function dayOf(dateStr: string): string {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

function slug(name: string, date: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + date;
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

async function main() {
  console.log(`-- Fetching Calendarific data for ${COUNTRY} ${YEAR}...`);

  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${COUNTRY}&year=${YEAR}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const holidays: Holiday[] = data.response.holidays;

  console.log(`-- Found ${holidays.length} holidays\n`);
  console.log("BEGIN TRANSACTION;\n");

  for (const h of holidays) {
    const dateStr = h.date.iso.split("T")[0];
    const id = slug(h.name, dateStr);
    const type = mapType(h.primary_type);
    const scope = mapScope(h.locations, h.states);
    const category = mapCategory(h.type, h.name);
    const day = dayOf(dateStr);
    const regions = Array.isArray(h.states)
      ? `'${esc(JSON.stringify(h.states.map((s) => s.name)))}'`
      : "NULL";
    const isHoliday = h.type.some((t) => /national|public/i.test(t)) ? 1 : 0;

    console.log(
      `INSERT OR REPLACE INTO festivals (id, name, date, day, type, scope, category, description, where_celebrated, why_celebrated, how_celebrated, is_public_holiday, source, country, regions, year)` +
      `\nVALUES ('${esc(id)}', '${esc(h.name)}', '${dateStr}', '${day}', '${type}', '${scope}', '${category}', '${esc(h.description || "")}', '${esc(h.locations)}', '${esc(h.description || "")}', '', ${isHoliday}, 'calendarific', '${COUNTRY}', ${regions}, ${YEAR});\n`
    );
  }

  console.log("COMMIT;");
  console.log(`\n-- Done. ${holidays.length} festivals for ${COUNTRY} ${YEAR}`);
}

main().catch(console.error);
