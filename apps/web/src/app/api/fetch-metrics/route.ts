import { NextRequest, NextResponse } from "next/server";

// ─── CONFIG ────────────────────────────────────────────────────────────────
// Set APIFY_TOKEN in your .env.local file — never commit the key to git
const APIFY_TOKEN = process.env.APIFY_TOKEN ?? "";
const APIFY_BASE = "https://api.apify.com/v2";

// ─── HELPERS ───────────────────────────────────────────────────────────────

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "instagram";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("facebook.com") || u.includes("fb.com") || u.includes("fb.watch"))
    return "facebook";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "other";
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function parseShortNumber(s: string): number | undefined {
  if (!s) return undefined;
  const clean = s.replace(/,/g, "").trim();
  const match = clean.match(/^([\d.]+)([KMBkmb]?)$/);
  if (!match) return undefined;
  const n = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  if (suffix === "K") return Math.round(n * 1_000);
  if (suffix === "M") return Math.round(n * 1_000_000);
  if (suffix === "B") return Math.round(n * 1_000_000_000);
  return Math.round(n);
}

// ─── APIFY RUNNER ──────────────────────────────────────────────────────────
/**
 * Starts an Apify actor run, polls until SUCCEEDED (max 90 s), and returns
 * the dataset items.
 */
async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutMs = 90_000
): Promise<Record<string, unknown>[]> {
  // 1. Start the run
  const startRes = await fetch(
    `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!startRes.ok) {
    const txt = await startRes.text().catch(() => startRes.status.toString());
    throw new Error(`Apify actor start failed (${startRes.status}): ${txt}`);
  }

  const startData = (await startRes.json()) as { data: { id: string } };
  const runId = startData.data.id;

  // 2. Poll for completion
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4_000)); // wait 4 s between polls

    const statusRes = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const statusData = (await statusRes.json()) as {
      data: { status: string };
    };
    const status = statusData.data.status;

    if (status === "SUCCEEDED") {
      // 3. Fetch dataset items
      const itemsRes = await fetch(
        `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&clean=true`
      );
      return (await itemsRes.json()) as Record<string, unknown>[];
    }

    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
      throw new Error(`Apify actor run ${status}`);
    }
    // status is RUNNING/READY — keep polling
  }

  throw new Error("Apify actor timed out after 90 s");
}

// ─── YOUTUBE (fast HTML scraping — no actor needed) ────────────────────────
async function fetchYoutubeMetrics(url: string) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return { error: "Could not extract YouTube video ID" };

  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(watchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
    });

    if (!res.ok) return { error: `YouTube returned ${res.status}` };
    const html = await res.text();

    let views: number | undefined;
    let likes: number | undefined;
    let comments: number | undefined;
    let title: string | undefined;

    // Views
    const v1 = html.match(/"viewCount":"(\d+)"/);
    if (v1) views = parseInt(v1[1], 10);
    if (!views) {
      const v2 = html.match(
        /"videoViewCountRenderer":\{"viewCount":\{"simpleText":"([\d,]+)/
      );
      if (v2) views = parseInt(v2[1].replace(/,/g, ""), 10);
    }
    if (!views) {
      const v3 = html.match(/"interactionCount"\s*:\s*"(\d+)"/);
      if (v3) views = parseInt(v3[1], 10);
    }

    // Likes (accessibility label: "544,140 likes" or "1.2M likes")
    const l1 = html.match(/"label"\s*:\s*"([\d,]+)\s+likes"/i);
    if (l1) likes = parseInt(l1[1].replace(/,/g, ""), 10);
    if (!likes) {
      const l2 = html.match(/"label"\s*:\s*"([\d.,]+[KMBkmb]?)\s+likes"/i);
      if (l2) likes = parseShortNumber(l2[1]);
    }
    if (!likes) {
      const l3 = html.match(
        /"defaultText":\{"accessibility":\{"accessibilityData":\{"label":"([\d,]+)\s+likes"/
      );
      if (l3) likes = parseInt(l3[1].replace(/,/g, ""), 10);
    }
    if (!likes) {
      const l4 = html.match(/"likeCount"\s*:\s*"?(\d+)"?/);
      if (l4) likes = parseInt(l4[1], 10);
    }

    // Comments
    const c1 = html.match(/"commentCount"\s*:\s*"?(\d+)"?/);
    if (c1) comments = parseInt(c1[1], 10);

    // Title
    const t1 = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
    if (t1) title = t1[1];
    if (!title) {
      const t2 = html.match(/<title>([^<]+)<\/title>/);
      if (t2) title = t2[1].replace(/ - YouTube$/, "").trim();
    }

    return { platform: "youtube", videoId, title, metrics: { views, likes, comments } };
  } catch (err) {
    return { error: String(err) };
  }
}

// ─── INSTAGRAM via Apify ───────────────────────────────────────────────────
async function fetchInstagramMetrics(url: string) {
  try {
    const items = await runApifyActor("apify/instagram-scraper", {
      directUrls: [url],
      resultsType: "posts",
      resultsLimit: 1,
      addParentData: false,
      // Use residential proxies — best chance to bypass Instagram blocks
      proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
    });

    if (!items || items.length === 0) {
      return {
        platform: "instagram",
        metrics: {},
        note: "No data returned by Apify — the post may be private or deleted.",
      };
    }

    const post = items[0];

    // Apify returns {error:"restricted_page"} when Instagram blocks access
    if (post.error) {
      return {
        platform: "instagram",
        metrics: {},
        note:
          "Instagram is blocking automated access to this post's metrics. This is a platform-level restriction — please open the post and enter likes, comments, and views manually.",
      };
    }

    const likes =
      typeof post.likesCount === "number" ? post.likesCount : undefined;
    const comments =
      typeof post.commentsCount === "number" ? post.commentsCount : undefined;
    const views =
      typeof post.videoViewCount === "number"
        ? post.videoViewCount
        : typeof post.videoPlayCount === "number"
        ? post.videoPlayCount
        : undefined;

    // If all values are undefined, metrics aren't accessible
    if (likes === undefined && comments === undefined && views === undefined) {
      return {
        platform: "instagram",
        metrics: {},
        note:
          "Instagram is blocking metric access for this post. Please enter likes, comments, and views manually from the post page.",
      };
    }

    return { platform: "instagram", metrics: { likes, comments, views } };
  } catch (err) {
    return {
      platform: "instagram",
      metrics: {},
      note: `Apify fetch failed: ${String(err)}. Please enter metrics manually.`,
    };
  }
}

// ─── TWITTER / X via Apify ─────────────────────────────────────────────────
async function fetchTwitterMetrics(url: string) {
  try {
    const items = await runApifyActor("quacker/twitter-scraper", {
      startUrls: [{ url }],
      maxItems: 1,
      addUserInfo: false,
    });

    if (!items || items.length === 0) {
      return {
        platform: "twitter",
        metrics: {},
        note: "No data found for this tweet — it may be private or deleted.",
      };
    }

    const tweet = items[0];
    if (tweet.error) {
      return {
        platform: "twitter",
        metrics: {},
        note: "Twitter/X is blocking access to this post's metrics. Please enter manually.",
      };
    }

    const likes =
      typeof tweet.likeCount === "number"
        ? tweet.likeCount
        : typeof tweet.favorite_count === "number"
        ? tweet.favorite_count
        : undefined;
    const comments =
      typeof tweet.replyCount === "number"
        ? tweet.replyCount
        : typeof tweet.reply_count === "number"
        ? tweet.reply_count
        : undefined;
    const shares =
      typeof tweet.retweetCount === "number"
        ? tweet.retweetCount
        : typeof tweet.retweet_count === "number"
        ? tweet.retweet_count
        : undefined;
    const views =
      typeof tweet.viewCount === "number" ? tweet.viewCount : undefined;

    return { platform: "twitter", metrics: { likes, comments, shares, views } };
  } catch (err) {
    return {
      platform: "twitter",
      metrics: {},
      note: `Twitter fetch failed: ${String(err)}. Please enter metrics manually.`,
    };
  }
}

// ─── FACEBOOK via Apify ────────────────────────────────────────────────────
async function fetchFacebookMetrics(url: string) {
  try {
    const items = await runApifyActor("apify/facebook-posts-scraper", {
      startUrls: [{ url }],
      maxPosts: 1,
      includeComments: false,
    });

    if (!items || items.length === 0) {
      return {
        platform: "facebook",
        metrics: {},
        note: "No data found for this Facebook post — it may be private or deleted.",
      };
    }

    const post = items[0];
    if (post.error) {
      return {
        platform: "facebook",
        metrics: {},
        note: "Facebook is blocking access to this post's metrics. Please enter manually.",
      };
    }

    const likes =
      typeof post.likes === "number"
        ? post.likes
        : typeof post.reactions === "number"
        ? post.reactions
        : undefined;
    const comments =
      typeof post.comments === "number" ? post.comments : undefined;
    const shares =
      typeof post.shares === "number" ? post.shares : undefined;
    const views =
      typeof post.videoViews === "number" ? post.videoViews : undefined;

    return { platform: "facebook", metrics: { likes, comments, shares, views } };
  } catch (err) {
    return {
      platform: "facebook",
      metrics: {},
      note: `Facebook fetch failed: ${String(err)}. Please enter metrics manually.`,
    };
  }
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  const platform = detectPlatform(url);

  try {
    if (platform === "youtube") {
      // YouTube uses fast HTML scraping — no Apify token needed
      return NextResponse.json(await fetchYoutubeMetrics(url));
    }

    // All other platforms require Apify
    if (!APIFY_TOKEN) {
      return NextResponse.json({
        platform,
        metrics: {},
        note: "APIFY_TOKEN not configured on this server. Please enter metrics manually.",
      });
    }

    if (platform === "instagram") {
      return NextResponse.json(await fetchInstagramMetrics(url));
    }
    if (platform === "twitter") {
      return NextResponse.json(await fetchTwitterMetrics(url));
    }
    if (platform === "facebook") {
      return NextResponse.json(await fetchFacebookMetrics(url));
    }

    return NextResponse.json({
      platform,
      metrics: {},
      note: "Platform not supported for auto-fetch. Please enter metrics manually.",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
