import Image from "next/image";
import React from "react";

type Props = {
  title: string;
  coverImage?: string | null;
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "center" | "left" | "right";
};

const normalize = (src?: string | null) =>
  !src || /^https?:\/\//i.test(src) ? undefined : src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;

export default function PostHero({
  title,
  coverImage,
  coverAspect = "book",
  coverFit,
  coverPosition = "center",
}: Props) {
  const src = normalize(coverImage);
  if (!src) return null;

  const aspect =
    coverAspect === "wide" ? "aspect-[16/9]" :
    coverAspect === "square" ? "aspect-[1/1]" :
    "aspect-[3/4]"; // book default

  const fit =
    (coverFit ?? (coverAspect === "book" ? "contain" : "cover")) === "contain"
      ? "object-contain"
      : "object-cover";

  const pos =
    coverPosition === "left" ? "object-left" :
    coverPosition === "right" ? "object-right" :
    "object-center";

  const bg = fit === "object-contain" ? "bg-[rgb(10,37,30)]/90" : "bg-transparent";

  return (
    <div className={`mx-auto mb-10 w-full max-w-5xl overflow-hidden rounded-2xl ${aspect} ${bg}`}>
      <Image
        src={src}
        alt={title}
        fill
        sizes="(max-width: 1280px) 100vw, 1200px"
        className={`${fit} ${pos}`}
        priority
      />
    </div>
  );
}
