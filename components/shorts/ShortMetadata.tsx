"use client";

import React from "react";
import { Calendar, Clock, Tag } from "lucide-react";

interface ShortMetadataProps {
  date?: string;
  readingTime?: string;
  tags?: string[];
  className?: string;
}

function formatDate(date?: string): string {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ShortMetadata({
  date,
  readingTime,
  tags = [],
  className = "",
}: ShortMetadataProps) {
  const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];

  if (!date && !readingTime && safeTags.length === 0) return null;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border px-4 py-3",
        "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]",
        "backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.18)]",
        className,
      ].join(" ")}
      aria-label="Short metadata"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/45 to-transparent" />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        {date && (
          <div className="flex items-center gap-2 text-white/58">
            <Calendar className="h-3.5 w-3.5 text-[#C9A96A]/85" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
              Published
            </span>
            <time
              dateTime={date}
              className="text-xs font-medium tracking-[0.02em] text-white/72"
            >
              {formatDate(date)}
            </time>
          </div>
        )}

        {readingTime && (
          <div className="flex items-center gap-2 text-white/58">
            <Clock className="h-3.5 w-3.5 text-[#C9A96A]/85" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
              Read
            </span>
            <span className="text-xs font-medium tracking-[0.02em] text-white/72">
              {readingTime}
            </span>
          </div>
        )}

        {safeTags.length > 0 && (
          <div className="flex items-start gap-2">
            <Tag className="mt-[2px] h-3.5 w-3.5 text-[#C9A96A]/75" />
            <div className="flex flex-wrap gap-2">
              {safeTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/56 transition-all duration-200 hover:border-[#C9A96A]/25 hover:bg-[#C9A96A]/8 hover:text-white/78"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}