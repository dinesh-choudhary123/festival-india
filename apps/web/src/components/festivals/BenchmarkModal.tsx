"use client";

import { useState } from "react";
import { X, Link2, Plus, Trash2, ExternalLink, Pencil } from "lucide-react";
import type { BenchmarkEntry } from "@/lib/types";

interface BenchmarkModalProps {
  festivalName: string;
  benchmarks: BenchmarkEntry[];
  onSave: (benchmarks: BenchmarkEntry[]) => void;
  onClose: () => void;
}

function detectPlatform(url: string): BenchmarkEntry["platform"] {
  const u = url.toLowerCase();
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "instagram";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("facebook.com") || u.includes("fb.com") || u.includes("fb.watch")) return "facebook";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "other";
}

function formatMetric(n?: number): string {
  if (n === undefined || n === null) return "-";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  twitter: "bg-black text-white",
  facebook: "bg-blue-600 text-white",
  youtube: "bg-red-600 text-white",
  other: "bg-gray-600 text-white",
};

const POST_TYPES: { value: BenchmarkEntry["type"]; label: string }[] = [
  { value: "reel", label: "Reel" },
  { value: "post", label: "Post" },
  { value: "story", label: "Story" },
  { value: "video", label: "Video" },
  { value: "tweet", label: "Tweet" },
  { value: "short", label: "Short" },
  { value: "other", label: "Other" },
];

export function BenchmarkModal({ festivalName, benchmarks, onSave, onClose }: BenchmarkModalProps) {
  const [entries, setEntries] = useState<BenchmarkEntry[]>(benchmarks || []);
  const [url, setUrl] = useState("");
  const [postType, setPostType] = useState<BenchmarkEntry["type"]>("post");
  const [brandName, setBrandName] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [views, setViews] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const detectedPlatform = url ? detectPlatform(url) : null;

  async function handleFetchMetrics() {
    if (!url.trim()) return;
    setFetching(true);
    setFetchError("");

    try {
      const res = await fetch(`/api/fetch-metrics?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json() as {
        metrics?: { views?: number; likes?: number; comments?: number; shares?: number };
        note?: string;
        error?: string;
        title?: string;
      };

      if (data.error) {
        setFetchError("⚠️ " + data.error + " — please enter metrics manually.");
        return;
      }

      // Auto-fill whatever metrics were returned
      const fields: string[] = [];
      if (data.metrics?.views !== undefined && data.metrics.views > 0) {
        setViews(String(data.metrics.views));
        fields.push("views");
      }
      if (data.metrics?.likes !== undefined && data.metrics.likes > 0) {
        setLikes(String(data.metrics.likes));
        fields.push("likes");
      }
      if (data.metrics?.comments !== undefined && data.metrics.comments > 0) {
        setComments(String(data.metrics.comments));
        fields.push("comments");
      }
      if (data.metrics?.shares !== undefined && data.metrics.shares > 0) {
        setShares(String(data.metrics.shares));
        fields.push("shares");
      }

      if (fields.length > 0) {
        const missing = ["views", "likes", "comments", "shares"].filter((f) => !fields.includes(f));
        setFetchError(
          `✅ Auto-filled: ${fields.join(", ")}.${missing.length ? ` Please enter ${missing.join(", ")} manually.` : ""}`
        );
      } else if (data.note) {
        setFetchError("ℹ️ " + data.note);
      } else {
        setFetchError("ℹ️ Could not auto-fetch metrics for this platform. Please enter all values manually.");
      }
    } catch {
      setFetchError("⚠️ Network error. Please enter metrics manually.");
    } finally {
      setFetching(false);
    }
  }

  function handleAddEntry() {
    if (!url.trim()) return;
    const entry: BenchmarkEntry = {
      url: url.trim(),
      platform: detectedPlatform || "other",
      type: postType,
      brand_name: brandName.trim(),
      metrics: {
        likes: likes ? parseInt(likes) : undefined,
        comments: comments ? parseInt(comments) : undefined,
        shares: shares ? parseInt(shares) : undefined,
        views: views ? parseInt(views) : undefined,
      },
      added_at: new Date().toISOString(),
    };
    setEntries([...entries, entry]);
    setUrl("");
    setPostType("post");
    setBrandName("");
    setLikes("");
    setComments("");
    setShares("");
    setViews("");
    setFetchError("");
  }

  function handleRemove(idx: number) {
    setEntries(entries.filter((_, i) => i !== idx));
  }

  function handleEdit(idx: number) {
    const entry = entries[idx];
    setUrl(entry.url);
    setPostType(entry.type || "post");
    setBrandName(entry.brand_name || "");
    setLikes(entry.metrics.likes !== undefined ? String(entry.metrics.likes) : "");
    setComments(entry.metrics.comments !== undefined ? String(entry.metrics.comments) : "");
    setShares(entry.metrics.shares !== undefined ? String(entry.metrics.shares) : "");
    setViews(entry.metrics.views !== undefined ? String(entry.metrics.views) : "");
    setFetchError("");
    setEntries(entries.filter((_, i) => i !== idx));
  }

  function buildCurrentEntry(): BenchmarkEntry {
    return {
      url: url.trim(),
      platform: detectedPlatform || "other",
      type: postType,
      brand_name: brandName.trim(),
      metrics: {
        likes: likes ? parseInt(likes) : undefined,
        comments: comments ? parseInt(comments) : undefined,
        shares: shares ? parseInt(shares) : undefined,
        views: views ? parseInt(views) : undefined,
      },
      added_at: new Date().toISOString(),
    };
  }

  function handleSave() {
    const final = url.trim() ? [...entries, buildCurrentEntry()] : entries;
    onSave(final);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Benchmarking</h3>
            <p className="text-sm text-gray-500">{festivalName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Existing entries */}
          {entries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Tracked Posts</h4>
              {entries.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[entry.platform]}`}>
                      {entry.platform}
                    </span>
                    {entry.type && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                        {entry.type}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.brand_name && (
                      <span className="text-xs font-semibold text-gray-800 block">{entry.brand_name}</span>
                    )}
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {entry.url}
                    </a>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      {entry.metrics.likes !== undefined && <span>{formatMetric(entry.metrics.likes)} likes</span>}
                      {entry.metrics.comments !== undefined && <span>{formatMetric(entry.metrics.comments)} comments</span>}
                      {entry.metrics.shares !== undefined && <span>{formatMetric(entry.metrics.shares)} shares</span>}
                      {entry.metrics.views !== undefined && <span>{formatMetric(entry.metrics.views)} views</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleEdit(idx)} className="p-1 text-blue-400 hover:text-blue-600" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleRemove(idx)} className="p-1 text-red-400 hover:text-red-600" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Add Social Media Post</h4>

            {/* Type dropdown */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as BenchmarkEntry["type"])}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="" disabled>Select type</option>
                {POST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Brand Name */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name of the brand</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* URL input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste Instagram, Twitter, Facebook, or YouTube URL..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {url.trim() && (
                <a
                  href={url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-2.5 text-blue-500 hover:text-blue-700 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Open link"
                >
                  <ExternalLink size={15} />
                </a>
              )}
              <button
                onClick={handleFetchMetrics}
                disabled={!url.trim() || fetching}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5"
              >
                {fetching ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Fetching...
                  </>
                ) : "Auto-Fetch"}
              </button>
            </div>

            {detectedPlatform && url && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[detectedPlatform]}`}>
                  {detectedPlatform}
                </span>
                <span className="text-xs text-gray-500">detected</span>
              </div>
            )}

            {fetchError && (
              <p className={`text-xs leading-relaxed ${
                fetchError.startsWith("✅") ? "text-green-600" :
                fetchError.startsWith("ℹ️") ? "text-blue-600" :
                "text-amber-600"
              }`}>
                {fetchError}
              </p>
            )}

            {/* Manual metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Likes</label>
                <input
                  type="number"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Comments</label>
                <input
                  type="number"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Shares</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Views</label>
                <input
                  type="number"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                />
              </div>
            </div>

            <button
              onClick={handleAddEntry}
              disabled={!url.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Add Benchmark
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Benchmarks
          </button>
        </div>
      </div>
    </div>
  );
}
