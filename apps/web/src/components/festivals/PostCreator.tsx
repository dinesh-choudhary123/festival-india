"use client";

import { useState } from "react";
import {
  X,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import type { Festival } from "@/lib/types";

interface PostCreatorProps {
  festival: Festival;
  onClose: () => void;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, maxLength: 2200 },
  { id: "twitter", label: "Twitter/X", icon: Twitter, maxLength: 280 },
  { id: "facebook", label: "Facebook", icon: Facebook, maxLength: 5000 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, maxLength: 3000 },
] as const;

const TEMPLATES = [
  {
    label: "Festive Greeting",
    generate: (f: Festival) =>
      `Wishing everyone a happy ${f.name}! ${f.description}\n\n#${f.name.replace(/\s+/g, "")} #FestivalOfIndia #India`,
  },
  {
    label: "Did You Know?",
    generate: (f: Festival) =>
      `Did you know? ${f.why_celebrated}\n\n${f.name} is celebrated ${f.where_celebrated}.\n\n#${f.name.replace(/\s+/g, "")} #DidYouKnow`,
  },
  {
    label: "Celebration Post",
    generate: (f: Festival) =>
      `It's ${f.name}! Here's how it's celebrated: ${f.how_celebrated}\n\nWhere: ${f.where_celebrated}\n\n#${f.name.replace(/\s+/g, "")} #Celebrations #India`,
  },
  {
    label: "Brand Post",
    generate: (f: Festival) =>
      `This ${f.name}, we celebrate the spirit of togetherness and joy.\n\n${f.description}\n\nFrom our family to yours — Happy ${f.name}!\n\n#${f.name.replace(/\s+/g, "")} #HappyCelebrations`,
  },
];

export function PostCreator({ festival, onClose }: PostCreatorProps) {
  const [platform, setPlatform] = useState<string>("instagram");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const currentPlatform = PLATFORMS.find((p) => p.id === platform)!;
  const charCount = content.length;
  const isOverLimit = charCount > currentPlatform.maxLength;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
            <p className="text-sm text-gray-500">for {festival.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Platform selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Platform
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      platform === p.id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon size={14} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setContent(t.generate(festival))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700
                             rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors"
                >
                  <Sparkles size={12} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content editor */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder={`Write your ${festival.name} post here...`}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange
                         resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-xs ${
                  isOverLimit ? "text-red-500 font-medium" : "text-gray-400"
                }`}
              >
                {charCount}/{currentPlatform.maxLength}
              </span>
              <button
                onClick={handleCopy}
                disabled={!content}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700
                           disabled:opacity-30 transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                       rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!content || isOverLimit}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-orange rounded-lg
                       hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}
