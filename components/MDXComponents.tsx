import Image from "next/image";
import Link from "next/link";
import type { MDXComponents as MDXComponentsType } from "mdx/types";
import * as React from "react";

import EventJsonLd from "@/components/seo/EventJsonLd";
import PullLine from "@/components/mdx/PullLine";
import Verse from "@/components/mdx/Verse";
import Rule from "@/components/mdx/Rule";
import Note from "@/components/mdx/Note";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import JsonLd from "@/components/mdx/JsonLd";

/* ---------- utils ---------- */
const isInternal = (href = "") => href.startsWith("/") || href.startsWith("#");
function toNumber(v?: number | string) {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}
const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(" ");

/* ---------- small UI helpers for MDX ---------- */
export function HeroEyebrow({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        "mb-3 inline-flex items-center gap-2 rounded-full border border-lightGrey/70 bg-warmWhite/70 px-3 py-1 text-xs tracking-wide uppercase text-[color:var(--color-on-secondary)/0.7]",
        className
      )}
    >
      {children}
    </div>
  );
}

type CalloutTone = "info" | "key" | "caution" | "success";
const toneStyles: Record<CalloutTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100",
  key: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100",
  caution: "border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-100",
};

export function Callout({
  title,
  tone = "info",
  children,
  className,
}: React.PropsWithChildren<{ title?: string; tone?: CalloutTone; className?: string }>) {
  return (
    <div className={cx("my-4 rounded-xl border p-4 shadow-card", toneStyles[tone], className)}>
      {title && <div className="mb-2 font-semibold tracking-wide">{title}</div>}
      <div className="space-y-2 text-[0.95rem] leading-relaxed">{children}</div>
    </div>
  );
}

export function Badge({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span className={cx("inline-flex items-center rounded-full border border-lightGrey bg-warmWhite/70 px-2.5 py-1 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

export function BadgeRow({ items = [] as string[], className }: { items?: string[]; className?: string }) {
  return (
    <div className={cx("my-4 flex flex-wrap items-center gap-2", className)}>
      {items.map((t, i) => (
        <Badge key={i}>{t}</Badge>
      ))}
    </div>
  );
}

export function ShareRow({ text, hashtags }: { text: string; hashtags: string }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags)}`;
  return (
    <div className="my-8">
      <a href={twitterUrl} className="aol-btn text-sm" target="_blank" rel="noopener noreferrer">
        Share on Twitter
      </a>
    </div>
  );
}

/* ---------- MDX <a> ---------- */
const A: MDXComponentsType["a"] = ({ href = "", children, className, title }) => {
  const base =
    "text-forest underline underline-offset-2 hover:text-softGold transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest " +
    "dark:text-softGold dark:hover:text-cream dark:focus-visible:ring-softGold";
  const cls = className ? `${base} ${className}` : base;

  if (isInternal(href)) {
    return (
      <Link href={href} prefetch={false} className={cls} title={title}>
        {children}
      </Link>
    );
  }

  const isHttp = /^https?:\/\//i.test(href);
  const externalProps = isHttp
    ? { target: "_blank", rel: "noopener noreferrer", "aria-label": "Opens in new tab" as const }
    : {};

  return (
    <a href={href} className={cls} title={title} {...externalProps}>
      {children}
    </a>
  );
};

/* ---------- MDX <img> -> next/image ---------- */
type MDXImgProps = Omit<React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>, "src"> & { src?: string };

const Img: React.FC<MDXImgProps> = ({ src, alt = "", className, title, width, height }) => {
  const srcStr = typeof src === "string" ? src : undefined;
  const safeSrc: string = srcStr || "/assets/images/default-blog.jpg";

  const w = toNumber(width);
  const h = toNumber(height);
  const [loaded, setLoaded] = React.useState(false);

  const skeleton = "bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 animate-[shimmer_1.8s_linear_infinite]";
  const altText = alt || (title ? String(title) : "Embedded image");

  return (
    <figure className="my-6">
      {w && h ? (
        <Image
          src={safeSrc}
          alt={altText}
          width={w}
          height={h}
          sizes="(max-width: 768px) 100vw, 800px"
          className={className || "rounded-lg shadow-card object-cover"}
          loading="lazy"
          decoding="async"
          onLoadingComplete={() => setLoaded(true)}
        />
      ) : (
        <span className={`relative block h-96 w-full overflow-hidden rounded-lg shadow-card ${className || ""}`}>
          <Image
            src={safeSrc}
            alt={altText}
            fill
            sizes="100vw"
            className="object-cover"
            loading="lazy"
            decoding="async"
            onLoadingComplete={() => setLoaded(true)}
          />
          {!loaded && (
            <>
              <style jsx>{`
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
              `}</style>
              <span className={`absolute inset-0 ${skeleton}`} aria-hidden="true" />
            </>
          )}
        </span>
      )}
      {title && (
        <figcaption className="mt-2 text-sm text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]">
          {title}
        </figcaption>
      )}
    </figure>
  );
};

/* ---------- YouTube + safe iframe ---------- */
type YouTubeProps = { id?: string; url?: string; title?: string; className?: string; start?: number };

function parseYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  try {
    const u = new URL(urlOrId);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/\/(embed|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}

export const YouTube: React.FC<YouTubeProps> = ({ id, url, title, className, start }) => {
  const videoId = id || parseYouTubeId(url || "");
  if (!videoId) return null;
  const src = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  if (typeof start === "number" && start > 0) src.searchParams.set("start", String(start));

  return (
    <div className={`relative w-full overflow-hidden rounded-lg shadow-card ${className || ""}`} style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={src.toString()}
        title={title || "YouTube video"}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  );
};

type IframeProps = React.ComponentProps<"iframe"> & { className?: string };
const ALLOWED_IFRAME_HOSTS = [
  "www.youtube-nocookie.com",
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "player.vimeo.com",
  "open.spotify.com",
];

const Iframe: React.FC<IframeProps> = ({ src = "", title = "Embedded content", className, ...rest }) => {
  let url: URL | null = null;
  try { url = new URL(src); } catch {}
  const allowed = !!url && ALLOWED_IFRAME_HOSTS.some((h) => url!.hostname.endsWith(h));
  if (!allowed) {
    return (
      <div className="my-6 rounded-md border p-4 text-sm text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]">
        Embedded content blocked for security. Allowed: YouTube, Vimeo, Spotify.
      </div>
    );
  }
  if (url!.hostname.includes("youtube.com") || url!.hostname.includes("youtu.be")) {
    const id = parseYouTubeId(src);
    if (id) return <YouTube id={id} title={title} className={className} />;
  }
  return (
    <div className={`relative w-full overflow-hidden rounded-lg shadow-card ${className || ""}`} style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        {...rest}
      />
    </div>
  );
};

/* ---------- Minimal DownloadCard (to satisfy MDX references) ---------- */
function DownloadCard({
  title,
  href,
  description,
  image,
}: {
  title: string;
  href: string;
  description?: string;
  image?: string;
}) {
  return (
    <a href={href} className="group block rounded-2xl border border-lightGrey bg-white p-4 shadow-card transition hover:shadow-cardHover">
      <div className="flex items-center gap-4">
        {image ? (
          <span className="relative h-16 w-16 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
          </span>
        ) : null}
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-deepCharcoal">{title}</div>
          {description ? <div className="mt-1 line-clamp-2 text-sm text-[color:var(--color-on-secondary)/0.8]">{description}</div> : null}
          <div className="mt-2 text-sm text-softGold">Download →</div>
        </div>
      </div>
    </a>
  );
}

/* ---------- component map ---------- */
const components: MDXComponentsType = {
  a: A,
  img: Img,
  YouTube,
  iframe: Iframe,
  EventJsonLd,
  PullLine,
  Verse,
  Rule,
  Note,
  ResourcesCTA,
  CTA: ResourcesCTA, // legacy alias (MDX may reference <CTA/>)
  JsonLd,            // for JSON-LD injection
  HeroEyebrow,
  Callout,
  Badge,
  BadgeRow,
  ShareRow,
  DownloadCard,

  // Normalize headings: the page owns <h1>
  h1: (props) => <h2 {...props} />,
  // Tighten common blocks
  ul: (props) => <ul className="list-disc pl-6 space-y-2" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 space-y-2" {...props} />,
  p: (props) => <p className="leading-7" {...props} />,
  hr: (props) => <hr className="my-10 border-lightGrey" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-lightGrey pl-4 italic" {...props} />,
};

export default components;
export { components as MDXComponents };
