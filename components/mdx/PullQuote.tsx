import React from "react";

interface PullQuoteProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function PullQuote({ children, align = "center", className = "" }: PullQuoteProps) {
  const alignmentStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const alignmentMargins = {
    left: "ml-0 mr-auto",
    center: "mx-auto",
    right: "ml-auto mr-0",
  };

  return (
    <div className={`my-12 max-w-2xl ${alignmentMargins[align]} ${className}`}>
      <div className="relative">
        <span className="absolute -top-6 left-0 text-5xl font-serif text-[#8A6A2F]/30">
          "
        </span>
        <blockquote
          className={`relative px-6 text-lg font-light leading-relaxed tracking-wide text-neutral-800 ${alignmentStyles[align]}`}
        >
          {children}
        </blockquote>
        <div className="mt-4 flex justify-center">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#8A6A2F]/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}