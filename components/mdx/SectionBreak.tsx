import React from "react";

interface SectionBreakProps {
  variant?: "ornate" | "minimal" | "architectural";
  className?: string;
}

export function SectionBreak({ variant = "ornate", className = "" }: SectionBreakProps) {
  const variants = {
    minimal: (
      <div className="flex items-center justify-center">
        <div className="h-px w-24 bg-neutral-200" />
      </div>
    ),

    architectural: (
      <div className="flex items-center justify-center space-x-3">
        <div className="h-px w-12 bg-[#8A6A2F]/30" />
        <div className="h-1.5 w-1.5 rotate-45 border border-[#8A6A2F]/40 bg-transparent" />
        <div className="h-px w-12 bg-[#8A6A2F]/30" />
      </div>
    ),

    ornate: (
      <div className="relative flex items-center justify-center">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8A6A2F]/30 to-transparent" />
        <span className="mx-6 text-xs tracking-[0.3em] text-[#8A6A2F]/50">
          ✦
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#8A6A2F]/30 to-transparent" />
      </div>
    ),
  };

  return (
    <div className={`my-16 ${className}`} aria-hidden="true">
      {variants[variant]}
    </div>
  );
}