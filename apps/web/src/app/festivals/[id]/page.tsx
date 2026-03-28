"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, HelpCircle, PartyPopper, CalendarPlus,
  Pencil, Globe, Clock, Share2,
} from "lucide-react";
import { SEED_FESTIVALS } from "@/lib/seed-data";
import { TypeBadge, ScopeBadge } from "@/components/festivals/FestivalBadge";
import { formatDate, getDaysUntil } from "@/lib/constants";

export default function FestivalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const festival = useMemo(
    () => SEED_FESTIVALS.find((f) => f.id === id) || null,
    [id]
  );

  if (!festival) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <p className="text-lg font-medium text-gray-900">Festival not found</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-brand-orange hover:underline"
        >
          Go back to calendar
        </button>
      </div>
    );
  }

  const daysUntil = getDaysUntil(festival.date);
  const isPast = daysUntil < 0;
  const isToday = daysUntil === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-3xl mx-auto py-8 px-6">
          {/* Hero */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 text-white mb-6">
            <h1 className="text-3xl font-bold">{festival.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="text-white/90">{formatDate(festival.date)} ({festival.day})</span>
              <TypeBadge type={festival.type} />
              <ScopeBadge scope={festival.scope} />
            </div>
            <div className="mt-4">
              {isToday ? (
                <span className="inline-flex items-center gap-1.5 bg-white/20 px-4 py-2 rounded-full text-sm">
                  <PartyPopper size={16} /> Today!
                </span>
              ) : isPast ? (
                <span className="text-white/70 text-sm">{Math.abs(daysUntil)} days ago</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-white/20 px-4 py-2 rounded-full text-sm">
                  <Clock size={16} /> {daysUntil} days to go
                </span>
              )}
            </div>
          </div>

          {/* Info cards */}
          <div className="space-y-4">
            {festival.description && (
              <InfoCard title="About" icon={<Globe size={18} className="text-orange-500" />}>
                {festival.description}
              </InfoCard>
            )}

            {festival.where_celebrated && (
              <InfoCard title="Where it is celebrated" icon={<MapPin size={18} className="text-red-500" />}>
                {festival.where_celebrated}
              </InfoCard>
            )}

            {festival.why_celebrated && (
              <InfoCard title="Why it is celebrated" icon={<HelpCircle size={18} className="text-blue-500" />}>
                {festival.why_celebrated}
              </InfoCard>
            )}

            {festival.how_celebrated && (
              <InfoCard title="How it is celebrated" icon={<PartyPopper size={18} className="text-pink-500" />}>
                {festival.how_celebrated}
              </InfoCard>
            )}
          </div>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              {festival.category}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              {festival.scope}
            </span>
            {festival.is_public_holiday && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                Public Holiday
              </span>
            )}
            {festival.regions.length > 0 && (
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                {festival.regions.join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title, icon, children,
}: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}
