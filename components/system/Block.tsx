import * as React from "react";

type Props = {
  children: React.ReactNode;
  density?: "tight" | "standard" | "cinematic";
  tone?: "default" | "surface" | "deep";
  id?: string;
  className?: string;
};

export default function Block({
  children,
  density = "standard",
  tone = "default",
  id,
  className = "",
}: Props) {
  const spacing =
    density === "tight"
      ? "py-14 md:py-16 lg:py-20"
      : density === "cinematic"
      ? "py-24 md:py-32 lg:py-40"
      : "py-18 md:py-24 lg:py-28";

  const bg =
    tone === "surface"
      ? "bg-[#070707]"
      : tone === "deep"
      ? "bg-black"
      : "bg-[#050505]";

  return (
    <section id={id} className={`relative ${bg} ${className}`}>
      <div className="pointer-events-none absolute inset-0 aol-grain opacity-[0.035]" />
      <div className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${spacing}`}>
        {children}
      </div>
    </section>
  );
}