// ============================================
// Calendarific API Integration + Deduplication
// ============================================

interface CalendarificHoliday {
  name: string;
  description: string;
  country: { id: string; name: string };
  date: { iso: string; datetime: { year: number; month: number; day: number } };
  type: string[];
  primary_type: string;
  canonical_url: string;
  urlid: string;
  locations: string;
  states: string | { id: number; abbrev: string; name: string; exception: null; iso: string }[];
}

interface CalendarificResponse {
  meta: { code: number };
  response: { holidays: CalendarificHoliday[] };
}

interface FestivalRow {
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
  is_public_holiday: number;
  source: string;
  country: string;
  regions: string | null;
  year: number;
}

// ---- Mapping helpers ----

function mapType(types: string[], primaryType: string): string {
  const t = primaryType.toLowerCase();
  if (t.includes("national") || t.includes("public") || t.includes("bank")) return "Festival Day";
  if (t.includes("observance") || t.includes("season") || t.includes("clock")) return "Observance";
  if (/religious|hindu|muslim|christian|sikh|jain|buddhist/.test(t)) return "Festival Day";
  if (/social|united nations|world/.test(t)) return "Social Day";
  return "Observance";
}

function mapScope(locations: string, states: CalendarificHoliday["states"]): string {
  if (locations === "All" || locations === "") return "National";
  if (typeof states === "string" && states === "All") return "National";
  if (Array.isArray(states) && states.length > 15) return "National";
  if (Array.isArray(states) && states.length > 0) return "Regional";
  return "National";
}

function mapCategory(types: string[], primaryType: string, name: string): string {
  const c = (types.join(" ") + " " + primaryType + " " + name).toLowerCase();
  if (/hindu|muslim|christian|sikh|jain|buddhist|jewish|religious|easter|christmas|eid|diwali|holi|pongal|navratri|durga|ganesh|shiva|ram\s?nav|buddha|guru\s?nanak|mahavir/.test(c)) return "Religious";
  if (/environment|earth|water|forest|ocean|ozone|wildlife|wetland|tiger|animal/.test(c)) return "Environmental";
  if (/health|aids|cancer|yoga|malaria|tobacco|hepatitis|diabetes|mental|blood\s?don/.test(c)) return "Health";
  if (/republic|independence|army|navy|gandhi|ambedkar|political|constitution|martyrs|flag\s?day|labour|may\s?day/.test(c)) return "Political";
  if (/women|children|social\s?justice|human\s?rights|disability|autism|mother|father|teacher|friendship/.test(c)) return "Social";
  if (/fun|joke|fool|laugh|emoji|pirate|halloween/.test(c)) return "Fun";
  return "Cultural";
}

function getDayOfWeek(dateStr: string): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---- Deduplication ----
// Normalize name for comparison (lowercase, remove punctuation, trim)
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[''`]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function deduplicateFestivals(festivals: FestivalRow[]): FestivalRow[] {
  const seen = new Map<string, FestivalRow>();

  for (const f of festivals) {
    // Key = normalized name + date (same festival on same date = duplicate)
    const key = normalizeName(f.name) + "|" + f.date;

    if (seen.has(key)) {
      // Keep the one with better data (longer description, or supplementary over calendarific)
      const existing = seen.get(key)!;
      const existingScore = (existing.description?.length || 0) + (existing.how_celebrated?.length || 0) + (existing.source === "supplementary" ? 100 : 0);
      const newScore = (f.description?.length || 0) + (f.how_celebrated?.length || 0) + (f.source === "supplementary" ? 100 : 0);
      if (newScore > existingScore) {
        seen.set(key, f);
      }
    } else {
      seen.set(key, f);
    }
  }

  return Array.from(seen.values());
}

// ---- Main scraper ----

export async function scrapeCalendarific(
  db: D1Database,
  apiKey: string,
  year: number,
  country: string = "IN"
): Promise<{ count: number; errors: string[]; duplicatesRemoved: number }> {
  const url = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${country}&year=${year}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Calendarific API error: ${response.status} ${response.statusText}`);
  }

  const data: CalendarificResponse = await response.json();
  if (data.meta.code !== 200) {
    throw new Error(`Calendarific API returned code ${data.meta.code}`);
  }

  const holidays = data.response.holidays;

  // Convert Calendarific holidays to our format
  const calendarificRows: FestivalRow[] = holidays.map((h) => {
    const dateStr = h.date.iso.split("T")[0];
    const regions = Array.isArray(h.states) ? JSON.stringify(h.states.map((s) => s.name)) : null;
    const whereStr = h.locations === "All" ? "All across India" : (Array.isArray(h.states) ? h.states.map((s) => s.name).join(", ") : h.locations);

    return {
      id: slugify(h.name) + "-" + dateStr,
      name: h.name,
      date: dateStr,
      day: getDayOfWeek(dateStr),
      type: mapType(h.type, h.primary_type),
      scope: mapScope(h.locations, h.states),
      category: mapCategory(h.type, h.primary_type, h.name),
      description: h.description || "",
      where_celebrated: whereStr,
      why_celebrated: h.description || "",
      how_celebrated: "",
      is_public_holiday: h.type.some((t) => /national|public/i.test(t)) ? 1 : 0,
      source: "calendarific",
      country,
      regions,
      year,
    };
  });

  // Get supplementary festivals for this year
  const supplementary = getSupplementaryFestivals(year, country);

  // Merge both sources
  const allFestivals = [...calendarificRows, ...supplementary];

  // Deduplicate — if same festival exists in both, supplementary wins (has richer data)
  const deduped = deduplicateFestivals(allFestivals);
  const duplicatesRemoved = allFestivals.length - deduped.length;

  // Clear old data for this year+country, then insert fresh
  await db.prepare("DELETE FROM festivals WHERE year = ?1 AND country = ?2").bind(year, country).run();

  const errors: string[] = [];
  let count = 0;

  for (const f of deduped) {
    try {
      await db
        .prepare(
          `INSERT INTO festivals (id, name, date, day, type, scope, category, description, where_celebrated, why_celebrated, how_celebrated, is_public_holiday, source, country, regions, year)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`
        )
        .bind(f.id, f.name, f.date, f.day, f.type, f.scope, f.category, f.description, f.where_celebrated, f.why_celebrated, f.how_celebrated, f.is_public_holiday, f.source, f.country, f.regions, f.year)
        .run();
      count++;
    } catch (err) {
      errors.push(`Failed to insert ${f.name}: ${err}`);
    }
  }

  // Log the scrape
  await db
    .prepare(
      `INSERT OR REPLACE INTO scrape_log (id, source, year, country, status, festivals_count, error_message)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
    .bind(
      `merged-${year}-${country}`,
      "calendarific+supplementary",
      year,
      country,
      errors.length > 0 ? "partial" : "success",
      count,
      errors.length > 0 ? errors.join("; ") : null
    )
    .run();

  return { count, errors, duplicatesRemoved };
}

// ============================================
// Supplementary Festivals
// Events Calendarific MISSES — regional, cultural, social, health, environmental, fun
// These are injected alongside Calendarific data with deduplication
// ============================================

function getSupplementaryFestivals(year: number, country: string): FestivalRow[] {
  if (country !== "IN") return [];

  const y = year;
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const day = (d: string) => DAYS[new Date(d + "T00:00:00").getDay()];

  // Approximate lunar calendar dates by year
  const lunar: Record<number, Record<string, string>> = {
    2024: { basant:`${y}-02-14`, shivaratri:`${y}-03-08`, holi:`${y}-03-25`, navratri:`${y}-10-03`, dussehra:`${y}-10-12`, diwali:`${y}-11-01`, chhath:`${y}-11-07`, onam:`${y}-09-15`, ganesh:`${y}-09-07`, teej:`${y}-08-07`, bathukamma:`${y}-10-03`, bonalu:`${y}-07-14`, rath:`${y}-07-07`, hemis:`${y}-06-17`, thrissur:`${y}-04-20`, pushkar:`${y}-11-15` },
    2025: { basant:`${y}-02-02`, shivaratri:`${y}-02-26`, holi:`${y}-03-14`, navratri:`${y}-09-22`, dussehra:`${y}-10-02`, diwali:`${y}-10-20`, chhath:`${y}-10-26`, onam:`${y}-09-05`, ganesh:`${y}-08-27`, teej:`${y}-08-10`, bathukamma:`${y}-09-22`, bonalu:`${y}-07-06`, rath:`${y}-06-27`, hemis:`${y}-07-01`, thrissur:`${y}-05-12`, pushkar:`${y}-11-05` },
    2026: { basant:`${y}-01-23`, shivaratri:`${y}-02-15`, holi:`${y}-03-04`, navratri:`${y}-09-28`, dussehra:`${y}-10-07`, diwali:`${y}-10-29`, chhath:`${y}-11-04`, onam:`${y}-09-04`, ganesh:`${y}-09-07`, teej:`${y}-07-31`, bathukamma:`${y}-09-28`, bonalu:`${y}-07-12`, rath:`${y}-06-29`, hemis:`${y}-07-10`, thrissur:`${y}-04-27`, pushkar:`${y}-11-06` },
    2027: { basant:`${y}-02-11`, shivaratri:`${y}-03-06`, holi:`${y}-03-23`, navratri:`${y}-10-17`, dussehra:`${y}-10-26`, diwali:`${y}-11-18`, chhath:`${y}-11-24`, onam:`${y}-08-24`, ganesh:`${y}-09-26`, teej:`${y}-08-20`, bathukamma:`${y}-10-17`, bonalu:`${y}-08-01`, rath:`${y}-07-18`, hemis:`${y}-06-30`, thrissur:`${y}-05-16`, pushkar:`${y}-11-25` },
    2028: { basant:`${y}-01-31`, shivaratri:`${y}-02-23`, holi:`${y}-03-12`, navratri:`${y}-10-06`, dussehra:`${y}-10-15`, diwali:`${y}-11-07`, chhath:`${y}-11-13`, onam:`${y}-09-12`, ganesh:`${y}-09-15`, teej:`${y}-08-09`, bathukamma:`${y}-10-06`, bonalu:`${y}-07-20`, rath:`${y}-07-07`, hemis:`${y}-07-19`, thrissur:`${y}-05-05`, pushkar:`${y}-11-13` },
    2029: { basant:`${y}-02-18`, shivaratri:`${y}-03-13`, holi:`${y}-03-30`, navratri:`${y}-10-25`, dussehra:`${y}-11-03`, diwali:`${y}-11-26`, chhath:`${y}-12-02`, onam:`${y}-09-01`, ganesh:`${y}-10-04`, teej:`${y}-08-28`, bathukamma:`${y}-10-25`, bonalu:`${y}-07-09`, rath:`${y}-06-26`, hemis:`${y}-07-08`, thrissur:`${y}-04-24`, pushkar:`${y}-12-02` },
    2030: { basant:`${y}-02-08`, shivaratri:`${y}-03-03`, holi:`${y}-03-20`, navratri:`${y}-10-14`, dussehra:`${y}-10-23`, diwali:`${y}-11-15`, chhath:`${y}-11-21`, onam:`${y}-08-22`, ganesh:`${y}-09-24`, teej:`${y}-08-17`, bathukamma:`${y}-10-14`, bonalu:`${y}-07-28`, rath:`${y}-07-16`, hemis:`${y}-06-28`, thrissur:`${y}-05-13`, pushkar:`${y}-11-21` },
  };

  const d = lunar[y] || lunar[2026]; // fallback

  // Mother's Day: 2nd Sunday May
  const may1 = new Date(y, 4, 1);
  const motherDay = `${y}-05-${String((14 - may1.getDay()) % 7 + 8).padStart(2, "0")}`;
  // Father's Day: 3rd Sunday June
  const jun1 = new Date(y, 5, 1);
  const fatherDay = `${y}-06-${String((21 - jun1.getDay()) % 7 + 15).padStart(2, "0")}`;
  // Friendship Day: 1st Sunday Aug
  const aug1 = new Date(y, 7, 1);
  const friendDay = `${y}-08-${String((7 - aug1.getDay()) % 7 + 1).padStart(2, "0")}`;
  // Laughter Day: 1st Sunday May
  const laughDay = `${y}-05-${String((7 - may1.getDay()) % 7 + 1).padStart(2, "0")}`;

  const mk = (id: string, name: string, date: string, type: FestivalRow["type"], scope: FestivalRow["scope"], category: FestivalRow["category"], desc: string, where: string, why: string, how: string, holiday: boolean, regions: string[] | null = null): FestivalRow => ({
    id: `${id}-${date}`, name, date, day: day(date), type, scope, category,
    description: desc, where_celebrated: where, why_celebrated: why, how_celebrated: how,
    is_public_holiday: holiday ? 1 : 0, source: "supplementary", country: "IN",
    regions: regions ? JSON.stringify(regions) : null, year: y,
  });

  return [
    // ===== REGIONAL FESTIVALS Calendarific often misses =====
    mk("lohri", "Lohri", `${y}-01-13`, "Festival Day", "Regional", "Cultural",
      "Punjabi winter folk festival celebrating the harvest season and bonfire night.",
      "Punjab, Haryana, Himachal Pradesh, Delhi", "Marks the end of winter and the harvest of sugarcane and rabi crops.",
      "Lighting bonfires, singing folk songs, dancing bhangra, and eating rewri, gajak, and popcorn.", false, ["Punjab","Haryana","Himachal Pradesh"]),

    mk("pongal-1", "Pongal (Day 1 - Bhogi)", `${y}-01-14`, "Festival Day", "Regional", "Cultural",
      "First day of the four-day Tamil harvest festival, dedicated to Lord Indra.",
      "Tamil Nadu", "Celebrates the end of the old and the beginning of the new by discarding old belongings.",
      "Burning old clothes and items in a bonfire, cleaning homes, and kolam designs.", false, ["Tamil Nadu"]),

    mk("pongal-2", "Pongal (Day 2 - Thai Pongal)", `${y}-01-15`, "Festival Day", "Regional", "Cultural",
      "Main day of Pongal, thanksgiving to the Sun God for agricultural abundance.",
      "Tamil Nadu, Sri Lanka", "Thanks the Sun God for a bountiful harvest.",
      "Cooking Pongal rice in new clay pots until it overflows, symbolizing abundance.", false, ["Tamil Nadu"]),

    mk("pongal-3", "Pongal (Day 3 - Mattu Pongal)", `${y}-01-16`, "Festival Day", "Regional", "Cultural",
      "Third day dedicated to cattle who help in farming.",
      "Tamil Nadu", "Honors cattle for their role in agriculture.",
      "Decorating bulls with garlands, painting horns, and Jallikattu (bull-taming sport).", false, ["Tamil Nadu"]),

    mk("pongal-4", "Pongal (Day 4 - Kaanum Pongal)", `${y}-01-17`, "Festival Day", "Regional", "Cultural",
      "Fourth and final day of Pongal, a day for family gatherings and outings.",
      "Tamil Nadu", "A day of recreation and socializing after the harvest.",
      "Family picnics, visiting relatives, bird watching, and young women praying for brothers.", false, ["Tamil Nadu"]),

    mk("magh-bihu", "Magh Bihu (Bhogali Bihu)", `${y}-01-15`, "Festival Day", "Regional", "Cultural",
      "Assamese harvest festival marking the end of the harvesting season.",
      "Assam", "Celebrates the end of the harvest season in Assam.",
      "Building Meji bonfires, community feasting, traditional Assamese games.", false, ["Assam"]),

    mk("bohag-bihu", "Bohag Bihu (Rongali Bihu)", `${y}-04-14`, "Festival Day", "Regional", "Cultural",
      "Assamese New Year marking the onset of the sowing season.",
      "Assam", "Celebrates the Assamese New Year and the spring harvest season.",
      "Bihu dance and music, Gamosa exchange, community feasts.", true, ["Assam"]),

    mk("ugadi", "Ugadi", `${y}-03-19`, "Festival Day", "Regional", "Cultural",
      "Telugu and Kannada New Year, beginning of a new Hindu lunar calendar year.",
      "Andhra Pradesh, Telangana, Karnataka", "Marks the beginning of a new year in the Deccan region.",
      "Eating Ugadi Pachadi (mix of six tastes), mango-leaf doorway decorations, temple visits.", false, ["Andhra Pradesh","Telangana","Karnataka"]),

    mk("gudi-padwa", "Gudi Padwa", `${y}-03-19`, "Festival Day", "Regional", "Cultural",
      "Marathi New Year celebrating new beginnings and the spring harvest.",
      "Maharashtra, Goa", "Marks the beginning of the Marathi calendar year.",
      "Hoisting Gudi (decorated pole), eating Shrikhand-Puri, and Rangoli.", false, ["Maharashtra","Goa"]),

    mk("vishu", "Vishu", `${y}-04-14`, "Festival Day", "Regional", "Cultural",
      "Malayalam New Year celebrated in Kerala with the auspicious Vishukkani.",
      "Kerala", "Marks the beginning of the Malayalam calendar year.",
      "Vishukkani (auspicious sight), Vishukkaineettam (gifts), new clothes, and Sadya feast.", false, ["Kerala"]),

    mk("onam", "Onam", d.onam, "Festival Day", "Regional", "Cultural",
      "Kerala's biggest harvest festival celebrating the return of mythical King Mahabali.",
      "Kerala", "Celebrates King Mahabali's annual return and the harvest season.",
      "Onam Sadya (grand feast), Vallam Kali (boat race), Pookkalam (flower rangoli), and Kathakali.", true, ["Kerala"]),

    mk("teej", "Teej (Hariyali Teej)", d.teej, "Festival Day", "Regional", "Cultural",
      "Festival celebrating the monsoon and the union of Shiva and Parvati.",
      "Rajasthan, Haryana, UP, Bihar", "Celebrates the reunion of Lord Shiva and Goddess Parvati.",
      "Swinging on decorated swings, applying henna, singing Teej songs, and fasting.", false, ["Rajasthan","Haryana","Uttar Pradesh"]),

    mk("bathukamma", "Bathukamma", d.bathukamma, "Festival Day", "Regional", "Cultural",
      "Telangana's floral festival dedicated to Goddess Gauri.",
      "Telangana", "Celebrates life and womanhood with colorful flower arrangements.",
      "Making flower stacks, singing Bathukamma songs, dancing in circles, and immersing flowers.", false, ["Telangana"]),

    mk("bonalu", "Bonalu", d.bonalu, "Festival Day", "Regional", "Cultural",
      "Telangana festival honoring Goddess Mahakali with offerings and processions.",
      "Hyderabad, Secunderabad, Telangana", "Devotional offering to Goddess Mahakali for protection from epidemics.",
      "Women carrying pots of rice cooked with milk to temples, Rangam prophecies, and processions.", false, ["Telangana"]),

    mk("thrissur-pooram", "Thrissur Pooram", d.thrissur, "Festival Day", "Regional", "Cultural",
      "Kerala's grandest temple festival featuring decorated elephants and fireworks.",
      "Thrissur, Kerala", "One of the most spectacular Hindu temple festivals in Kerala.",
      "Processions of caparisoned elephants, Kudamattam (parasol exchange), Panchavadyam, and fireworks.", false, ["Kerala"]),

    mk("rath-yatra", "Jagannath Rath Yatra", d.rath, "Festival Day", "Regional", "Religious",
      "Annual chariot festival of Lord Jagannath in Puri.",
      "Puri (Odisha), and replicated in many cities", "Celebrates Lord Jagannath's annual journey to Gundicha Temple.",
      "Pulling three massive chariots through streets, devotional singing, community feasting.", true, ["Odisha"]),

    mk("hemis", "Hemis Festival", d.hemis, "Festival Day", "Regional", "Cultural",
      "Ladakh's biggest monastic festival celebrating Guru Padmasambhava's birth anniversary.",
      "Hemis Monastery, Ladakh", "Celebrates Guru Padmasambhava who brought Buddhism to the Himalayas.",
      "Cham dance (masked dances), thangka display, traditional music, and Buddhist prayers.", false, ["Ladakh"]),

    mk("hornbill", "Hornbill Festival", `${y}-12-01`, "Festival Day", "Regional", "Cultural",
      "Nagaland's Festival of Festivals showcasing tribal culture, dance, music, and crafts.",
      "Kisama Heritage Village, Kohima, Nagaland", "Promotes and preserves Naga tribal culture and heritage.",
      "Traditional Naga dances, indigenous games, tribal food stalls, rock concerts, handicraft exhibitions.", false, ["Nagaland"]),

    mk("pushkar-fair", "Pushkar Camel Fair", d.pushkar, "Festival Day", "Regional", "Cultural",
      "World-famous annual five-day camel and livestock fair in Pushkar.",
      "Pushkar, Rajasthan", "One of the world's largest camel fairs combining trade, culture, and pilgrimage.",
      "Camel trading, races, cultural performances, hot air ballooning, and holy dips in Pushkar Lake.", false, ["Rajasthan"]),

    mk("rann-utsav", "Rann Utsav", `${y}-11-01`, "Festival Day", "Regional", "Cultural",
      "Three-month cultural extravaganza at the white salt desert of Kutch.",
      "Rann of Kutch, Gujarat", "Showcases the culture, crafts, and natural beauty of the Kutch region.",
      "Full moon desert walks, folk music and dance, handicraft shopping, luxury tent stays.", false, ["Gujarat"]),

    mk("chhath", "Chhath Puja", d.chhath, "Festival Day", "Regional", "Religious",
      "Ancient Hindu festival dedicated to the Sun God and Chhathi Maiya.",
      "Bihar, Jharkhand, Eastern UP, Nepal", "Devotion to the Sun God for sustaining life on Earth.",
      "Fasting for 36 hours, standing in water offering arghya to rising and setting sun.", true, ["Bihar","Jharkhand","Uttar Pradesh"]),

    // ===== SOCIAL DAYS =====
    mk("valentine", "Valentine's Day", `${y}-02-14`, "Social Day", "Global", "Social",
      "Day of love and romance celebrated worldwide.", "Worldwide",
      "Honors Saint Valentine and celebrates romantic love.",
      "Exchanging cards, flowers, chocolates, and gifts with loved ones.", false),

    mk("social-justice", "World Social Justice Day", `${y}-02-20`, "Observance", "Global", "Social",
      "UN day promoting social justice including efforts to address poverty and inequality.", "Worldwide",
      "Promotes social justice, including tackling poverty, exclusion, and unemployment.",
      "Awareness campaigns, seminars, and advocacy for fair policies.", false),

    mk("womens-day", "International Women's Day", `${y}-03-08`, "Social Day", "Global", "Social",
      "Global day celebrating women's achievements and advocating for gender equality.", "Worldwide",
      "Celebrates women's social, economic, cultural, and political achievements.",
      "Events honoring women, marches, and cultural celebrations.", false),

    mk("autism-day", "World Autism Awareness Day", `${y}-04-02`, "Observance", "Global", "Social",
      "UN day to raise awareness about autism spectrum disorder.", "Worldwide",
      "Promotes awareness and acceptance of people with autism.",
      "Light It Up Blue campaigns, awareness walks, and educational events.", false),

    mk("mothers-day", "Mother's Day", motherDay, "Social Day", "Global", "Social",
      "Day honoring mothers and motherhood worldwide.", "Worldwide",
      "Celebrates the love, sacrifices, and contributions of mothers.",
      "Gift-giving, cards, special meals, and spending quality time with mothers.", false),

    mk("fathers-day", "Father's Day", fatherDay, "Social Day", "Global", "Social",
      "Day honoring fathers and fatherhood worldwide.", "Worldwide",
      "Celebrates fathers' contributions to their families and society.",
      "Gift-giving, cards, and activities with fathers.", false),

    mk("friendship-day", "Friendship Day", friendDay, "Social Day", "Global", "Social",
      "Day celebrating friendship and the bonds between friends.", "Worldwide",
      "Promotes friendship as a force for peace and togetherness.",
      "Exchanging friendship bands, gifts, and spending time with friends.", false),

    mk("teachers-day", "Teachers' Day", `${y}-09-05`, "Social Day", "National", "Social",
      "Birthday of Dr. Sarvepalli Radhakrishnan, celebrated as Teachers' Day.", "All across India",
      "Honors Dr. Radhakrishnan and all teachers for their contribution to education.",
      "Students organize cultural programs, teachers receive awards, and appreciation events.", false),

    mk("disability-day", "International Day of Persons with Disabilities", `${y}-12-03`, "Observance", "Global", "Social",
      "UN day promoting the rights and well-being of persons with disabilities.", "Worldwide",
      "Promotes awareness, understanding, and acceptance of disability issues.",
      "Awareness campaigns, inclusive events, and policy advocacy.", false),

    mk("human-rights", "Human Rights Day", `${y}-12-10`, "Observance", "Global", "Social",
      "Commemorates the adoption of the Universal Declaration of Human Rights in 1948.", "Worldwide",
      "Celebrates the fundamental rights and freedoms of all human beings.",
      "Conferences, cultural events, and campaigns for human rights awareness.", false),

    mk("un-day", "United Nations Day", `${y}-10-24`, "Observance", "Global", "Social",
      "Anniversary of the UN Charter coming into force in 1945.", "Worldwide",
      "Marks the founding of the United Nations.",
      "Concerts, conferences, discussions, and exhibitions about UN work.", false),

    // ===== ENVIRONMENTAL =====
    mk("wetlands", "World Wetlands Day", `${y}-02-02`, "Observance", "Global", "Environmental",
      "Raises awareness about the importance of wetlands.", "Worldwide",
      "Marks the adoption of the Ramsar Convention on Wetlands in 1971.",
      "Wetland clean-ups, bird watching, educational activities, and nature walks.", false),

    mk("wildlife", "World Wildlife Day", `${y}-03-03`, "Observance", "Global", "Environmental",
      "UN day celebrating the world's wild animals and plants.", "Worldwide",
      "Raises awareness about the world's wild fauna and flora.",
      "Wildlife documentaries, photo exhibitions, nature walks, and conservation campaigns.", false),

    mk("water-day", "World Water Day", `${y}-03-22`, "Observance", "Global", "Environmental",
      "UN day focusing on the importance of freshwater.", "Worldwide",
      "Highlights the importance of freshwater and sustainable water resources.",
      "Water conservation campaigns, clean water initiatives, and educational events.", false),

    mk("earth-day", "Earth Day", `${y}-04-22`, "Social Day", "Global", "Environmental",
      "Annual event supporting environmental protection worldwide.", "Worldwide",
      "Promotes awareness and action for environmental protection since 1970.",
      "Tree planting, clean-up drives, environmental seminars, and eco-friendly pledges.", false),

    mk("environment-day", "World Environment Day", `${y}-06-05`, "Social Day", "Global", "Environmental",
      "UN's principal vehicle for encouraging environmental action.", "Worldwide",
      "The biggest annual event for positive environmental action since 1973.",
      "Tree planting, clean-up campaigns, sustainable living initiatives.", false),

    mk("ocean-day", "World Ocean Day", `${y}-06-08`, "Observance", "Global", "Environmental",
      "UN day celebrating the ocean and promoting its conservation.", "Worldwide",
      "Raises awareness about the ocean's role in daily lives and its conservation.",
      "Beach clean-ups, ocean conservation pledges, and marine exhibits.", false),

    mk("tiger-day", "International Tiger Day", `${y}-07-29`, "Observance", "Global", "Environmental",
      "Global day to raise awareness about tiger conservation.", "Worldwide",
      "Promotes tiger conservation and highlights threats to wild tigers.",
      "Wildlife campaigns, documentary screenings, fundraisers for tiger reserves.", false),

    mk("ozone-day", "World Ozone Day", `${y}-09-16`, "Observance", "Global", "Environmental",
      "Commemorates the signing of the Montreal Protocol.", "Worldwide",
      "Celebrates international efforts to protect the ozone layer.",
      "Educational programs on ozone depletion, environmental awareness campaigns.", false),

    mk("animal-day", "World Animal Day", `${y}-10-04`, "Observance", "Global", "Environmental",
      "International day of action for animal rights and welfare.", "Worldwide",
      "Promotes action for animal rights and welfare worldwide.",
      "Animal adoption drives, fundraisers, awareness campaigns, pet care events.", false),

    // ===== HEALTH =====
    mk("cancer-day", "World Cancer Day", `${y}-02-04`, "Observance", "Global", "Health",
      "Global day raising awareness about cancer prevention and treatment.", "Worldwide",
      "Promotes awareness about cancer prevention and treatment.",
      "Health camps, awareness walks, fundraisers, and educational seminars.", false),

    mk("health-day", "World Health Day", `${y}-04-07`, "Observance", "Global", "Health",
      "WHO day drawing attention to a health topic of global concern.", "Worldwide",
      "Highlights a health priority each year to promote universal health coverage.",
      "Health camps, vaccination drives, awareness campaigns, free medical check-ups.", false),

    mk("no-tobacco", "World No Tobacco Day", `${y}-05-31`, "Observance", "Global", "Health",
      "WHO day encouraging abstinence from tobacco.", "Worldwide",
      "Highlights health risks associated with tobacco use.",
      "Anti-smoking campaigns, health pledges, and public awareness drives.", false),

    mk("blood-donor", "World Blood Donor Day", `${y}-06-14`, "Observance", "Global", "Health",
      "WHO day thanking blood donors and raising awareness.", "Worldwide",
      "Recognizes voluntary blood donors and encourages more donations.",
      "Blood donation camps, awareness campaigns, and appreciation events.", false),

    mk("yoga-day", "International Yoga Day", `${y}-06-21`, "Social Day", "Global", "Health",
      "UN day celebrating yoga, initiated by India's PM Modi.", "Worldwide",
      "Promotes the physical and spiritual benefits of yoga globally.",
      "Mass yoga sessions, workshops, yoga competitions, and health awareness programs.", false),

    mk("hepatitis-day", "World Hepatitis Day", `${y}-07-28`, "Observance", "Global", "Health",
      "WHO day raising awareness about viral hepatitis.", "Worldwide",
      "Raises awareness about hepatitis B and C.",
      "Free hepatitis testing, vaccination drives, and awareness campaigns.", false),

    mk("mental-health", "World Mental Health Day", `${y}-10-10`, "Observance", "Global", "Health",
      "WHO day raising awareness about mental health issues.", "Worldwide",
      "Promotes mental health education, awareness, and advocacy.",
      "Counseling sessions, awareness walks, workshops, social media campaigns.", false),

    mk("diabetes-day", "World Diabetes Day", `${y}-11-14`, "Observance", "Global", "Health",
      "Global day raising awareness about diabetes.", "Worldwide",
      "Raises awareness about diabetes prevention and management.",
      "Free diabetes screening, health walks, educational seminars.", false),

    mk("aids-day", "World AIDS Day", `${y}-12-01`, "Observance", "Global", "Health",
      "International day dedicated to raising awareness about HIV/AIDS.", "Worldwide",
      "Promotes awareness about AIDS and mourns those lost to the disease.",
      "Red ribbon campaigns, free HIV testing, candlelight vigils, awareness marches.", false),

    // ===== POLITICAL =====
    mk("army-day", "Indian Army Day", `${y}-01-15`, "Social Day", "National", "Political",
      "Honors the Indian Army and commemorates Field Marshal KM Cariappa taking command.", "All across India",
      "Marks the day India got its first Indian Commander-in-Chief of the Army.",
      "Military parades in New Delhi, bravery awards, tributes to soldiers.", false),

    mk("martyrs-day", "Martyrs' Day (Shaheed Diwas)", `${y}-01-30`, "Observance", "National", "Political",
      "Commemorates the assassination of Mahatma Gandhi on 30 January 1948.", "All across India",
      "Honors Mahatma Gandhi and all martyrs who sacrificed for India's freedom.",
      "Two-minute silence at 11 AM, wreath-laying at Raj Ghat, tributes to Gandhi.", false),

    mk("navy-day", "Navy Day", `${y}-12-04`, "Observance", "National", "Political",
      "Celebrates the Indian Navy, commemorating Operation Trident in 1971.", "All across India",
      "Honors the Indian Navy's decisive attack on Karachi harbor in 1971.",
      "Naval fleet reviews, exhibitions, and demonstrations of naval strength.", false),

    mk("armed-forces", "Armed Forces Flag Day", `${y}-12-07`, "Observance", "National", "Political",
      "Day to honor armed forces personnel and collect funds for their welfare.", "All across India",
      "Dedicated to welfare of armed forces personnel.",
      "Sale of flags and stickers, fund collection drives, tribute events.", false),

    mk("constitution", "Constitution Day", `${y}-11-26`, "Observance", "National", "Political",
      "Commemorates the adoption of the Indian Constitution on 26 November 1949.", "All across India",
      "Marks the day the Constituent Assembly adopted the Indian Constitution.",
      "Reading the Preamble, seminars on constitutional values.", false),

    mk("sardar-patel", "Sardar Patel Jayanti (National Unity Day)", `${y}-10-31`, "Observance", "National", "Political",
      "Birthday of Sardar Vallabhbhai Patel, observed as National Unity Day.", "All across India",
      "Honors the Iron Man of India who unified 562 princely states.",
      "Run for Unity events, pledge for national unity, tributes at Statue of Unity.", false),

    // ===== FUN =====
    mk("april-fools", "April Fools' Day", `${y}-04-01`, "Social Day", "Global", "Fun",
      "Day of pranks, jokes, and hoaxes celebrated worldwide.", "Worldwide",
      "A tradition of playing practical jokes on April 1st.",
      "Playing pranks on friends, fake news stories, and humorous activities.", false),

    mk("laughter-day", "World Laughter Day", laughDay, "Social Day", "Global", "Fun",
      "Day promoting world peace through laughter, created by Dr. Madan Kataria.", "Worldwide",
      "Promotes world peace through laughter; founded by the laughter yoga movement.",
      "Laughter yoga sessions, comedy shows, community laughter gatherings.", false),

    mk("joke-day", "International Joke Day", `${y}-07-01`, "Social Day", "Global", "Fun",
      "Day dedicated to telling jokes and spreading laughter.", "Worldwide",
      "Celebrates the art of humor and joke-telling.",
      "Sharing jokes, comedy events, humorous social media posts.", false),

    mk("emoji-day", "World Emoji Day", `${y}-07-17`, "Social Day", "Global", "Fun",
      "Day celebrating emojis and their role in digital communication.", "Worldwide",
      "Celebrates the impact of emojis on modern communication.",
      "Emoji-themed social media posts, new emoji announcements.", false),

    mk("pirate-day", "Talk Like a Pirate Day", `${y}-09-19`, "Social Day", "Global", "Fun",
      "Humorous holiday where people talk like pirates.", "Worldwide",
      "A parody holiday created for fun.",
      "Speaking in pirate lingo, dressing as pirates, themed parties.", false),

    mk("halloween", "Halloween", `${y}-10-31`, "Social Day", "Global", "Fun",
      "Spooky holiday with costumes, candy, and celebrations of the supernatural.", "Worldwide",
      "Originally a Celtic festival, now a celebration of all things spooky and fun.",
      "Costume parties, trick-or-treating, pumpkin carving, haunted house visits.", false),

    // ===== ADDITIONAL REGIONAL FESTIVALS =====
    mk("thaipusam", "Thaipusam", `${y}-01-25`, "Festival Day", "Regional", "Religious",
      "Hindu Tamil festival dedicated to Lord Murugan, celebrated with devotion and piercing rituals.",
      "Tamil Nadu, Kerala", "Commemorates Goddess Parvati giving Lord Murugan a vel (spear) to vanquish evil.",
      "Kavadi carrying, body piercing with vel, milk pot offerings, temple processions.", false, ["Tamil Nadu","Kerala"]),

    mk("guru-ravidas", "Guru Ravidas Jayanti", `${y}-02-24`, "Observance", "National", "Religious",
      "Birthday of Guru Ravidas, a revered saint-poet of the Bhakti movement.",
      "Punjab, UP, Rajasthan, Maharashtra", "Honors Guru Ravidas who preached equality and devotion.",
      "Prayer gatherings, processions, visiting Ravidas temples, and langars.", false, ["Punjab","Uttar Pradesh"]),

    mk("shivaji-jayanti", "Chhatrapati Shivaji Maharaj Jayanti", `${y}-02-19`, "Observance", "Regional", "Political",
      "Birthday of Chhatrapati Shivaji Maharaj, the founder of the Maratha Empire.",
      "Maharashtra", "Celebrates the legacy of the great Maratha warrior king.",
      "Processions, forts illumination, cultural programs, and garlanding statues.", false, ["Maharashtra"]),

    mk("maha-navami", "Maha Navami", `${y}-10-06`, "Festival Day", "National", "Religious",
      "Ninth day of Navratri, dedicated to the worship of Goddess Durga.",
      "All across India, especially West Bengal", "Marks the final day of worship before Vijaya Dashami.",
      "Maha Puja, Sandhi Puja, preparation for Dashami immersion.", false),

    mk("saraswati-puja", "Saraswati Puja", d.basant, "Festival Day", "Regional", "Religious",
      "Special worship of Goddess Saraswati in Eastern India on Basant Panchami.",
      "West Bengal, Bihar, Odisha, Assam", "Celebrates the goddess of knowledge, music, and art.",
      "Placing books at the feet of Saraswati idol, wearing white/yellow, school ceremonies.", false, ["West Bengal","Bihar","Odisha"]),

    mk("kali-puja", "Kali Puja", `${y}-10-29`, "Festival Day", "Regional", "Religious",
      "Hindu festival worshiping Goddess Kali, coinciding with Diwali in Bengal.",
      "West Bengal, Odisha, Assam, Bihar", "Celebrates Goddess Kali, the destroyer of evil.",
      "All-night worship, decorating Kali pandals, fireworks, and tantric rituals.", false, ["West Bengal","Odisha","Assam"]),

    mk("jagaddhatri-puja", "Jagaddhatri Puja", `${y}-11-06`, "Festival Day", "Regional", "Religious",
      "Bengali Hindu festival worshiping Goddess Jagaddhatri, a form of Durga.",
      "West Bengal, especially Chandannagar", "Celebrates the goddess who sustains the world.",
      "Elaborate pandals, processions, and cultural programs similar to Durga Puja.", false, ["West Bengal"]),

    mk("cheti-chand", "Cheti Chand (Sindhi New Year)", `${y}-03-19`, "Festival Day", "Regional", "Cultural",
      "Sindhi New Year celebrating the birth of Jhulelal, the patron saint of Sindhis.",
      "Sindhi communities across India", "Marks the Sindhi New Year and honors water deity Jhulelal.",
      "Taking out Jhulelal processions, offering prayers near water bodies, and community feasts.", false, ["Gujarat","Maharashtra","Rajasthan"]),

    mk("naag-panchami", "Nag Panchami", `${y}-07-26`, "Festival Day", "National", "Religious",
      "Hindu festival of worship of snakes (Nagas), observed with prayers and milk offerings.",
      "All across India, especially Maharashtra, Karnataka", "Honors snakes who play a role in Hindu mythology.",
      "Offering milk and prayers to snake idols, visiting snake temples, and fasting.", false),

    mk("guru-purnima", "Guru Purnima", `${y}-07-21`, "Observance", "National", "Religious",
      "Hindu and Buddhist festival dedicated to spiritual and academic teachers.",
      "All across India and Nepal", "Honors sage Vyasa and the guru-shishya tradition.",
      "Paying respects to gurus, offering prayers, and performing puja.", false),

    mk("karaka-chaturthi", "Karva Chauth", `${y}-10-23`, "Observance", "Regional", "Cultural",
      "Hindu fasting day observed by married women for the longevity of their husbands.",
      "North India — Punjab, Haryana, UP, Rajasthan", "Married women fast sunrise to moonrise for husband's long life.",
      "Fasting without water, bridal attire, moon sighting ritual, breaking fast with husband.", false, ["Punjab","Haryana","Uttar Pradesh","Rajasthan"]),

    mk("ahoi-ashtami", "Ahoi Ashtami", `${y}-10-24`, "Observance", "Regional", "Religious",
      "Hindu fasting festival observed by mothers for the well-being of their sons.",
      "North India", "Mothers fast for the health and long life of their sons.",
      "Drawing Ahoi Mata on wall, fasting, and prayers at twilight.", false, ["Uttar Pradesh","Rajasthan","Punjab"]),

    mk("tulsi-vivah", "Tulsi Vivah", `${y}-11-12`, "Observance", "National", "Religious",
      "Ceremonial marriage of the Tulsi plant to Lord Vishnu, marking the start of wedding season.",
      "All across India", "Marks the end of Chaturmas and beginning of the Hindu wedding season.",
      "Decorating tulsi plant as bride, performing marriage rituals.", false),

    mk("kartik-purnima", "Kartik Purnima (Dev Diwali)", `${y}-11-15`, "Festival Day", "National", "Religious",
      "Full moon day of Kartik month, celebrated as Dev Diwali in Varanasi.",
      "Varanasi, all across India", "Believed to be the day gods descend to Earth to celebrate Diwali.",
      "Lighting thousands of diyas on Varanasi ghats, taking holy dips, and puja.", false),

    mk("vat-savitri", "Vat Savitri Vrat", `${y}-06-06`, "Observance", "National", "Religious",
      "Hindu fasting day when married women pray for their husbands by worshiping the banyan tree.",
      "Maharashtra, Gujarat, North India", "Commemorates Savitri who brought back her husband from the god of death.",
      "Tying threads around banyan tree, fasting, and praying for husband's longevity.", false),

    mk("cherry-blossom", "India International Cherry Blossom Festival", `${y}-11-14`, "Festival Day", "Regional", "Cultural",
      "Festival celebrating the autumn cherry blossoms unique to Shillong, Meghalaya.",
      "Shillong, Meghalaya", "Celebrates the rare autumn cherry blossoms of Meghalaya.",
      "Flower walks, cultural shows, live music, beauty pageants, and photography.", false, ["Meghalaya"]),

    mk("wangala", "Wangala Festival", `${y}-11-10`, "Festival Day", "Regional", "Cultural",
      "Garo tribal harvest festival of Meghalaya, known as the 100 Drums Festival.",
      "Meghalaya", "Garo tribe's post-harvest thanksgiving celebration.",
      "100 drums performance, traditional Garo dances, folk songs, and feasting.", false, ["Meghalaya"]),

    mk("chapchar-kut", "Chapchar Kut", `${y}-03-02`, "Festival Day", "Regional", "Cultural",
      "Mizo spring festival, the most popular festival of Mizoram.",
      "Mizoram", "Celebrates the completion of jungle clearing (jhum cultivation).",
      "Traditional Cheraw (bamboo) dance, folk songs, feasting, and community celebrations.", false, ["Mizoram"]),

    mk("ambubachi", "Ambubachi Mela", `${y}-06-22`, "Festival Day", "Regional", "Religious",
      "Annual fertility festival at Kamakhya Temple in Guwahati.",
      "Guwahati, Assam", "Celebrates the annual menstruation of Goddess Kamakhya.",
      "Pilgrimage to Kamakhya Temple, tantric rituals, and spiritual gatherings.", false, ["Assam"]),

    mk("losar", "Losar (Tibetan New Year)", `${y}-02-17`, "Festival Day", "Regional", "Cultural",
      "Tibetan New Year celebrated by Buddhist communities in India.",
      "Ladakh, Sikkim, Himachal Pradesh, Arunachal Pradesh", "Marks the beginning of the Tibetan lunar calendar year.",
      "Monastery visits, cham dances, feasting on guthuk soup, and butter lamp offerings.", false, ["Ladakh","Sikkim","Himachal Pradesh"]),

    mk("saga-dawa", "Saga Dawa", `${y}-06-11`, "Observance", "Regional", "Religious",
      "Most sacred Buddhist month celebrating Buddha's birth, enlightenment, and parinirvana.",
      "Sikkim, Ladakh, Dharamsala", "Commemorates the three most important events in Buddha's life.",
      "Circumambulation of monasteries, butter lamp lighting, and acts of charity.", false, ["Sikkim","Ladakh"]),

    mk("ziro-music", "Ziro Music Festival", `${y}-09-25`, "Festival Day", "Regional", "Cultural",
      "Outdoor music festival in the beautiful Ziro Valley of Arunachal Pradesh.",
      "Ziro Valley, Arunachal Pradesh", "Celebrates indie music in the scenic Apatani tribal homeland.",
      "Live indie music performances, camping, bonfire nights, and local cuisine.", false, ["Arunachal Pradesh"]),

    mk("madras-day", "Madras Day", `${y}-08-22`, "Observance", "Regional", "Cultural",
      "Celebrates the founding of the city of Madras (Chennai) on 22 August 1639.",
      "Chennai, Tamil Nadu", "Commemorates Chennai's heritage and cultural legacy.",
      "Heritage walks, art exhibitions, lectures, and cultural events across Chennai.", false, ["Tamil Nadu"]),

    mk("kerala-piravi", "Kerala Piravi (Kerala Day)", `${y}-11-01`, "Observance", "Regional", "Political",
      "Celebrates the formation of the state of Kerala on 1 November 1956.",
      "Kerala", "Marks the day Kerala was formed from the Malayalam-speaking regions.",
      "Cultural programs, patriotic events, and Kerala heritage celebrations.", false, ["Kerala"]),

    mk("karnataka-rajyotsava", "Karnataka Rajyotsava", `${y}-11-01`, "Observance", "Regional", "Political",
      "Karnataka Formation Day celebrating the state's creation on 1 November 1956.",
      "Karnataka", "Marks the unification of Kannada-speaking regions into Karnataka.",
      "Flag hoisting, cultural programs, Rajyotsava Awards, and Kannada pride events.", false, ["Karnataka"]),

    mk("ap-formation", "Andhra Pradesh Formation Day", `${y}-11-01`, "Observance", "Regional", "Political",
      "Celebrates the formation of Andhra Pradesh as a separate state.",
      "Andhra Pradesh", "Marks the formation of the Telugu-speaking state.",
      "Official ceremonies, cultural programs, and state pride celebrations.", false, ["Andhra Pradesh"]),

    mk("punjab-day", "Punjab Day", `${y}-11-01`, "Observance", "Regional", "Political",
      "Celebrates the formation of modern Punjab state on 1 November 1966.",
      "Punjab", "Marks the creation of a separate Punjabi-speaking state.",
      "Cultural events, bhangra performances, and Punjabi heritage celebrations.", false, ["Punjab"]),

    mk("statehood-mp", "Madhya Pradesh Foundation Day", `${y}-11-01`, "Observance", "Regional", "Political",
      "Celebrates the establishment of Madhya Pradesh on 1 November 1956.",
      "Madhya Pradesh", "Marks the creation of the Heart of India state.",
      "Official ceremonies, tribal cultural programs, and state heritage events.", false, ["Madhya Pradesh"]),

    mk("goa-liberation", "Goa Liberation Day", `${y}-12-19`, "Observance", "Regional", "Political",
      "Celebrates the liberation of Goa from Portuguese rule on 19 December 1961.",
      "Goa", "Marks the day Indian armed forces freed Goa from 450 years of Portuguese colonial rule.",
      "Military parades, flag hoisting, cultural events, and patriotic celebrations.", false, ["Goa"]),

    mk("statehood-meghalaya", "Meghalaya Day", `${y}-01-21`, "Observance", "Regional", "Political",
      "Celebrates the formation of Meghalaya as a full state on 21 January 1972.",
      "Meghalaya", "Marks Meghalaya becoming a separate state from Assam.",
      "Cultural events, traditional dance performances, and official ceremonies.", false, ["Meghalaya"]),

    mk("statehood-manipur", "Manipur Statehood Day", `${y}-01-21`, "Observance", "Regional", "Political",
      "Celebrates the full statehood of Manipur on 21 January 1972.",
      "Manipur", "Marks Manipur becoming a full-fledged state of India.",
      "Cultural programs, Manipuri dance, official ceremonies.", false, ["Manipur"]),

    mk("statehood-tripura", "Tripura Statehood Day", `${y}-01-21`, "Observance", "Regional", "Political",
      "Celebrates the formation of Tripura as a full state on 21 January 1972.",
      "Tripura", "Marks Tripura becoming a full-fledged state.",
      "Official ceremonies and cultural celebrations.", false, ["Tripura"]),

    // ===== MORE SOCIAL / AWARENESS DAYS =====
    mk("science-day", "National Science Day", `${y}-02-28`, "Observance", "National", "Social",
      "Commemorates the discovery of the Raman Effect by CV Raman on 28 February 1928.",
      "All across India", "Honors India's scientific achievements and promotes scientific temper.",
      "Science exhibitions, lectures, quizzes, and awards in schools and institutions.", false),

    mk("safety-day", "National Safety Day", `${y}-03-04`, "Observance", "National", "Social",
      "Promotes safety awareness in workplaces across India.",
      "All across India", "Raises awareness about safety measures in industries and daily life.",
      "Safety drills, workshops, and awareness campaigns in workplaces.", false),

    mk("consumer-rights", "World Consumer Rights Day", `${y}-03-15`, "Observance", "Global", "Social",
      "International day promoting consumer rights and awareness.",
      "Worldwide", "Raises awareness about consumer rights and protection.",
      "Consumer awareness campaigns, legal aid workshops, and media outreach.", false),

    mk("happiness-day", "International Day of Happiness", `${y}-03-20`, "Social Day", "Global", "Social",
      "UN day recognizing happiness as a fundamental human goal.",
      "Worldwide", "Promotes happiness as a universal aspiration.",
      "Social media campaigns, community events, and acts of kindness.", false),

    mk("down-syndrome", "World Down Syndrome Day", `${y}-03-21`, "Observance", "Global", "Health",
      "UN day raising awareness about Down syndrome.",
      "Worldwide", "Promotes the rights and inclusion of persons with Down syndrome.",
      "Wearing colorful mismatched socks, awareness walks, and educational events.", false),

    mk("forestry-day", "International Day of Forests", `${y}-03-21`, "Observance", "Global", "Environmental",
      "UN day celebrating all types of forests and trees.",
      "Worldwide", "Raises awareness about the importance of forests and trees.",
      "Tree planting drives, forest walks, and environmental education.", false),

    mk("poetry-day", "World Poetry Day", `${y}-03-21`, "Observance", "Global", "Cultural",
      "UNESCO day promoting the reading, writing, and teaching of poetry.",
      "Worldwide", "Celebrates the diversity of linguistic expression through poetry.",
      "Poetry readings, workshops, and literary events.", false),

    mk("theatre-day", "World Theatre Day", `${y}-03-27`, "Observance", "Global", "Cultural",
      "International day celebrating theatre arts worldwide.",
      "Worldwide", "Promotes the art of theatre and its importance in culture.",
      "Special theatre performances, workshops, and street plays.", false),

    mk("book-day", "World Book Day", `${y}-04-23`, "Observance", "Global", "Cultural",
      "UNESCO day promoting reading, publishing, and copyright worldwide.",
      "Worldwide", "Celebrates books and reading as a gateway to knowledge.",
      "Book fairs, reading marathons, author events, and library celebrations.", false),

    mk("dance-day", "International Dance Day", `${y}-04-29`, "Observance", "Global", "Cultural",
      "UNESCO day celebrating dance in all its forms.",
      "Worldwide", "Promotes dance as an art form and celebrates its diversity.",
      "Dance performances, flash mobs, workshops, and cultural events.", false),

    mk("press-day", "World Press Freedom Day", `${y}-05-03`, "Observance", "Global", "Social",
      "UN day raising awareness about press freedom and journalists' safety.",
      "Worldwide", "Highlights the importance of free press and journalism.",
      "Conferences, awards for journalism, and media freedom campaigns.", false),

    mk("red-cross", "World Red Cross Day", `${y}-05-08`, "Observance", "Global", "Health",
      "Birthday of Henry Dunant, founder of the Red Cross.",
      "Worldwide", "Honors the humanitarian work of the Red Cross movement.",
      "Blood donation drives, first aid awareness, and volunteer appreciation.", false),

    mk("family-day", "International Day of Families", `${y}-05-15`, "Social Day", "Global", "Social",
      "UN day promoting awareness about family-related issues.",
      "Worldwide", "Highlights the importance of families in society.",
      "Family events, community gatherings, and policy discussions.", false),

    mk("biodiversity-day", "International Day for Biological Diversity", `${y}-05-22`, "Observance", "Global", "Environmental",
      "UN day promoting awareness about biodiversity issues.",
      "Worldwide", "Raises awareness about the importance of biological diversity.",
      "Nature walks, species counting, and environmental campaigns.", false),

    mk("milk-day", "World Milk Day", `${y}-06-01`, "Observance", "Global", "Health",
      "FAO day recognizing the importance of milk as a global food.",
      "Worldwide", "Celebrates the dairy sector and highlights the nutritional value of milk.",
      "Milk distribution, dairy farm visits, and nutritional awareness campaigns.", false),

    mk("bicycle-day", "World Bicycle Day", `${y}-06-03`, "Social Day", "Global", "Health",
      "UN day promoting the bicycle as a sustainable mode of transport.",
      "Worldwide", "Encourages cycling for health, sustainability, and transport.",
      "Community cycling events, bike rallies, and cycling awareness campaigns.", false),

    mk("food-safety", "World Food Safety Day", `${y}-06-07`, "Observance", "Global", "Health",
      "UN day promoting food safety awareness globally.",
      "Worldwide", "Highlights the importance of safe food for public health.",
      "Food safety workshops, inspections, and awareness campaigns.", false),

    mk("refugee-day", "World Refugee Day", `${y}-06-20`, "Observance", "Global", "Social",
      "UN day honoring refugees worldwide and raising awareness about their plight.",
      "Worldwide", "Honors the strength and courage of refugees globally.",
      "Film screenings, cultural events, and awareness campaigns.", false),

    mk("music-day", "World Music Day (Fete de la Musique)", `${y}-06-21`, "Social Day", "Global", "Cultural",
      "International day celebrating music with free concerts worldwide.",
      "Worldwide", "Promotes music making by amateurs and professionals alike.",
      "Free open-air concerts, street performances, and music festivals.", false),

    mk("doctor-day", "National Doctor's Day", `${y}-07-01`, "Observance", "National", "Health",
      "Honors Dr. Bidhan Chandra Roy, legendary physician and former Bengal CM.",
      "All across India", "Celebrates doctors and their contributions to healthcare.",
      "Felicitation of doctors, health camps, and gratitude events in hospitals.", false),

    mk("population-day", "World Population Day", `${y}-07-11`, "Observance", "Global", "Environmental",
      "UN day raising awareness about global population issues.",
      "Worldwide", "Focuses attention on population-related issues.",
      "Awareness campaigns, seminars on family planning, population education.", false),

    mk("malaria-day", "World Malaria Day", `${y}-04-25`, "Observance", "Global", "Health",
      "International day recognizing global efforts to control malaria.",
      "Worldwide", "Highlights the need for continued investment in malaria prevention.",
      "Distribution of mosquito nets, awareness campaigns, medical outreach.", false),

    mk("handwashing-day", "Global Handwashing Day", `${y}-10-15`, "Observance", "Global", "Health",
      "Global day promoting handwashing with soap as a key health intervention.",
      "Worldwide", "Raises awareness about the importance of handwashing to prevent disease.",
      "Handwashing demonstrations, school campaigns, and hygiene awareness drives.", false),

    mk("food-day", "World Food Day", `${y}-10-16`, "Observance", "Global", "Health",
      "FAO day promoting worldwide awareness about hunger and food security.",
      "Worldwide", "Highlights the fight against hunger and malnutrition.",
      "Food drives, awareness campaigns, and community feeding programs.", false),

    mk("statistics-day", "World Statistics Day", `${y}-10-20`, "Observance", "Global", "Social",
      "UN day celebrating the contributions of statistics to society.",
      "Worldwide", "Recognizes the importance of data and statistics in decision-making.",
      "Statistical awareness events, workshops, and data visualization exhibitions.", false),

    mk("unity-day", "National Unity Day (Rashtriya Ekta Diwas)", `${y}-10-31`, "Observance", "National", "Political",
      "Celebrates Sardar Patel's birthday as National Unity Day.",
      "All across India", "Promotes unity and integrity of India.",
      "Run for Unity events, pledge-taking ceremonies, and cultural programs.", false),

    mk("legal-services", "National Legal Services Day", `${y}-11-09`, "Observance", "National", "Social",
      "Commemorates the enactment of the Legal Services Authorities Act.",
      "All across India", "Promotes free legal aid for weaker sections of society.",
      "Legal awareness camps, free consultations, and Lok Adalats.", false),

    mk("tolerance-day", "International Day for Tolerance", `${y}-11-16`, "Observance", "Global", "Social",
      "UN day promoting mutual understanding among cultures.",
      "Worldwide", "Promotes respect, acceptance, and appreciation of diversity.",
      "Cultural exchange events, dialogues, and educational programs.", false),

    mk("television-day", "World Television Day", `${y}-11-21`, "Observance", "Global", "Cultural",
      "UN day recognizing television's role in global communication.",
      "Worldwide", "Highlights the impact of television on society and decision-making.",
      "Media discussions, TV history exhibitions, and broadcasting events.", false),

    mk("energy-day", "National Energy Conservation Day", `${y}-12-14`, "Observance", "National", "Environmental",
      "Indian day promoting energy conservation and efficiency.",
      "All across India", "Raises awareness about efficient use of energy resources.",
      "Energy audits, awareness campaigns, awards for energy conservation.", false),

    mk("minorities-day", "Minorities Rights Day", `${y}-12-18`, "Observance", "National", "Social",
      "Commemorates the adoption of the UN Declaration on the Rights of Minorities.",
      "All across India", "Promotes and protects the rights of religious and linguistic minorities.",
      "Seminars, cultural programs, and awareness events on minority rights.", false),

    mk("farmers-day", "National Farmers' Day (Kisan Diwas)", `${y}-12-23`, "Observance", "National", "Social",
      "Birthday of Chaudhary Charan Singh, celebrating Indian farmers.",
      "All across India", "Honors the contribution of farmers to India's economy.",
      "Agricultural exhibitions, farmer felicitation, and rural development discussions.", false),

    mk("good-governance", "National Good Governance Day", `${y}-12-25`, "Observance", "National", "Political",
      "Birthday of former PM Atal Bihari Vajpayee, promoting good governance.",
      "All across India", "Honors Vajpayee's legacy and promotes citizen-friendly governance.",
      "Government awareness programs and citizen engagement initiatives.", false),

    // ===== MORE CULTURAL / ARTS FESTIVALS =====
    mk("kumbh-snan", "Mauni Amavasya (Kumbh Snan)", `${y}-01-29`, "Festival Day", "National", "Religious",
      "Sacred bathing day during Kumbh/Magh Mela at Prayagraj.",
      "Prayagraj, Haridwar, Ujjain, Nashik", "Most auspicious bathing day of the Magh Mela.",
      "Holy dip in Sangam, silent vows (maun vrat), and charity.", false),

    mk("vasant-utsav", "Shantiniketan Basanta Utsav", d.basant, "Festival Day", "Regional", "Cultural",
      "Rabindranath Tagore's spring festival at Shantiniketan celebrating Holi with dance and music.",
      "Shantiniketan, West Bengal", "Tagore's unique cultural celebration of spring at Visva-Bharati.",
      "Students singing Tagore songs, dancing with abir colors, and cultural performances.", false, ["West Bengal"]),

    mk("surajkund", "Surajkund International Crafts Mela", `${y}-02-01`, "Festival Day", "National", "Cultural",
      "Annual crafts fair showcasing traditional arts, handicrafts, and cultural performances.",
      "Surajkund, Faridabad, Haryana", "Promotes Indian handicrafts and cultural exchange.",
      "Handicraft stalls, folk performances, food courts, and international exhibitions.", false, ["Haryana"]),

    mk("jaipur-lit", "Jaipur Literature Festival", `${y}-01-23`, "Festival Day", "National", "Cultural",
      "World's largest free literary festival held annually in Jaipur.",
      "Jaipur, Rajasthan", "Celebrates literature, ideas, and free expression.",
      "Author talks, book launches, panel discussions, poetry readings, and music.", false, ["Rajasthan"]),

    mk("kala-ghoda", "Kala Ghoda Arts Festival", `${y}-02-01`, "Festival Day", "Regional", "Cultural",
      "Mumbai's iconic multi-day arts festival in the Kala Ghoda precinct.",
      "Mumbai, Maharashtra", "Celebrates visual arts, dance, music, and cinema.",
      "Art installations, street food, film screenings, stand-up comedy, and theatre.", false, ["Maharashtra"]),

    mk("hampi-utsav", "Hampi Utsav", `${y}-01-27`, "Festival Day", "Regional", "Cultural",
      "Cultural festival at the ruins of the Vijayanagara Empire in Hampi.",
      "Hampi, Karnataka", "Showcases the rich heritage of the Vijayanagara kingdom.",
      "Traditional dance, music, puppet shows, fireworks, and processions.", false, ["Karnataka"]),

    mk("elephant-festival", "Jaipur Elephant Festival", d.holi, "Festival Day", "Regional", "Cultural",
      "Colorful festival where elephants are decorated and paraded, held on Holi.",
      "Jaipur, Rajasthan", "Celebrates elephants as a symbol of Rajasthani heritage.",
      "Elephant polo, decorated elephant parades, tug-of-war, and folk performances.", false, ["Rajasthan"]),

    mk("desert-festival", "Jaisalmer Desert Festival", `${y}-02-10`, "Festival Day", "Regional", "Cultural",
      "Three-day cultural extravaganza in the Thar Desert of Rajasthan.",
      "Jaisalmer, Rajasthan", "Showcases Rajasthani folk culture against the desert backdrop.",
      "Camel races, turban tying, folk music, fire dancers, and Mr. Desert contest.", false, ["Rajasthan"]),

    mk("international-kite", "International Kite Festival", `${y}-01-14`, "Festival Day", "Regional", "Cultural",
      "Massive kite festival held in Ahmedabad during Makar Sankranti.",
      "Ahmedabad, Gujarat", "Celebrates the tradition of kite flying on Makar Sankranti.",
      "Kite flying competitions, international kite displays, and rooftop celebrations.", false, ["Gujarat"]),

    mk("mysuru-dasara", "Mysuru Dasara", `${y}-10-07`, "Festival Day", "Regional", "Cultural",
      "10-day Navaratri celebration in Mysuru with royal heritage, culminating in a grand procession.",
      "Mysuru, Karnataka", "Celebrates the royal heritage of Mysuru and Goddess Chamundeshwari's victory.",
      "Illuminated Mysuru Palace, elephant procession (Jamboo Savari), cultural events, exhibitions.", true, ["Karnataka"]),

    mk("sangai-festival", "Sangai Festival", `${y}-11-21`, "Festival Day", "Regional", "Cultural",
      "Manipur's biggest tourism festival named after the state animal — the Sangai deer.",
      "Imphal, Manipur", "Showcases Manipur's rich art, culture, handicrafts, and cuisine.",
      "Traditional dances, sports events, indigenous games, food stalls, and fashion shows.", false, ["Manipur"]),

    mk("madurai-meenakshi", "Chithirai Thiruvizha (Meenakshi Thirukalyanam)", `${y}-04-14`, "Festival Day", "Regional", "Religious",
      "Grand 15-day temple festival at Meenakshi Amman Temple celebrating the divine wedding.",
      "Madurai, Tamil Nadu", "Celebrates the celestial marriage of Goddess Meenakshi and Lord Sundareshwarar.",
      "Divine wedding ceremony, chariot processions, and cultural programs.", false, ["Tamil Nadu"]),

    mk("nehru-trophy", "Nehru Trophy Boat Race", `${y}-08-08`, "Festival Day", "Regional", "Cultural",
      "Famous snake boat race on Punnamada Lake in Kerala.",
      "Alappuzha, Kerala", "One of India's most exciting sporting and cultural events on water.",
      "Snake boat (Chundan Vallam) races, cheering crowds, and cultural performances.", false, ["Kerala"]),

    mk("nuakhai", "Nuakhai", `${y}-09-08`, "Festival Day", "Regional", "Cultural",
      "Agricultural festival of Western Odisha celebrating the new rice harvest.",
      "Western Odisha", "Celebrates the first rice of the season being offered to Goddess Samaleswari.",
      "Offering new rice to deities, family reunions, traditional dances, and feasting.", false, ["Odisha"]),

    mk("puthandu", "Puthandu (Tamil New Year)", `${y}-04-14`, "Festival Day", "Regional", "Cultural",
      "Tamil New Year celebrated with auspicious beginnings and traditional feasting.",
      "Tamil Nadu", "Marks the first day of the Tamil solar calendar.",
      "Kanni (auspicious sight), mango pachadi, kolam decorations, and temple visits.", false, ["Tamil Nadu"]),

    mk("pohela-boishakh", "Pohela Boishakh (Bengali New Year)", `${y}-04-15`, "Festival Day", "Regional", "Cultural",
      "Bengali New Year celebrated with cultural programs and festive spirit.",
      "West Bengal, Bangladesh, Tripura", "Marks the first day of the Bengali calendar.",
      "Mangal Shobhajatra processions, Rabindra Sangeet, halkhata (new accounts), and feasting.", false, ["West Bengal","Tripura"]),

    mk("technology-day", "National Technology Day", `${y}-05-11`, "Observance", "National", "Social",
      "Commemorates India's nuclear tests at Pokhran on 11 May 1998.",
      "All across India", "Celebrates India's technological achievements.",
      "Tech exhibitions, seminars, and awards for innovation.", false),

    mk("space-day", "National Space Day", `${y}-08-23`, "Observance", "National", "Social",
      "Commemorates Chandrayaan-3's historic lunar landing on 23 August 2023.",
      "All across India", "Celebrates India's space achievements and ISRO milestones.",
      "ISRO events, space science exhibitions, and educational programs.", false),

    mk("sadbhavana", "Sadbhavana Diwas", `${y}-08-20`, "Observance", "National", "Political",
      "Birthday of former PM Rajiv Gandhi, observed as Harmony Day.",
      "All across India", "Promotes national integration, peace, and communal harmony.",
      "Sadbhavana pledge, peace rallies, and harmony events.", false),

    mk("surgical-strike", "Surgical Strike Day", `${y}-09-29`, "Observance", "National", "Political",
      "Commemorates the Indian Army's 2016 surgical strikes across the LoC.",
      "All across India", "Honors the bravery of Indian armed forces.",
      "Armed forces exhibitions, patriotic events, and tributes.", false),

    mk("police-commemoration", "Police Commemoration Day", `${y}-10-21`, "Observance", "National", "Political",
      "Honours police personnel who laid down their lives in the line of duty.",
      "All across India", "Commemorates the 10 CRPF men killed in a Chinese ambush in 1959.",
      "Wreath laying, parades, and remembrance events at police stations.", false),

    mk("ncc-day", "NCC Day", `${y}-11-22`, "Observance", "National", "Political",
      "Celebrates the raising of the National Cadet Corps on 22 November 1948.",
      "All across India", "Honors the NCC's role in youth development and nation-building.",
      "NCC parades, drills, adventure activities, and cultural programs.", false),

    mk("philanthropy-day", "National Philanthropy Day", `${y}-11-27`, "Observance", "National", "Social",
      "Celebrates the spirit of giving and charitable work across India.",
      "All across India", "Encourages philanthropy and recognizes charitable contributions.",
      "Charity drives, volunteer events, and recognition of philanthropists.", false),
  ];
}
