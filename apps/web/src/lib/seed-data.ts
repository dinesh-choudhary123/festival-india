import type { Festival } from "./types";

// Helper to compute day of week
function dayOf(d: string): string {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return days[new Date(d + "T00:00:00").getDay()];
}

function f(
  id: string, name: string, date: string, type: Festival["type"], scope: Festival["scope"],
  category: Festival["category"], description: string, where: string, why: string, how: string,
  isHoliday: boolean, regions: string[] = []
): Festival {
  const year = parseInt(date.split("-")[0], 10);
  return {
    id: `${id}-${date}`, name, date, day: dayOf(date), type, scope, category,
    description, where_celebrated: where, why_celebrated: why, how_celebrated: how,
    image_url: null, is_public_holiday: isHoliday, source: "supplementary",
    country: "IN", regions, year,
  };
}

function generateYear(y: number): Festival[] {
  // Lunar-calendar approximate dates per year
  const lunar: Record<number, Record<string, string>> = {
    2026: {
      basant: `${y}-01-23`, shivaratri: `${y}-02-15`, holika: `${y}-03-03`, holi: `${y}-03-04`,
      ramnavami: `${y}-03-26`, hanuman: `${y}-04-05`, akshaya: `${y}-04-19`, buddha: `${y}-05-12`,
      gurupurnima: `${y}-07-21`, nagpanchami: `${y}-07-26`, raksha: `${y}-08-08`,
      janmashtami: `${y}-08-14`, ganesh: `${y}-09-07`, onam: `${y}-09-04`,
      navratri: `${y}-09-28`, durga: `${y}-10-05`, dussehra: `${y}-10-07`,
      karva: `${y}-10-23`, dhanteras: `${y}-10-28`, diwali: `${y}-10-29`,
      govardhan: `${y}-10-30`, bhaidooj: `${y}-10-31`, chhath: `${y}-11-04`,
      gurunanak: `${y}-11-15`, eid_fitr: `${y}-03-20`, eid_adha: `${y}-05-27`,
      muharram: `${y}-06-16`, milad: `${y}-08-16`, vaisakhi: `${y}-04-13`,
      vishu: `${y}-04-14`, ugadi: `${y}-03-19`, gudipadwa: `${y}-03-19`,
      bihu: `${y}-04-14`, teej: `${y}-07-31`, thrissur: `${y}-04-27`,
      rath: `${y}-06-29`, hemis: `${y}-07-10`, bathukamma: `${y}-09-28`,
      bonalu: `${y}-07-12`, thaipusam: `${y}-01-25`, navroz: `${y}-08-16`,
      gobind: `${y}-01-05`,
    },
    2027: {
      basant: `${y}-02-11`, shivaratri: `${y}-03-06`, holika: `${y}-03-22`, holi: `${y}-03-23`,
      ramnavami: `${y}-04-15`, hanuman: `${y}-04-25`, akshaya: `${y}-05-08`, buddha: `${y}-05-31`,
      gurupurnima: `${y}-08-10`, nagpanchami: `${y}-08-14`, raksha: `${y}-08-27`,
      janmashtami: `${y}-09-02`, ganesh: `${y}-09-26`, onam: `${y}-08-24`,
      navratri: `${y}-10-17`, durga: `${y}-10-24`, dussehra: `${y}-10-26`,
      karva: `${y}-11-11`, dhanteras: `${y}-11-16`, diwali: `${y}-11-18`,
      govardhan: `${y}-11-19`, bhaidooj: `${y}-11-20`, chhath: `${y}-11-24`,
      gurunanak: `${y}-12-04`, eid_fitr: `${y}-03-10`, eid_adha: `${y}-05-17`,
      muharram: `${y}-06-06`, milad: `${y}-08-06`, vaisakhi: `${y}-04-13`,
      vishu: `${y}-04-14`, ugadi: `${y}-04-08`, gudipadwa: `${y}-04-08`,
      bihu: `${y}-04-14`, teej: `${y}-08-20`, thrissur: `${y}-05-16`,
      rath: `${y}-07-18`, hemis: `${y}-06-30`, bathukamma: `${y}-10-17`,
      bonalu: `${y}-08-01`, thaipusam: `${y}-02-13`, navroz: `${y}-08-06`,
      gobind: `${y}-01-05`,
    },
    2028: {
      basant: `${y}-01-31`, shivaratri: `${y}-02-23`, holika: `${y}-03-11`, holi: `${y}-03-12`,
      ramnavami: `${y}-04-03`, hanuman: `${y}-04-13`, akshaya: `${y}-04-27`, buddha: `${y}-05-20`,
      gurupurnima: `${y}-07-29`, nagpanchami: `${y}-08-03`, raksha: `${y}-08-16`,
      janmashtami: `${y}-08-22`, ganesh: `${y}-09-15`, onam: `${y}-09-12`,
      navratri: `${y}-10-06`, durga: `${y}-10-13`, dussehra: `${y}-10-15`,
      karva: `${y}-10-31`, dhanteras: `${y}-11-05`, diwali: `${y}-11-07`,
      govardhan: `${y}-11-08`, bhaidooj: `${y}-11-09`, chhath: `${y}-11-13`,
      gurunanak: `${y}-11-23`, eid_fitr: `${y}-02-28`, eid_adha: `${y}-05-06`,
      muharram: `${y}-05-26`, milad: `${y}-07-25`, vaisakhi: `${y}-04-13`,
      vishu: `${y}-04-14`, ugadi: `${y}-03-28`, gudipadwa: `${y}-03-28`,
      bihu: `${y}-04-14`, teej: `${y}-08-09`, thrissur: `${y}-05-05`,
      rath: `${y}-07-07`, hemis: `${y}-07-19`, bathukamma: `${y}-10-06`,
      bonalu: `${y}-07-20`, thaipusam: `${y}-02-03`, navroz: `${y}-08-17`,
      gobind: `${y}-01-05`,
    },
    2029: {
      basant: `${y}-02-18`, shivaratri: `${y}-03-13`, holika: `${y}-03-29`, holi: `${y}-03-30`,
      ramnavami: `${y}-04-22`, hanuman: `${y}-05-02`, akshaya: `${y}-05-16`, buddha: `${y}-06-08`,
      gurupurnima: `${y}-08-17`, nagpanchami: `${y}-08-22`, raksha: `${y}-09-04`,
      janmashtami: `${y}-09-10`, ganesh: `${y}-10-04`, onam: `${y}-09-01`,
      navratri: `${y}-10-25`, durga: `${y}-11-01`, dussehra: `${y}-11-03`,
      karva: `${y}-11-19`, dhanteras: `${y}-11-24`, diwali: `${y}-11-26`,
      govardhan: `${y}-11-27`, bhaidooj: `${y}-11-28`, chhath: `${y}-12-02`,
      gurunanak: `${y}-12-12`, eid_fitr: `${y}-02-17`, eid_adha: `${y}-04-25`,
      muharram: `${y}-05-15`, milad: `${y}-07-15`, vaisakhi: `${y}-04-13`,
      vishu: `${y}-04-14`, ugadi: `${y}-03-17`, gudipadwa: `${y}-03-17`,
      bihu: `${y}-04-14`, teej: `${y}-08-28`, thrissur: `${y}-04-24`,
      rath: `${y}-06-26`, hemis: `${y}-07-08`, bathukamma: `${y}-10-25`,
      bonalu: `${y}-07-09`, thaipusam: `${y}-01-23`, navroz: `${y}-08-17`,
      gobind: `${y}-01-05`,
    },
    2030: {
      basant: `${y}-02-08`, shivaratri: `${y}-03-03`, holika: `${y}-03-19`, holi: `${y}-03-20`,
      ramnavami: `${y}-04-11`, hanuman: `${y}-04-21`, akshaya: `${y}-05-06`, buddha: `${y}-05-28`,
      gurupurnima: `${y}-08-07`, nagpanchami: `${y}-08-12`, raksha: `${y}-08-25`,
      janmashtami: `${y}-08-31`, ganesh: `${y}-09-24`, onam: `${y}-08-22`,
      navratri: `${y}-10-14`, durga: `${y}-10-21`, dussehra: `${y}-10-23`,
      karva: `${y}-11-08`, dhanteras: `${y}-11-13`, diwali: `${y}-11-15`,
      govardhan: `${y}-11-16`, bhaidooj: `${y}-11-17`, chhath: `${y}-11-21`,
      gurunanak: `${y}-12-02`, eid_fitr: `${y}-02-06`, eid_adha: `${y}-04-14`,
      muharram: `${y}-05-05`, milad: `${y}-07-04`, vaisakhi: `${y}-04-13`,
      vishu: `${y}-04-14`, ugadi: `${y}-04-06`, gudipadwa: `${y}-04-06`,
      bihu: `${y}-04-14`, teej: `${y}-08-17`, thrissur: `${y}-05-13`,
      rath: `${y}-07-16`, hemis: `${y}-06-28`, bathukamma: `${y}-10-14`,
      bonalu: `${y}-07-28`, thaipusam: `${y}-02-11`, navroz: `${y}-08-17`,
      gobind: `${y}-01-05`,
    },
  };

  const d = lunar[y] || lunar[2026];
  // Mother's Day: 2nd Sunday of May
  const may1 = new Date(y, 4, 1);
  const motherDay = new Date(y, 4, (14 - may1.getDay()) % 7 + 8);
  const motherDayStr = motherDay.toISOString().split("T")[0];
  // Father's Day: 3rd Sunday of June
  const jun1 = new Date(y, 5, 1);
  const fatherDay = new Date(y, 5, (21 - jun1.getDay()) % 7 + 15);
  const fatherDayStr = fatherDay.toISOString().split("T")[0];
  // Friendship Day: 1st Sunday of August
  const aug1 = new Date(y, 7, 1);
  const friendDay = new Date(y, 7, (7 - aug1.getDay()) % 7 + 1);
  const friendDayStr = friendDay.toISOString().split("T")[0];
  // Laughter Day: 1st Sunday of May
  const laughDay = new Date(y, 4, (7 - may1.getDay()) % 7 + 1);
  const laughDayStr = laughDay.toISOString().split("T")[0];

  const good_friday_map: Record<number, string> = {
    2026: `${y}-04-03`, 2027: `${y}-03-26`, 2028: `${y}-04-14`,
    2029: `${y}-03-30`, 2030: `${y}-04-19`,
  };
  const easter_map: Record<number, string> = {
    2026: `${y}-04-05`, 2027: `${y}-03-28`, 2028: `${y}-04-16`,
    2029: `${y}-04-01`, 2030: `${y}-04-21`,
  };

  return [
    // ===== RELIGIOUS =====
    f("newyear", "New Year's Day", `${y}-01-01`, "Social Day", "Global", "Cultural",
      "The first day of the year in the Gregorian calendar, celebrated worldwide with joy and new beginnings.",
      "Worldwide", "Marks the start of a new year, a time for reflection and resolutions.",
      "Fireworks, parties, countdowns at midnight, and exchanging greetings.", true),

    f("guru-gobind", "Guru Gobind Singh Jayanti", d.gobind, "Festival Day", "National", "Religious",
      "Birthday of Guru Gobind Singh, the tenth Sikh Guru and founder of the Khalsa.",
      "Punjab, Delhi, Haryana, and Sikh communities worldwide",
      "Celebrates the birth of the tenth Sikh Guru who established the Khalsa in 1699.",
      "Nagar Kirtans (processions), prayers at Gurudwaras, langars, and recitation of Guru Granth Sahib.", true, ["Punjab","Haryana","Delhi"]),

    f("lohri", "Lohri", `${y}-01-13`, "Festival Day", "Regional", "Cultural",
      "A Punjabi winter folk festival celebrating the harvest season and bonfire night.",
      "Punjab, Haryana, Himachal Pradesh, Delhi",
      "Marks the end of winter and the harvest of sugarcane and rabi crops.",
      "Lighting bonfires, singing folk songs, dancing bhangra, and eating rewri, gajak, and popcorn.", false, ["Punjab","Haryana","Himachal Pradesh"]),

    f("makar-sankranti", "Makar Sankranti", `${y}-01-14`, "Festival Day", "National", "Religious",
      "Hindu harvest festival marking the sun's transit into Capricorn (Makara).",
      "Celebrated across India under different names",
      "Marks the transition of the sun into Uttarayan, the auspicious northward journey.",
      "Kite flying, sesame-jaggery sweets, holy river dipping, and bonfires.", true),

    f("pongal-day1", "Pongal (Day 1 - Bhogi)", `${y}-01-14`, "Festival Day", "Regional", "Cultural",
      "First day of the Tamil harvest festival, dedicated to Lord Indra.",
      "Tamil Nadu", "Celebrates the end of the old and beginning of new by discarding old belongings.",
      "Burning old clothes and items in a bonfire, cleaning homes, and kolam designs.", false, ["Tamil Nadu"]),

    f("pongal-day2", "Pongal (Day 2 - Thai Pongal)", `${y}-01-15`, "Festival Day", "Regional", "Cultural",
      "Main day of Pongal, a thanksgiving to the Sun God for agricultural abundance.",
      "Tamil Nadu, Sri Lanka", "Thanks the Sun God for a bountiful harvest.",
      "Cooking Pongal rice in new clay pots until it overflows, symbolizing abundance and prosperity.", false, ["Tamil Nadu"]),

    f("pongal-day3", "Pongal (Day 3 - Mattu Pongal)", `${y}-01-16`, "Festival Day", "Regional", "Cultural",
      "Third day of Pongal dedicated to cattle who help in farming.",
      "Tamil Nadu", "Honors cattle for their role in agriculture.",
      "Decorating bulls with garlands, painting their horns, and Jallikattu (bull-taming sport).", false, ["Tamil Nadu"]),

    f("pongal-day4", "Pongal (Day 4 - Kaanum Pongal)", `${y}-01-17`, "Festival Day", "Regional", "Cultural",
      "Fourth and final day of Pongal, a day for family gatherings and outings.",
      "Tamil Nadu", "A day of recreation and socializing after the harvest celebrations.",
      "Family picnics, visiting relatives, bird watching, and young women praying for their brothers.", false, ["Tamil Nadu"]),

    f("magh-bihu", "Magh Bihu / Bhogali Bihu", `${y}-01-15`, "Festival Day", "Regional", "Cultural",
      "Assamese harvest festival marking the end of the harvesting season.",
      "Assam", "Celebrates the end of the harvest season in Assam.",
      "Building Meji (bonfire structures), community feasting, traditional Assamese games, and Tekeli Bhonga.", false, ["Assam"]),

    f("thaipusam", "Thaipusam", d.thaipusam, "Festival Day", "Regional", "Religious",
      "Hindu Tamil festival dedicated to Lord Murugan, celebrated with devotion and body piercing.",
      "Tamil Nadu, Kerala, Malaysia, Singapore",
      "Commemorates the day Goddess Parvati gave Lord Murugan a vel (spear) to vanquish evil.",
      "Kavadi carrying, body piercing with vel, milk pot offerings, and temple processions.", false, ["Tamil Nadu","Kerala"]),

    f("basant-panchami", "Basant Panchami / Saraswati Puja", d.basant, "Festival Day", "National", "Religious",
      "Hindu festival honoring Goddess Saraswati, deity of knowledge, music, and art.",
      "North India, West Bengal, Odisha", "Celebrates Goddess Saraswati and the arrival of spring.",
      "Wearing yellow clothes, worshiping books and instruments, flying kites, and eating yellow sweets.", false),

    f("shivaratri", "Maha Shivaratri", d.shivaratri, "Festival Day", "National", "Religious",
      "The great night of Lord Shiva, one of the most significant Hindu festivals.",
      "All across India and Nepal", "Marks the night of Shiva's cosmic dance (Tandava) and his marriage to Parvati.",
      "Fasting, night-long vigil, Shiva Linga abhishekam, chanting Om Namah Shivaya, and visiting Shiva temples.", true),

    f("holika-dahan", "Holika Dahan", d.holika, "Festival Day", "National", "Religious",
      "Bonfire night before Holi, symbolizing the victory of good over evil.",
      "All across India", "Commemorates the burning of demoness Holika and triumph of devotee Prahlad.",
      "Lighting large bonfires, performing rituals, singing and dancing around the fire.", false),

    f("holi", "Holi", d.holi, "Festival Day", "National", "Cultural",
      "The festival of colors, celebrating love, spring, and the victory of good over evil.",
      "All across India, Nepal, and diaspora worldwide",
      "Celebrates the eternal love of Radha-Krishna and the arrival of spring.",
      "Playing with colored powders and water, dancing to music, drinking thandai and bhang, and community gatherings.", true),

    f("ugadi", "Ugadi", d.ugadi, "Festival Day", "Regional", "Cultural",
      "Telugu and Kannada New Year, marking the beginning of a new Hindu lunar calendar year.",
      "Andhra Pradesh, Telangana, Karnataka",
      "Marks the beginning of a new year in the Deccan region.",
      "Eating Ugadi Pachadi (mix of six tastes), decorating doorways with mango leaves, and temple visits.", false, ["Andhra Pradesh","Telangana","Karnataka"]),

    f("gudi-padwa", "Gudi Padwa", d.gudipadwa, "Festival Day", "Regional", "Cultural",
      "Marathi New Year celebrating new beginnings and the spring harvest.",
      "Maharashtra, Goa", "Marks the beginning of the Marathi calendar year.",
      "Hoisting Gudi (decorated pole with cloth and garland), eating Shrikhand-Puri, and Rangoli.", false, ["Maharashtra","Goa"]),

    f("ram-navami", "Ram Navami", d.ramnavami, "Festival Day", "National", "Religious",
      "Celebrates the birth of Lord Rama, the seventh avatar of Vishnu.",
      "All across India", "Marks the birth of Lord Rama in Ayodhya.",
      "Temple visits, reciting Ramayana, processions with Rama idols, and fasting.", true),

    f("good-friday", "Good Friday", good_friday_map[y], "Observance", "Global", "Religious",
      "Christian holy day commemorating the crucifixion of Jesus Christ.",
      "Worldwide, especially Christian communities in India",
      "Commemorates the suffering and death of Jesus Christ on the cross.",
      "Church services, fasting, prayer, Stations of the Cross, and quiet reflection.", true),

    f("easter", "Easter", easter_map[y], "Festival Day", "Global", "Religious",
      "Christian festival celebrating the resurrection of Jesus Christ.",
      "Worldwide", "Celebrates Jesus Christ's resurrection from the dead, the cornerstone of Christian faith.",
      "Church services, Easter egg hunts, family meals, and exchanging Easter greetings.", false),

    f("hanuman-jayanti", "Hanuman Jayanti", d.hanuman, "Festival Day", "National", "Religious",
      "Birthday of Lord Hanuman, the devoted servant of Lord Rama.",
      "All across India", "Celebrates the birth of Hanuman, symbol of strength and devotion.",
      "Reciting Hanuman Chalisa, visiting temples, offering sindoor, and fasting.", false),

    f("mahavir-jayanti", "Mahavir Jayanti", `${y}-04-10`, "Festival Day", "National", "Religious",
      "Celebrates the birth of Lord Mahavira, the 24th Tirthankara of Jainism.",
      "All across India, especially Gujarat, Rajasthan, Maharashtra",
      "Marks the birth of the founder of Jain philosophy.",
      "Temple processions, abhisheka of Mahavira idol, prayers, and charity.", true),

    f("akshaya-tritiya", "Akshaya Tritiya", d.akshaya, "Festival Day", "National", "Religious",
      "Auspicious Hindu and Jain holy day believed to bring good luck and success.",
      "All across India", "Believed to be the day when any new venture or investment will prosper.",
      "Buying gold, starting new businesses, weddings, and charity.", false),

    f("vaisakhi", "Vaisakhi / Baisakhi", d.vaisakhi, "Festival Day", "Regional", "Religious",
      "Sikh New Year and harvest festival commemorating the founding of the Khalsa.",
      "Punjab, Haryana, and Sikh communities worldwide",
      "Celebrates the founding of Khalsa by Guru Gobind Singh in 1699 and the harvest season.",
      "Visiting Gurudwaras, Nagar Kirtans, bhangra dance, langars, and harvest celebrations.", true, ["Punjab","Haryana"]),

    f("buddha-purnima", "Buddha Purnima / Vesak", d.buddha, "Festival Day", "National", "Religious",
      "Celebrates the birth, enlightenment, and death of Gautama Buddha.",
      "India, Sri Lanka, Nepal, Southeast Asia",
      "Commemorates the three most important events in Buddha's life.",
      "Visiting Buddhist temples, meditation, prayer, lighting lamps, and acts of charity.", true),

    f("eid-ul-fitr", "Eid ul-Fitr", d.eid_fitr, "Festival Day", "National", "Religious",
      "Islamic festival marking the end of Ramadan, the holy month of fasting.",
      "Muslim communities across India and worldwide",
      "Celebrates the end of a month-long dawn-to-sunset fasting during Ramadan.",
      "Morning prayers at mosques, wearing new clothes, feasting with family, giving Zakat al-Fitr.", true),

    f("eid-ul-adha", "Eid ul-Adha (Bakrid)", d.eid_adha, "Festival Day", "National", "Religious",
      "Islamic festival of sacrifice honoring Ibrahim's willingness to sacrifice his son.",
      "Muslim communities across India and worldwide",
      "Honors Prophet Ibrahim's devotion to God and his readiness to sacrifice.",
      "Prayers at mosque, animal sacrifice (Qurbani), distributing meat to poor, and family gatherings.", true),

    f("muharram", "Muharram", d.muharram, "Observance", "National", "Religious",
      "Islamic New Year and mourning for the martyrdom of Imam Hussain at Karbala.",
      "Muslim communities across India", "Commemorates the martyrdom of Hussain ibn Ali at the Battle of Karbala.",
      "Tazia processions, mourning gatherings, reciting marsiya, fasting, and charity.", true),

    f("milad-un-nabi", "Milad un-Nabi (Eid-e-Milad)", d.milad, "Observance", "National", "Religious",
      "Birthday of Prophet Muhammad, the founder of Islam.",
      "Muslim communities across India and worldwide",
      "Celebrates the birth of Prophet Muhammad.",
      "Processions, decorating mosques, reciting the Quran, distributing sweets, and charity.", true),

    f("guru-purnima", "Guru Purnima", d.gurupurnima, "Observance", "National", "Religious",
      "Hindu and Buddhist festival dedicated to spiritual and academic teachers (gurus).",
      "All across India and Nepal", "Honors the sage Vyasa and the tradition of the guru-shishya relationship.",
      "Paying respects to gurus, offering prayers, and performing puja.", false),

    f("nag-panchami", "Nag Panchami", d.nagpanchami, "Festival Day", "National", "Religious",
      "Hindu festival of worship of snakes (Nagas), observed with prayers and milk offerings.",
      "All across India, especially Maharashtra, Karnataka",
      "Honors snakes (Nagas) who play a role in Hindu mythology.",
      "Offering milk and prayers to snake idols, visiting snake temples, and fasting.", false),

    f("raksha-bandhan", "Raksha Bandhan", d.raksha, "Festival Day", "National", "Cultural",
      "Festival celebrating the bond between brothers and sisters.",
      "All across India", "Celebrates the protective bond between siblings.",
      "Sisters tie rakhi on brothers' wrists, exchange gifts, and share sweets.", true),

    f("janmashtami", "Krishna Janmashtami", d.janmashtami, "Festival Day", "National", "Religious",
      "Celebrates the birth of Lord Krishna, the eighth avatar of Vishnu.",
      "All across India, especially Mathura, Vrindavan",
      "Marks the birth of Lord Krishna at midnight in a prison in Mathura.",
      "Midnight celebrations, Dahi Handi, fasting, singing bhajans, and enacting Ras Leela.", true),

    f("ganesh-chaturthi", "Ganesh Chaturthi", d.ganesh, "Festival Day", "National", "Religious",
      "Festival celebrating the birth of Lord Ganesha, the remover of obstacles.",
      "All across India, especially Maharashtra, Karnataka, Goa",
      "Celebrates the birth of the elephant-headed god Ganesha.",
      "Installing Ganesh idols, puja, modak offerings, cultural events, and immersion (Visarjan) processions.", true, ["Maharashtra","Karnataka","Goa","Andhra Pradesh"]),

    f("onam", "Onam", d.onam, "Festival Day", "Regional", "Cultural",
      "Kerala's biggest harvest festival celebrating the return of mythical King Mahabali.",
      "Kerala", "Celebrates King Mahabali's annual return and the harvest season in Kerala.",
      "Onam Sadya (grand vegetarian feast), Vallam Kali (boat race), Pookkalam (flower rangoli), and Kathakali.", true, ["Kerala"]),

    f("navratri", "Navratri (Day 1)", d.navratri, "Festival Day", "National", "Religious",
      "Nine-night Hindu festival dedicated to Goddess Durga and her nine forms.",
      "All across India, especially Gujarat, West Bengal",
      "Celebrates the victory of Goddess Durga over the buffalo demon Mahishasura.",
      "Garba and Dandiya Raas dances, Durga idol installations, fasting, and Kanya Pujan.", true),

    f("durga-puja", "Durga Puja", d.durga, "Festival Day", "Regional", "Religious",
      "Major Bengali festival celebrating Goddess Durga's victory over Mahishasura.",
      "West Bengal, Assam, Odisha, Tripura, and Bengali diaspora",
      "Celebrates Goddess Durga's triumph over evil.",
      "Elaborate pandals, dhunuchi dance, sindoor khela, art installations, and grand idol immersion.", true, ["West Bengal","Assam","Odisha","Tripura"]),

    f("dussehra", "Dussehra / Vijayadashami", d.dussehra, "Festival Day", "National", "Religious",
      "Celebrates Lord Rama's victory over Ravana and Durga's triumph over Mahishasura.",
      "All across India", "Marks the victory of good over evil.",
      "Burning Ravana effigies, Ramlila performances, processions, and Shami tree worship.", true),

    f("karva-chauth", "Karva Chauth", d.karva, "Observance", "National", "Cultural",
      "Hindu fasting day observed by married women for the longevity of their husbands.",
      "North India — Punjab, Haryana, UP, Rajasthan",
      "Married women fast from sunrise to moonrise for their husband's long life.",
      "Fasting without water, dressing in bridal attire, moon sighting ritual, and breaking fast with husband.", false, ["Punjab","Haryana","Uttar Pradesh","Rajasthan"]),

    f("dhanteras", "Dhanteras", d.dhanteras, "Festival Day", "National", "Religious",
      "First day of the five-day Diwali celebration, dedicated to wealth and prosperity.",
      "All across India", "Honors Dhanvantari (god of Ayurveda) and Goddess Lakshmi.",
      "Buying gold, silver, and utensils; lighting diyas; cleaning homes; and Lakshmi puja.", false),

    f("diwali", "Diwali (Deepavali)", d.diwali, "Festival Day", "National", "Religious",
      "Festival of lights, one of the biggest Hindu festivals celebrating the triumph of light over darkness.",
      "All across India, Nepal, Sri Lanka, and diaspora worldwide",
      "Celebrates Lord Rama's return to Ayodhya and the victory of light over darkness.",
      "Lighting diyas and candles, bursting firecrackers, Lakshmi-Ganesh puja, rangoli, and exchanging sweets.", true),

    f("govardhan-puja", "Govardhan Puja", d.govardhan, "Festival Day", "National", "Religious",
      "Hindu festival commemorating Lord Krishna lifting the Govardhan Hill.",
      "North India, especially Mathura and Vrindavan",
      "Commemorates Krishna lifting Govardhan Hill to shelter villagers from Indra's wrath.",
      "Building Govardhan of cow dung, offering Annakut (mountain of food) to Krishna, and temple visits.", false),

    f("bhai-dooj", "Bhai Dooj", d.bhaidooj, "Festival Day", "National", "Cultural",
      "Festival celebrating the bond between brothers and sisters, falling after Diwali.",
      "All across India", "Celebrates the sibling bond, similar to Raksha Bandhan.",
      "Sisters apply tilak on brothers' foreheads, perform aarti, and exchange gifts.", false),

    f("chhath-puja", "Chhath Puja", d.chhath, "Festival Day", "Regional", "Religious",
      "Ancient Hindu festival dedicated to the Sun God and Chhathi Maiya.",
      "Bihar, Jharkhand, Eastern UP, Nepal", "Devotion to the Sun God for sustaining life on Earth.",
      "Fasting for 36 hours, standing in water offering arghya to rising and setting sun.", true, ["Bihar","Jharkhand","Uttar Pradesh"]),

    f("guru-nanak", "Guru Nanak Jayanti", d.gurunanak, "Festival Day", "National", "Religious",
      "Birthday of Guru Nanak Dev Ji, the founder of Sikhism.",
      "All across India, especially Punjab",
      "Celebrates the birth of the first Sikh Guru who founded Sikhism in the 15th century.",
      "Prabhat Pheris (dawn processions), Akhand Path, langars, and Nagar Kirtans.", true),

    f("christmas", "Christmas", `${y}-12-25`, "Festival Day", "Global", "Religious",
      "Christian holiday celebrating the birth of Jesus Christ.",
      "Worldwide", "Celebrates the birth of Jesus Christ in Bethlehem.",
      "Church midnight mass, decorating Christmas trees, gift-giving, carol singing, and feasting.", true),

    f("navroz", "Parsi New Year (Navroz)", d.navroz, "Festival Day", "Regional", "Religious",
      "Parsi/Zoroastrian New Year celebration.",
      "Mumbai, Gujarat, and Parsi communities across India",
      "Marks the beginning of the Zoroastrian calendar year.",
      "Cleaning homes, wearing new clothes, visiting fire temples, feasting on traditional Parsi cuisine.", false, ["Maharashtra","Gujarat"]),

    // ===== POLITICAL =====
    f("indian-army-day", "Indian Army Day", `${y}-01-15`, "Social Day", "National", "Political",
      "Honors the Indian Army and commemorates Field Marshal KM Cariappa taking command in 1949.",
      "All across India", "Marks the day India got its first Indian Commander-in-Chief of the Army.",
      "Military parades in New Delhi, bravery awards, and tributes to soldiers.", false),

    f("republic-day", "Republic Day", `${y}-01-26`, "Festival Day", "National", "Political",
      "National holiday celebrating the adoption of the Indian Constitution on 26 January 1950.",
      "All across India, main parade in New Delhi",
      "Marks the day the Constitution of India came into effect, making India a republic.",
      "Grand parade at Rajpath, flag hoisting, cultural tableaux, military display, and Beating Retreat.", true),

    f("martyrs-day", "Martyrs' Day (Shaheed Diwas)", `${y}-01-30`, "Observance", "National", "Political",
      "Commemorates the assassination of Mahatma Gandhi on 30 January 1948.",
      "All across India", "Honors Mahatma Gandhi and all martyrs who sacrificed for India's freedom.",
      "Two-minute silence at 11 AM, wreath-laying at Raj Ghat, and tributes to Gandhi.", false),

    f("ambedkar-jayanti", "Ambedkar Jayanti", `${y}-04-14`, "Social Day", "National", "Political",
      "Birthday of Dr. B.R. Ambedkar, architect of the Indian Constitution and champion of social justice.",
      "All across India", "Honors the legacy of Dr. Ambedkar in fighting caste discrimination and drafting the Constitution.",
      "Paying tributes at Ambedkar statues, rallies, cultural programs, and reading the Constitution.", true),

    f("labour-day", "Labour Day / May Day", `${y}-05-01`, "Social Day", "Global", "Political",
      "International Workers' Day celebrating the achievements of workers worldwide.",
      "Worldwide", "Honors the contributions and rights of workers globally.",
      "Workers' rallies, trade union events, speeches, and government announcements on labor welfare.", true),

    f("independence-day", "Independence Day", `${y}-08-15`, "Festival Day", "National", "Political",
      "Celebrates India's independence from British rule on 15 August 1947.",
      "All across India, main event at Red Fort, New Delhi",
      "Marks the day India gained freedom from 200 years of British colonial rule.",
      "PM's address from Red Fort, flag hoisting, patriotic songs, kite flying, and cultural events.", true),

    f("gandhi-jayanti", "Gandhi Jayanti", `${y}-10-02`, "Social Day", "National", "Political",
      "Birthday of Mahatma Gandhi, the Father of the Nation and apostle of non-violence.",
      "All across India", "Honors Mahatma Gandhi's contributions to India's independence through non-violence.",
      "Prayer meetings, tributes at Raj Ghat, cleanliness drives (Swachh Bharat), and cultural programs.", true),

    f("sardar-patel", "Sardar Patel Jayanti (National Unity Day)", `${y}-10-31`, "Observance", "National", "Political",
      "Birthday of Sardar Vallabhbhai Patel, observed as National Unity Day (Rashtriya Ekta Diwas).",
      "All across India", "Honors the Iron Man of India who unified 562 princely states into the Indian Union.",
      "Run for Unity events, pledge for national unity, and tributes at Statue of Unity.", false),

    f("childrens-day", "Children's Day", `${y}-11-14`, "Social Day", "National", "Political",
      "Birthday of Jawaharlal Nehru, India's first PM, celebrated as Children's Day.",
      "All across India, schools and institutions",
      "Honors Nehru's love for children and promotes children's rights and education.",
      "Special school events, cultural programs by teachers for students, and fun activities.", false),

    f("constitution-day", "Constitution Day", `${y}-11-26`, "Observance", "National", "Political",
      "Commemorates the adoption of the Constitution of India on 26 November 1949.",
      "All across India", "Marks the day the Constituent Assembly adopted the Indian Constitution.",
      "Reading the Preamble, seminars on constitutional values, and awareness programs.", false),

    f("navy-day", "Navy Day", `${y}-12-04`, "Observance", "National", "Political",
      "Celebrates the Indian Navy and commemorates Operation Trident during the 1971 war.",
      "All across India, naval bases", "Honors the Indian Navy's decisive attack on Karachi harbor in 1971.",
      "Naval fleet reviews, exhibitions, and demonstrations of naval strength.", false),

    f("armed-forces-flag", "Armed Forces Flag Day", `${y}-12-07`, "Observance", "National", "Political",
      "Day to honor armed forces personnel and collect funds for their welfare.",
      "All across India", "Dedicated to collection of funds for welfare of armed forces personnel.",
      "Sale of flags and stickers, fund collection drives, and tribute events.", false),

    // ===== SOCIAL =====
    f("valentine", "Valentine's Day", `${y}-02-14`, "Social Day", "Global", "Social",
      "Day of love and romance celebrated worldwide.",
      "Worldwide", "Honors Saint Valentine and celebrates romantic love.",
      "Exchanging cards, flowers, chocolates, and gifts with loved ones.", false),

    f("social-justice", "World Social Justice Day", `${y}-02-20`, "Observance", "Global", "Social",
      "UN day promoting social justice including efforts to address poverty and inequality.",
      "Worldwide", "Promotes social justice, including tackling poverty, exclusion, and unemployment.",
      "Awareness campaigns, seminars, and advocacy for fair policies.", false),

    f("womens-day", "International Women's Day", `${y}-03-08`, "Social Day", "Global", "Social",
      "Global day celebrating women's achievements and advocating for gender equality.",
      "Worldwide", "Celebrates women's social, economic, cultural, and political achievements.",
      "Events honoring women, marches for gender equality, and cultural celebrations.", false),

    f("autism-day", "World Autism Awareness Day", `${y}-04-02`, "Observance", "Global", "Social",
      "UN day to raise awareness about autism spectrum disorder.",
      "Worldwide", "Promotes awareness and acceptance of people with autism.",
      "Light It Up Blue campaigns, awareness walks, and educational events.", false),

    f("mothers-day", "Mother's Day", motherDayStr, "Social Day", "Global", "Social",
      "Day honoring mothers and motherhood worldwide.",
      "Worldwide", "Celebrates and honors the love, sacrifices, and contributions of mothers.",
      "Gift-giving, cards, special meals, and spending quality time with mothers.", false),

    f("fathers-day", "Father's Day", fatherDayStr, "Social Day", "Global", "Social",
      "Day honoring fathers and fatherhood worldwide.",
      "Worldwide", "Celebrates fathers' contributions to their families and society.",
      "Gift-giving, cards, and activities with fathers.", false),

    f("friendship-day", "Friendship Day", friendDayStr, "Social Day", "Global", "Social",
      "Day celebrating friendship and the bonds between friends.",
      "Worldwide, especially popular in India",
      "Promotes friendship as a force for peace and togetherness.",
      "Exchanging friendship bands, gifts, and spending time with friends.", false),

    f("teachers-day", "Teachers' Day", `${y}-09-05`, "Social Day", "National", "Social",
      "Birthday of Dr. Sarvepalli Radhakrishnan, celebrated as Teachers' Day in India.",
      "All across India, schools and colleges",
      "Honors Dr. Radhakrishnan and all teachers for their contribution to education.",
      "Students organize cultural programs, teachers receive awards, and appreciation events.", false),

    f("disability-day", "International Day of Persons with Disabilities", `${y}-12-03`, "Observance", "Global", "Social",
      "UN day promoting the rights and well-being of persons with disabilities.",
      "Worldwide", "Promotes awareness, understanding, and acceptance of disability issues.",
      "Awareness campaigns, inclusive events, and policy advocacy.", false),

    f("human-rights", "Human Rights Day", `${y}-12-10`, "Observance", "Global", "Social",
      "Commemorates the adoption of the Universal Declaration of Human Rights in 1948.",
      "Worldwide", "Celebrates the fundamental rights and freedoms of all human beings.",
      "Conferences, cultural events, and campaigns for human rights awareness.", false),

    f("un-day", "United Nations Day", `${y}-10-24`, "Observance", "Global", "Social",
      "Anniversary of the UN Charter coming into force in 1945.",
      "Worldwide", "Marks the founding of the United Nations and its mission for global peace.",
      "Concerts, conferences, discussions, and exhibitions about UN work.", false),

    // ===== ENVIRONMENTAL =====
    f("wetlands-day", "World Wetlands Day", `${y}-02-02`, "Observance", "Global", "Environmental",
      "Raises awareness about the importance of wetlands for people and the planet.",
      "Worldwide", "Marks the adoption of the Ramsar Convention on Wetlands in 1971.",
      "Wetland clean-ups, bird watching, educational activities, and nature walks.", false),

    f("wildlife-day", "World Wildlife Day", `${y}-03-03`, "Observance", "Global", "Environmental",
      "UN day celebrating the world's wild animals and plants.",
      "Worldwide", "Raises awareness about the world's wild fauna and flora.",
      "Wildlife documentaries, photo exhibitions, nature walks, and conservation campaigns.", false),

    f("water-day", "World Water Day", `${y}-03-22`, "Observance", "Global", "Environmental",
      "UN day focusing on the importance of freshwater and sustainable water management.",
      "Worldwide", "Highlights the importance of freshwater and advocates for sustainable water resources.",
      "Water conservation campaigns, clean water initiatives, and educational events.", false),

    f("earth-day", "Earth Day", `${y}-04-22`, "Social Day", "Global", "Environmental",
      "Annual event demonstrating support for environmental protection worldwide.",
      "Worldwide", "Promotes awareness and action for environmental protection since 1970.",
      "Tree planting, clean-up drives, environmental seminars, and eco-friendly pledges.", false),

    f("environment-day", "World Environment Day", `${y}-06-05`, "Social Day", "Global", "Environmental",
      "UN's principal vehicle for encouraging awareness and action for environmental protection.",
      "Worldwide", "The biggest annual event for positive environmental action since 1973.",
      "Tree planting, clean-up campaigns, sustainable living initiatives, and awareness programs.", false),

    f("ocean-day", "World Ocean Day", `${y}-06-08`, "Observance", "Global", "Environmental",
      "UN day celebrating the ocean and promoting its conservation.",
      "Worldwide", "Raises awareness about the ocean's role in our daily lives and its conservation.",
      "Beach clean-ups, ocean conservation pledges, educational events, and marine exhibits.", false),

    f("population-day", "World Population Day", `${y}-07-11`, "Observance", "Global", "Environmental",
      "UN day raising awareness about global population issues.",
      "Worldwide", "Focuses attention on the urgency of population-related issues.",
      "Awareness campaigns, seminars on family planning, and population education.", false),

    f("tiger-day", "International Tiger Day", `${y}-07-29`, "Observance", "Global", "Environmental",
      "Global day to raise awareness about tiger conservation.",
      "Worldwide, especially India (home to 70% of wild tigers)",
      "Promotes tiger conservation and highlights the threats to wild tiger populations.",
      "Wildlife campaigns, documentary screenings, fundraisers for tiger reserves.", false),

    f("ozone-day", "World Ozone Day", `${y}-09-16`, "Observance", "Global", "Environmental",
      "Commemorates the signing of the Montreal Protocol for ozone layer protection.",
      "Worldwide", "Celebrates international efforts to protect the ozone layer.",
      "Educational programs on ozone depletion, environmental awareness campaigns.", false),

    f("animal-day", "World Animal Day", `${y}-10-04`, "Observance", "Global", "Environmental",
      "International day of action for animal rights and welfare.",
      "Worldwide", "Promotes action for animal rights and welfare worldwide.",
      "Animal adoption drives, fundraisers, awareness campaigns, and pet care events.", false),

    // ===== HEALTH =====
    f("cancer-day", "World Cancer Day", `${y}-02-04`, "Observance", "Global", "Health",
      "Global day raising awareness and encouraging cancer prevention, detection, and treatment.",
      "Worldwide", "Promotes awareness about cancer prevention and treatment.",
      "Health camps, awareness walks, fundraisers, and educational seminars.", false),

    f("health-day", "World Health Day", `${y}-04-07`, "Observance", "Global", "Health",
      "WHO day drawing attention to a specific health topic of global concern each year.",
      "Worldwide", "Highlights a health priority each year to promote universal health coverage.",
      "Health camps, vaccination drives, awareness campaigns, and free medical check-ups.", false),

    f("malaria-day", "World Malaria Day", `${y}-04-25`, "Observance", "Global", "Health",
      "International day recognizing global efforts to control malaria.",
      "Worldwide", "Highlights the need for continued investment in malaria prevention and treatment.",
      "Distribution of mosquito nets, awareness campaigns, and medical outreach.", false),

    f("no-tobacco", "World No Tobacco Day", `${y}-05-31`, "Observance", "Global", "Health",
      "WHO day encouraging abstinence from tobacco and highlighting associated health risks.",
      "Worldwide", "Highlights health risks associated with tobacco use and advocates for effective policies.",
      "Anti-smoking campaigns, health pledges, and public awareness drives.", false),

    f("blood-donor", "World Blood Donor Day", `${y}-06-14`, "Observance", "Global", "Health",
      "WHO day thanking blood donors and raising awareness about the need for safe blood.",
      "Worldwide", "Recognizes voluntary blood donors and encourages more people to donate blood.",
      "Blood donation camps, awareness campaigns, and appreciation events for donors.", false),

    f("yoga-day", "International Yoga Day", `${y}-06-21`, "Social Day", "Global", "Health",
      "UN day celebrating yoga, initiated by India's PM Modi and adopted by the UN in 2014.",
      "Worldwide, originated from India",
      "Promotes the physical and spiritual benefits of yoga globally.",
      "Mass yoga sessions, workshops, yoga competitions, and health awareness programs.", false),

    f("hepatitis-day", "World Hepatitis Day", `${y}-07-28`, "Observance", "Global", "Health",
      "WHO day raising awareness about viral hepatitis.",
      "Worldwide", "Raises awareness about hepatitis B and C, which affect millions worldwide.",
      "Free hepatitis testing, vaccination drives, and awareness campaigns.", false),

    f("mental-health", "World Mental Health Day", `${y}-10-10`, "Observance", "Global", "Health",
      "WHO day raising awareness about mental health issues worldwide.",
      "Worldwide", "Promotes mental health education, awareness, and advocacy against social stigma.",
      "Counseling sessions, awareness walks, workshops, and social media campaigns.", false),

    f("diabetes-day", "World Diabetes Day", `${y}-11-14`, "Observance", "Global", "Health",
      "Global day raising awareness about diabetes.",
      "Worldwide", "Raises awareness about diabetes prevention and management.",
      "Free diabetes screening, health walks, educational seminars, and lighting landmarks blue.", false),

    f("aids-day", "World AIDS Day", `${y}-12-01`, "Observance", "Global", "Health",
      "International day dedicated to raising awareness about HIV/AIDS.",
      "Worldwide", "Promotes awareness about AIDS and mourns those lost to the disease.",
      "Red ribbon campaigns, free HIV testing, candlelight vigils, and awareness marches.", false),

    // ===== CULTURAL =====
    f("vishu", "Vishu", d.vishu, "Festival Day", "Regional", "Cultural",
      "Malayalam New Year celebrated in Kerala with the auspicious Vishukkani.",
      "Kerala", "Marks the beginning of the Malayalam calendar year.",
      "Vishukkani (auspicious sight), Vishukkaineettam (gifts), new clothes, and Sadya feast.", false, ["Kerala"]),

    f("bohag-bihu", "Bohag Bihu (Rongali Bihu)", d.bihu, "Festival Day", "Regional", "Cultural",
      "Assamese New Year marking the onset of the sowing season.",
      "Assam", "Celebrates the Assamese New Year and the spring harvest season.",
      "Bihu dance and music, Gamosa exchange, community feasts, and buffalo fights.", true, ["Assam"]),

    f("teej", "Teej (Hariyali Teej)", d.teej, "Festival Day", "Regional", "Cultural",
      "Festival celebrating the monsoon season and the union of Shiva and Parvati.",
      "Rajasthan, Haryana, UP, Bihar",
      "Celebrates the reunion of Lord Shiva and Goddess Parvati during the monsoon.",
      "Swinging on decorated swings, applying henna, singing Teej songs, and fasting.", false, ["Rajasthan","Haryana","Uttar Pradesh"]),

    f("thrissur-pooram", "Thrissur Pooram", d.thrissur, "Festival Day", "Regional", "Cultural",
      "Kerala's grandest temple festival featuring decorated elephants and fireworks.",
      "Thrissur, Kerala", "One of the most spectacular Hindu temple festivals in Kerala.",
      "Processions of caparisoned elephants, Kudamattam (parasol exchange), Panchavadyam, and fireworks.", false, ["Kerala"]),

    f("rath-yatra", "Jagannath Rath Yatra", d.rath, "Festival Day", "Regional", "Religious",
      "Annual chariot festival of Lord Jagannath in Puri, one of the oldest religious festivals.",
      "Puri (Odisha), and replicated in many cities",
      "Celebrates Lord Jagannath's annual journey to Gundicha Temple.",
      "Pulling three massive chariots through streets, devotional singing, and community feasting.", true, ["Odisha"]),

    f("hemis", "Hemis Festival", d.hemis, "Festival Day", "Regional", "Cultural",
      "Ladakh's biggest monastic festival celebrating Guru Padmasambhava's birth anniversary.",
      "Hemis Monastery, Ladakh",
      "Celebrates the birth of Guru Padmasambhava who brought Buddhism to the Himalayas.",
      "Cham dance (masked dances), thangka display, traditional music, and Buddhist prayers.", false, ["Ladakh"]),

    f("bathukamma", "Bathukamma", d.bathukamma, "Festival Day", "Regional", "Cultural",
      "Telangana's floral festival dedicated to Goddess Gauri, celebrated with flower stacks.",
      "Telangana", "Celebrates life and womanhood with colorful flower arrangements.",
      "Making flower stacks, singing Bathukamma songs, dancing in circles, and immersing flowers in water.", false, ["Telangana"]),

    f("bonalu", "Bonalu", d.bonalu, "Festival Day", "Regional", "Cultural",
      "Telangana festival honoring Goddess Mahakali with offerings and processions.",
      "Hyderabad, Secunderabad, Telangana",
      "Devotional offering to Goddess Mahakali for protecting the city from epidemics.",
      "Women carrying pots of rice cooked with milk (Bonam) to temples, Rangam prophecies, and processions.", false, ["Telangana"]),

    f("hornbill", "Hornbill Festival (Day 1)", `${y}-12-01`, "Festival Day", "Regional", "Cultural",
      "Nagaland's Festival of Festivals showcasing tribal culture, dance, music, and crafts.",
      "Kisama Heritage Village, Kohima, Nagaland",
      "Promotes and preserves Naga tribal culture and heritage.",
      "Traditional Naga dances, indigenous games, tribal food stalls, rock concerts, and handicraft exhibitions.", false, ["Nagaland"]),

    f("pushkar-fair", "Pushkar Camel Fair", `${y}-11-06`, "Festival Day", "Regional", "Cultural",
      "World-famous annual five-day camel and livestock fair in Pushkar, Rajasthan.",
      "Pushkar, Rajasthan",
      "One of the world's largest camel fairs combining trade, culture, and pilgrimage.",
      "Camel trading, races, cultural performances, hot air ballooning, and holy dips in Pushkar Lake.", false, ["Rajasthan"]),

    f("rann-utsav", "Rann Utsav", `${y}-11-01`, "Festival Day", "Regional", "Cultural",
      "Three-month cultural extravaganza at the white salt desert of Kutch, Gujarat.",
      "Rann of Kutch, Gujarat", "Showcases the culture, crafts, and natural beauty of the Kutch region.",
      "Full moon desert walks, folk music and dance, handicraft shopping, and luxury tent stays.", false, ["Gujarat"]),

    // ===== FUN =====
    f("april-fools", "April Fools' Day", `${y}-04-01`, "Social Day", "Global", "Fun",
      "Day of pranks, jokes, and hoaxes celebrated worldwide.",
      "Worldwide", "A tradition of playing practical jokes and spreading hoaxes on April 1st.",
      "Playing pranks on friends, fake news stories, and humorous activities.", false),

    f("laughter-day", "World Laughter Day", laughDayStr, "Social Day", "Global", "Fun",
      "Day promoting world peace through laughter, created by Dr. Madan Kataria.",
      "Worldwide, started in Mumbai, India",
      "Promotes world peace through laughter; founded by the laughter yoga movement.",
      "Laughter yoga sessions, comedy shows, and community laughter gatherings.", false),

    f("joke-day", "International Joke Day", `${y}-07-01`, "Social Day", "Global", "Fun",
      "Day dedicated to telling jokes and spreading laughter.",
      "Worldwide", "Celebrates the art of humor and joke-telling.",
      "Sharing jokes, comedy events, and humorous social media posts.", false),

    f("emoji-day", "World Emoji Day", `${y}-07-17`, "Social Day", "Global", "Fun",
      "Day celebrating emojis and their role in digital communication.",
      "Worldwide (digital)", "Celebrates the impact of emojis on modern communication since July 17 is shown on the calendar emoji.",
      "Emoji-themed social media posts, new emoji announcements, and digital celebrations.", false),

    f("pirate-day", "Talk Like a Pirate Day", `${y}-09-19`, "Social Day", "Global", "Fun",
      "Humorous holiday where people talk like pirates for fun.",
      "Worldwide", "A parody holiday created for fun, where everyone speaks in pirate slang.",
      "Speaking in pirate lingo (Ahoy, matey!), dressing as pirates, and themed parties.", false),

    f("halloween", "Halloween", `${y}-10-31`, "Social Day", "Global", "Fun",
      "Spooky holiday with costumes, candy, and celebrations of the supernatural.",
      "Worldwide, especially USA, UK, and growing in Indian cities",
      "Originally a Celtic festival (Samhain), now a celebration of all things spooky and fun.",
      "Costume parties, trick-or-treating, pumpkin carving, and haunted house visits.", false),

    // ===== Additional Notable Days =====
    f("good-governance", "National Good Governance Day", `${y}-12-25`, "Observance", "National", "Political",
      "Commemorates the birthday of former PM Atal Bihari Vajpayee and promotes good governance.",
      "All across India", "Honors Vajpayee's legacy and promotes accountable, citizen-friendly governance.",
      "Government awareness programs and citizen engagement initiatives.", false),
  ];
}

export const SEED_FESTIVALS: Festival[] = [
  ...generateYear(2026),
  ...generateYear(2027),
  ...generateYear(2028),
  ...generateYear(2029),
  ...generateYear(2030),
];
