// components/homepage/HeroBanner.tsx
import * as React from "react";
import clsx from "clsx";

type VideoSource = {
  src: string;
  type: "video/webm" | "video/mp4";
  media?: string;
};

export default function HeroBanner({
  poster,
  videoSources,
  heightClassName = "h-[70svh]",
  mobileObjectPositionClass = "object-center",
  overlay,
}: {
  poster: string;
  videoSources: VideoSource[];
  heightClassName?: string;
  mobileObjectPositionClass?: string;
  overlay?: React.ReactNode;
}) {
  return (
    <section className={clsx("relative isolate overflow-hidden", heightClassName)}>
      {/* media */}
      <video
        className={clsx("absolute inset-0 h-full w-full object-cover", mobileObjectPositionClass)}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        {videoSources.map((s, i) => (
          <source key={i} src={s.src} type={s.type} {...(s.media ? { media: s.media } : {})} />
        ))}
      </video>

      {/* top gradient veil for legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.35),transparent_40%,transparent_70%,rgba(0,0,0,.25))]"
      />

      {/* overlay copy (optional) */}
      {overlay ? (
        <div className="relative z-[1] mx-auto flex h-full max-w-7xl items-end px-4 pb-10">
          <div className="text-cream drop-shadow-[0_1px_10px_rgba(0,0,0,.35)]">{overlay}</div>
        </div>
      ) : null}
    </section>
  );
}
