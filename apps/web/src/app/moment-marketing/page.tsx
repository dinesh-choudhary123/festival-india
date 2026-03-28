"use client";

import { useMemo, useState } from "react";
import { Sparkles, TrendingUp, Clock, Zap } from "lucide-react";
import { SEED_FESTIVALS } from "@/lib/seed-data";
import { getDaysUntil, formatDate } from "@/lib/constants";
import { FestivalDetailModal } from "@/components/festivals/FestivalDetailModal";
import type { Festival } from "@/lib/types";

export default function MomentMarketingPage() {
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Festivals in the next 7 days
  const thisWeek = useMemo(() => {
    const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    return SEED_FESTIVALS.filter((f) => f.date >= today && f.date <= weekLater)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [today]);

  // Festivals in the next 30 days
  const thisMonth = useMemo(() => {
    const monthLater = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    return SEED_FESTIVALS.filter((f) => f.date >= today && f.date <= monthLater)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [today]);

  // High-engagement festivals (public holidays + festivals)
  const trending = useMemo(() => {
    return thisMonth.filter(
      (f) => f.is_public_holiday || f.type === "Festival Day" || f.scope === "Global"
    );
  }, [thisMonth]);

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand-orange" size={22} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Moment Marketing</h1>
            <p className="text-sm text-gray-500">
              Capitalize on upcoming festivals for social media engagement
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* This week */}
          <Section
            title="This Week"
            subtitle="Festivals happening in the next 7 days — act now!"
            icon={<Zap className="text-red-500" size={18} />}
            festivals={thisWeek}
            onFestivalClick={setSelectedFestival}
            urgency="high"
          />

          {/* Trending / high-engagement */}
          <Section
            title="High-Engagement Opportunities"
            subtitle="Public holidays & major festivals coming up — plan your content"
            icon={<TrendingUp className="text-orange-500" size={18} />}
            festivals={trending}
            onFestivalClick={setSelectedFestival}
            urgency="medium"
          />

          {/* This month */}
          <Section
            title="Next 30 Days"
            subtitle="Full list of upcoming days to plan your content calendar"
            icon={<Clock className="text-blue-500" size={18} />}
            festivals={thisMonth}
            onFestivalClick={setSelectedFestival}
            urgency="low"
          />
        </div>
      </div>

      {selectedFestival && (
        <FestivalDetailModal
          festival={selectedFestival}
          onClose={() => setSelectedFestival(null)}
          onAddToCalendar={() => {}}
          onMakePost={() => {}}
        />
      )}
    </div>
  );
}

function Section({
  title, subtitle, icon, festivals, onFestivalClick, urgency,
}: {
  title: string; subtitle: string; icon: React.ReactNode;
  festivals: Festival[]; onFestivalClick: (f: Festival) => void;
  urgency: "high" | "medium" | "low";
}) {
  const borderColor = urgency === "high" ? "border-l-red-500" : urgency === "medium" ? "border-l-orange-500" : "border-l-blue-500";

  if (festivals.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} p-5`}>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="text-sm text-gray-400">No festivals in this window</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} p-5`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {festivals.length}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
      <div className="space-y-2">
        {festivals.map((f) => {
          const days = getDaysUntil(f.date);
          return (
            <button
              key={f.id}
              onClick={() => onFestivalClick(f)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="text-center w-12 shrink-0">
                  <div className="text-lg font-bold text-brand-orange">{days}</div>
                  <div className="text-[10px] text-gray-400">days</div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(f.date)} · {f.category} · {f.scope}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                f.type === "Festival Day" ? "bg-orange-100 text-orange-700" :
                f.type === "Social Day" ? "bg-blue-100 text-blue-700" :
                "bg-purple-100 text-purple-700"
              }`}>
                {f.type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
