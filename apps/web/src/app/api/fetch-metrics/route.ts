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
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Parse shorthand like "1.2M" → 1200000 */
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

    // ── VIEWS ─────────────────────────────────────────────────────────
    // Pattern 1: full number in viewCount
    const v1 = html.match(/"viewCount":"(\d+)"/);
    if (v1) views = parseInt(v1[1], 10);

    // Pattern 2: videoViewCountRenderer
    if (!views) {
      const v2 = html.match(/"videoViewCountRenderer":\{"viewCount":\{"simpleText":"([\d,]+)/);
      if (v2) views = parseInt(v2[1].replace(/,/g, ""), 10);
    }

    // Pattern 3: interactionCount in schema.org JSON-LD
    if (!views) {
      const v3 = html.match(/"interactionCount"\s*:\s*"(\d+)"/);
      if (v3) views = parseInt(v3[1], 10);
    }

    // ── LIKES ─────────────────────────────────────────────────────────
    // Pattern 1: "label":"123,456 likes" (accessibility text)
    const l1 = html.match(/"label"\s*:\s*"([\d,]+)\s+likes"/i);
    if (l1) likes = parseInt(l1[1].replace(/,/g, ""), 10);

    // Pattern 2: "label":"1.2M likes" (shorthand)
    if (!likes) {
      const l2 = html.match(/"label"\s*:\s*"([\d.,]+[KMBkmb]?)\s+likes"/i);
      if (l2) likes = parseShortNumber(l2[1]);
    }

    // Pattern 3: toggledText / likeButton accessibility
    if (!likes) {
      const l3 = html.match(/"toggledText".*?"label"\s*:\s*"([\d,]+)\s+likes"/);
      if (l3) likes = parseInt(l3[1].replace(/,/g, ""), 10);
    }

    // Pattern 4: defaultText accessibility for like button
    if (!likes) {
      const l4 = html.match(/"defaultText":\{"accessibility":\{"accessibilityData":\{"label":"([\d,]+)\s+likes"/);
      if (l4) likes = parseInt(l4[1].replace(/,/g, ""), 10);
    }

    // Pattern 5: likeCount plain field
    if (!likes) {
      const l5 = html.match(/"likeCount"\s*:\s*"?(\d+)"?/);
      if (l5) likes = parseInt(l5[1], 10);
    }

    // ── COMMENTS ──────────────────────────────────────────────────────
    // Pattern 1: commentCount
    const c1 = html.match(/"commentCount"\s*:\s*"?(\d+)"?/);
    if (c1) comments = parseInt(c1[1], 10);

    // Pattern 2: commentsCount in header
    if (!comments) {
      const c2 = html.match(/"commentsCount"\s*:\s*"?(\d+)"?/);
      if (c2) comments = parseInt(c2[1], 10);
    }

    // ── TITLE ─────────────────────────────────────────────────────────
    const t1 = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
    if (t1) title = t1[1];
    if (!title) {
      const t2 = html.match(/<title>([^<]+)<\/title>/);
      if (t2) title = t2[1].replace(/ - YouTube$/, "").trim();
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
    return { error: String(err) };
  }
}

function extractInstagramShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

async function fetchInstagramMetrics(url: string) {
  const shortcode = extractInstagramShortcode(url);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: "https://www.instagram.com/",
  };

  // ── Attempt 1: Fetch main post page — parse JSON-LD and window.__additionalDataLoaded ──
  if (shortcode) {
    try {
      const postUrl = `https://www.instagram.com/p/${shortcode}/`;
      const res = await fetch(postUrl, { headers });
      if (res.ok) {
        const html = await res.text();

        let likes: number | undefined;
        let views: number | undefined;
        let comments: number | undefined;

        // JSON-LD structured data (most reliable)
        const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        for (const match of jsonLdMatches) {
          try {
            const ld = JSON.parse(match[1]) as Record<string, unknown>;
            const stats = (ld.interactionStatistic as Array<Record<string, unknown>>) || [];
            for (const stat of stats) {
              const type = String(stat.interactionType || "");
              const count = parseInt(String(stat.userInteractionCount || "0"), 10);
              if (!isNaN(count) && count > 0) {
                if (type.includes("LikeAction")) likes = count;
                else if (type.includes("CommentAction")) comments = count;
                else if (type.includes("WatchAction")) views = count;
              }
            }
          } catch {/* ignore */}
        }

        // window._sharedData (older Instagram pages)
        const sharedMatch = html.match(/window\._sharedData\s*=\s*(\{.*?\});\s*<\/script>/);
        if (sharedMatch) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sd = JSON.parse(sharedMatch[1]) as any;
            const media = sd?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
            if (media) {
              if (!likes) likes = media.edge_media_preview_like?.count;
              if (!comments) comments = media.edge_media_to_parent_comment?.count;
              if (!views) views = media.video_view_count;
            }
          } catch {/* ignore */}
        }

        // Only return if we got real numbers (> 0 indicates actual data, not defaults)
        if (likes || views || comments) {
          return {
            platform: "instagram",
            shortcode,
            metrics: { likes, views, comments },
          };
        }
      }
    } catch {/* continue to next attempt */}
  }

  // ── Attempt 2: Embed page + JSON-LD (no loose regex to avoid false positives) ──
  if (shortcode) {
    try {
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      const res = await fetch(embedUrl, { headers });
      if (res.ok) {
        const html = await res.text();

        let likes: number | undefined;
        let views: number | undefined;
        let comments: number | undefined;

        // JSON-LD only — don't use loose number regex on embed HTML (too many false positives)
        const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        for (const match of jsonLdMatches) {
          try {
            const ld = JSON.parse(match[1]) as Record<string, unknown>;
            const stats = (ld.interactionStatistic as Array<Record<string, unknown>>) || [];
            for (const stat of stats) {
              const type = String(stat.interactionType || "");
              const count = parseInt(String(stat.userInteractionCount || "0"), 10);
              if (!isNaN(count) && count > 0) {
                if (type.includes("LikeAction")) likes = count;
                else if (type.includes("CommentAction")) comments = count;
                else if (type.includes("WatchAction")) views = count;
              }
            }
          } catch {/* ignore */}
        }

        if (likes || views || comments) {
          return {
            platform: "instagram",
            shortcode,
            metrics: { likes, views, comments },
          };
        }
      }
    } catch {/* continue */}
  }

  // ── Fallback: Confirm URL is valid, ask for manual entry ──
  return {
    platform: "instagram",
    shortcode,
    metrics: {},
    note: "Instagram blocks automated metric access. The post URL is valid — please enter likes, comments, and views manually from the post.",
  };
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

    // Twitter / Facebook / others — auth walls block all scraping
    return NextResponse.json({
      platform,
      metrics: {},
      note: `${platform.charAt(0).toUpperCase() + platform.slice(1)} requires authentication to fetch metrics. Please enter likes, comments, views, and shares manually.`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
