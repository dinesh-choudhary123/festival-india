"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  PartyPopper,
  Globe,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { SEED_FESTIVALS } from "@/lib/seed-data";
import { getYearRange, getDaysUntil, formatDate } from "@/lib/constants";
import type { Festival } from "@/lib/types";

export default function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const years = getYearRange();

  const yearFestivals = useMemo(
    () => SEED_FESTIVALS.filter((f) => f.year === year),
    [year]
  );

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byScope: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byMonth: Record<number, number> = {};

    for (const f of yearFestivals) {
      byType[f.type] = (byType[f.type] || 0) + 1;
      byScope[f.scope] = (byScope[f.scope] || 0) + 1;
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
      const month = parseInt(f.date.split("-")[1], 10);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    return { byType, byScope, byCategory, byMonth, total: yearFestivals.length };
  }, [yearFestivals]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return SEED_FESTIVALS.filter((f) => f.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, []);

  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const maxMonthCount = Math.max(...Object.values(stats.byMonth), 1);

  const TYPE_COLORS: Record<string, string> = {
    "Festival Day": "bg-orange-500",
    "Social Day": "bg-blue-500",
    "Observance": "bg-purple-500",
  };

  const SCOPE_COLORS: Record<string, string> = {
    "Global": "bg-green-500",
    "National": "bg-blue-500",
    "Regional": "bg-orange-500",
  };

  const CAT_COLORS: Record<string, string> = {
    Religious: "bg-purple-500", Cultural: "bg-orange-500", Environmental: "bg-green-500",
    Health: "bg-red-500", Social: "bg-blue-500", Political: "bg-gray-700", Fun: "bg-pink-500",
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Festival analytics & insights</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="filter-select"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </header>

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Top stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<CalendarDays className="text-orange-500" size={22} />}
              label="Total Days"
              value={stats.total}
              bg="bg-orange-50"
            />
            <StatCard
              icon={<PartyPopper className="text-blue-500" size={22} />}
              label="Festival Days"
              value={stats.byType["Festival Day"] || 0}
              bg="bg-blue-50"
            />
            <StatCard
              icon={<Globe className="text-green-500" size={22} />}
              label="Global Events"
              value={stats.byScope["Global"] || 0}
              bg="bg-green-50"
            />
            <StatCard
              icon={<TrendingUp className="text-purple-500" size={22} />}
              label="Categories"
              value={Object.keys(stats.byCategory).length}
              bg="bg-purple-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly distribution bar chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-gray-400" />
                <h3 className="font-semibold text-gray-900">Monthly Distribution</h3>
              </div>
              <div className="flex items-end gap-2 h-40">
                {MONTHS_SHORT.map((m, i) => {
                  const count = stats.byMonth[i + 1] || 0;
                  const height = (count / maxMonthCount) * 100;
                  return (
                    <div key={m} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500 font-medium">{count}</span>
                      <div
                        className="w-full bg-brand-orange/80 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-[10px] text-gray-400">{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming festivals */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Upcoming Next</h3>
              <div className="space-y-3">
                {upcoming.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(f.date)}</p>
                    </div>
                    <span className="text-xs font-medium text-brand-orange whitespace-nowrap ml-2">
                      {getDaysUntil(f.date)}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Breakdowns row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BreakdownCard title="By Type" data={stats.byType} colors={TYPE_COLORS} total={stats.total} />
            <BreakdownCard title="By Scope" data={stats.byScope} colors={SCOPE_COLORS} total={stats.total} />
            <BreakdownCard title="By Category" data={stats.byCategory} colors={CAT_COLORS} total={stats.total} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, bg,
}: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function BreakdownCard({
  title, data, colors, total,
}: { title: string; data: Record<string, number>; colors: Record<string, string>; total: number }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {sorted.map(([key, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-700 font-medium">{key}</span>
                <span className="text-gray-400">{count} ({pct}%)</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors[key] || "bg-gray-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
