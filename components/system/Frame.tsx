import * as React from "react";

type Props = {
  children: React.ReactNode;
  variant?: "default" | "soft" | "hard" | "gold";
  padding?: "sm" | "md" | "lg";
  className?: string;
};

export default function Frame({
  children,
  variant = "default",
  padding = "md",
  className = "",
}: Props) {
  const pad =
    padding === "sm"
      ? "p-5 md:p-6"
      : padding === "lg"
      ? "p-8 md:p-10 lg:p-12"
      : "p-6 md:p-8";

  const chrome =
    variant === "soft"
      ? "border-white/[0.06] bg-white/[0.02]"
      : variant === "hard"
      ? "border-white/[0.12] bg-black"
      : variant === "gold"
      ? "border-amber-500/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.06)_0%,rgba(255,255,255,0.015)_100%)]"
      : "border-white/[0.08] bg-white/[0.035]";

  return (
    <div
      className={[
        "rounded-[28px] border shadow-[0_30px_80px_-55px_rgba(0,0,0,0.92)]",
        chrome,
        className,
      ].join(" ")}
    >
      <div className={`relative overflow-hidden rounded-[26px] backdrop-blur-md ${pad}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.028),transparent_58%)]" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}