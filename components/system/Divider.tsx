import * as React from "react";

type Props = {
  label?: string;
  tight?: boolean;
  className?: string;
};

export default function Divider({
  label = "",
  tight = false,
  className = "",
}: Props) {
  return (
    <div className={`bg-[#050505] ${className}`}>
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          tight ? "py-8 md:py-10" : "py-12 md:py-16"
        }`}
      >
        <div className="flex items-center gap-5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          {label ? (
            <div className="rounded-full border border-white/8 bg-black/50 px-3 py-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.30em] text-white/32">
                {label}
              </span>
            </div>
          ) : null}
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}