"use client";

import type { FestivalType, FestivalScope } from "@/lib/types";

const TYPE_STYLES: Record<string, string> = {
  "Festival Day": "bg-orange-100 text-orange-800",
  "Social Day": "bg-blue-100 text-blue-700",
  Observance: "bg-purple-100 text-purple-800",
};

const SCOPE_STYLES: Record<string, string> = {
  Global: "text-green-600",
  National: "text-blue-600",
  Regional: "text-orange-600",
};

export function TypeBadge({ type }: { type: FestivalType }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        TYPE_STYLES[type] || "bg-gray-100 text-gray-800"
      }`}
    >
      {type}
    </span>
  );
}

export function ScopeBadge({ scope }: { scope: FestivalScope }) {
  return (
    <span
      className={`text-sm font-medium ${
        SCOPE_STYLES[scope] || "text-gray-600"
      }`}
    >
      {scope}
    </span>
  );
}
