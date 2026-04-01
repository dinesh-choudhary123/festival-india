import { NextRequest, NextResponse } from "next/server";

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "instagram";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("facebook.com") || u.includes("fb.com") || u.includes("fb.watch")) return "facebook";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "other";
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /watch\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchYoutubeMetrics(url: string) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return { error: "Could not extract YouTube video ID" };

  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(watchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!res.ok) return { error: "Could not fetch YouTube page" };
    const html = await res.text();

    // Extract view count — YouTube embeds this in multiple JSON structures
    let views: number | undefined;
    let likes: number | undefined;
    let comments: number | undefined;
    let title: string | undefined;

    // Pattern 1: viewCount in videoViewCountRenderer
    const viewMatch1 = html.match(
      /"viewCount":\{"videoViewCountRenderer":\{"viewCount":\{"simpleText":"([\d,]+)/
    );
    if (viewMatch1) views = parseInt(viewMatch1[1].replace(/,/g, ""), 10);

    // Pattern 2: viewCount as plain number in ytInitialData
    if (!views) {
      const viewMatch2 = html.match(/"viewCount":"(\d+)"/);
      if (viewMatch2) views = parseInt(viewMatch2[1], 10);
    }

    // Pattern 3: interactionCount (schema.org)
    if (!views) {
      const viewMatch3 = html.match(/"interactionCount":"(\d+)"/);
      if (viewMatch3) views = parseInt(viewMatch3[1], 10);
    }

    // Like count — YouTube hid exact counts in 2021 but still embeds in some formats
    const likeMatch1 = html.match(/"label":"([\d,]+) likes"/);
    if (likeMatch1) likes = parseInt(likeMatch1[1].replace(/,/g, ""), 10);

    if (!likes) {
      const likeMatch2 = html.match(/"defaultText":\{"accessibility":\{"accessibilityData":\{"label":"([\d,]+) likes"/);
      if (likeMatch2) likes = parseInt(likeMatch2[1].replace(/,/g, ""), 10);
    }

    // Comment count
    const commentMatch = html.match(/"commentCount":"(\d+)"/);
    if (commentMatch) comments = parseInt(commentMatch[1], 10);

    // Title
    const titleMatch = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
    if (titleMatch) title = titleMatch[1];

    if (!title) {
      const titleMatch2 = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch2) title = titleMatch2[1].replace(" - YouTube", "").trim();
    }

    return {
      platform: "youtube",
      videoId,
      title,
      metrics: {
        views,
        likes,
        comments,
      },
    };
  } catch (err) {
    return { error: "Failed to fetch YouTube data" };
  }
}

async function fetchInstagramMetrics(url: string) {
  try {
    // Instagram oEmbed — gives basic info (no engagement metrics due to API restrictions)
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&omitscript=true`;
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json() as { author_name?: string; title?: string };
      return {
        platform: "instagram",
        title: data.title || "",
        author: data.author_name || "",
        metrics: {},
        note: "Instagram does not expose public engagement metrics via API. Please enter likes/comments/views manually from the post.",
      };
    }
    return {
      platform: "instagram",
      metrics: {},
      note: "Could not fetch Instagram data. Please enter metrics manually.",
    };
  } catch {
    return {
      platform: "instagram",
      metrics: {},
      note: "Could not fetch Instagram data. Please enter metrics manually.",
    };
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  const platform = detectPlatform(url);

  try {
    if (platform === "youtube") {
      const result = await fetchYoutubeMetrics(url);
      return NextResponse.json(result);
    }

    if (platform === "instagram") {
      const result = await fetchInstagramMetrics(url);
      return NextResponse.json(result);
    }

    // Twitter, Facebook, others — cannot scrape due to auth walls
    return NextResponse.json({
      platform,
      metrics: {},
      note: `${platform.charAt(0).toUpperCase() + platform.slice(1)} does not allow public metric fetching. Please enter likes/comments/views manually.`,
    });
  } catch {
    return NextResponse.json({ error: "Unexpected error fetching metrics" }, { status: 500 });
  }
}
