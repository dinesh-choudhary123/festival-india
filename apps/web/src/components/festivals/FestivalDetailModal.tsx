"use client";

import {
  X,
  MapPin,
  HelpCircle,
  PartyPopper,
  CalendarPlus,
  Pencil,
  Globe,
  Clock,
  Share2,
} from "lucide-react";
import { TypeBadge, ScopeBadge } from "./FestivalBadge";
import { formatDate, getDaysUntil } from "@/lib/constants";
import type { Festival } from "@/lib/types";

interface FestivalDetailModalProps {
  festival: Festival;
  onClose: () => void;
  onAddToCalendar: (festival: Festival) => void;
  onMakePost: (festival: Festival) => void;
}

export function FestivalDetailModal({
  festival,
  onClose,
  onAddToCalendar,
  onMakePost,
}: FestivalDetailModalProps) {
  const daysUntil = getDaysUntil(festival.date);
  const isPast = daysUntil < 0;
  const isToday = daysUntil === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-white pr-8">
            {festival.name}
          </h2>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-white/90 text-sm">
              {formatDate(festival.date)} ({festival.day})
            </span>
            <TypeBadge type={festival.type} />
            <ScopeBadge scope={festival.scope} />
          </div>
          {/* Countdown */}
          <div className="mt-3">
            {isToday ? (
              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                <PartyPopper size={14} />
                Today!
              </span>
            ) : isPast ? (
              <span className="text-white/70 text-sm">
                {Math.abs(daysUntil)} days ago
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                <Clock size={14} />
                {daysUntil} days to go
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Quick info */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
              <Globe size={12} />
              {festival.category}
            </span>
            {festival.is_public_holiday && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full">
                Public Holiday
              </span>
            )}
            {festival.regions && festival.regions.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full">
                <MapPin size={12} />
                {festival.regions.slice(0, 3).join(", ")}
                {festival.regions.length > 3 &&
                  ` +${festival.regions.length - 3} more`}
              </span>
            )}
          </div>

          {/* Description */}
          {festival.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                About
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {festival.description}
              </p>
            </div>
          )}

          {/* Where celebrated */}
          {festival.where_celebrated && (
            <div className="flex gap-3">
              <MapPin
                size={18}
                className="text-orange-500 mt-0.5 shrink-0"
              />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Where it is celebrated
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {festival.where_celebrated}
                </p>
              </div>
            </div>
          )}

          {/* Why celebrated */}
          {festival.why_celebrated && (
            <div className="flex gap-3">
              <HelpCircle
                size={18}
                className="text-blue-500 mt-0.5 shrink-0"
              />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Why it is celebrated
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {festival.why_celebrated}
                </p>
              </div>
            </div>
          )}

          {/* How celebrated */}
          {festival.how_celebrated && (
            <div className="flex gap-3">
              <PartyPopper
                size={18}
                className="text-pink-500 mt-0.5 shrink-0"
              />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  How it is celebrated
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {festival.how_celebrated}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-between">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: festival.name,
                  text: `${festival.name} — ${formatDate(festival.date)}`,
                });
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Share2 size={15} />
            Share
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddToCalendar(festival)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                         text-gray-700 bg-white border border-gray-300 rounded-lg
                         hover:bg-gray-50 transition-colors"
            >
              <CalendarPlus size={15} />
              Add to Calendar
            </button>
            <button
              onClick={() => onMakePost(festival)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                         text-white bg-gray-900 rounded-lg
                         hover:bg-gray-800 transition-colors"
            >
              <Pencil size={15} />
              Make Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
