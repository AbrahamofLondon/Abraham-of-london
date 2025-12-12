// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";

import {
  getPublishedDocuments,
  getCardPropsForDocument,
  type ContentlayerCardProps,
} from "@/lib/contentlayer-helper";

// -----------------------------
// Types
// -----------------------------

type UiDocType =
  | "post"
  | "short"
  | "book"
  | "download"
  | "print"
  | "resource"
  | "canon"
  | "event"
  | "strategy";

type UiDoc = ContentlayerCardProps & {
  uiType: UiDocType;
};

// -----------------------------
// Cover resolver (PERMANENT FIX)
// -----------------------------

type CoverKey = `${UiDocType}:${string}`;

/**
 * Only use this for exceptions.
 * Everything else should be resolved automatically by convention.
 *
 * Convention:
 *  - posts   => /assets/images/blog/<slug>.(jpg|webp|png)
 *  - shorts  => /assets/images/blog/<slug>.(jpg|webp|png)  (or /shorts if you create it)
 *  - books   => /assets/images/books/<slug>.(jpg|webp|png)
 *  - canon   => /assets/images/canon/<slug>.(jpg|webp|png)
 *  - downloads => /assets/images/downloads/<slug>.(jpg|webp|png)
 *  - prints  => /assets/images/prints/<slug>.(jpg|webp|png) (or map to downloads art)
 *  - resources => /assets/images/resources/<slug>.(jpg|webp|png) (or map to canon art)
 *  - events  => /assets/images/events/<slug>.(jpg|webp|png)
 *  - strategy => /assets/images/strategy/<slug>.(jpg|webp|png)
 */
const COVER_OVERRIDES: Record<CoverKey, string> = {
  // EVENTS you mentioned are missing in “register” but must exist:
  "event:founders-salon": "/assets/images/events/founders-salon.jpg",
  "event:leadership-workshop": "/assets/images/events/leadership-workshop.jpg",

  // If any canon resources share a single “canon resources” cover:
  "resource:canon-master-index-preview": "/assets/images/canon/canon-resources.jpg",
  "resource:canon-campaign": "/assets/images/canon/canon-campaign-cover.jpg",
  "resource:canon-introduction-letter": "/assets/images/canon/canon-intro-letter-cover.jpg",

  // Add only true exceptions here (wrong filename, legacy file, etc.)
};

const TYPE_FOLDER: Record<UiDocType, string> = {
  post: "/assets/images/blog",
  short: "/assets/images/blog",
  book: "/assets/images/books",
  download: "/assets/images/downloads",
  print: "/assets/images/prints",
  resource: "/assets/images/resources",
  canon: "/assets/images/canon",
  event: "/assets/images/events",
  strategy: "/assets/images/strategy",
};

const TYPE_DEFAULT_COVER: Record<UiDocType, string> = {
  post: "/assets/images/blog/default-blog-cover.jpg",
  short: "/assets/images/blog/default-blog-cover.jpg",
  book: "/assets/images/default-book.jpg",
  download: "/assets/images/downloads/downloadsgrid.jpg",
  print: "/assets/images/downloads/downloadsgrid.jpg",
  resource: "/assets/images/canon/canon-resources.jpg",
  canon: "/assets/images/canon/canon-resources.jpg",
  event: "/assets/images/blog/default-blog-cover.jpg",
  strategy: "/assets/images/blog/default-blog-cover.jpg",
};

function normalisePublicPath(input: string): string {
  let s = String(input || "").trim();
  if (!s) return s;

  // If someone accidentally stored "public/assets/..." then strip leading "public"
  if (s.startsWith("public/")) s = s.replace(/^public\//, "");
  if (!s.startsWith("/")) s = `/${s}`;
  return s;
}

function stripExtension(path: string): string {
  return path.replace(/\.(png|jpg|jpeg|webp)$/i, "");
}

function resolveCover(doc: UiDoc): string {
  const key = `${doc.uiType}:${doc.slug}` as CoverKey;

  // 1) explicit override wins
  const forced = COVER_OVERRIDES[key];
  if (forced) return normalisePublicPath(forced);

  // 2) Use doc image if present (but normalise it)
  const raw = doc.image ? normalisePublicPath(doc.image) : "";
  if (raw) return raw;

  // 3) Convention-based guess by type folder and slug.
  // Try common extensions in order (we can’t fs-check at runtime here;
  // Next/Image will 404 if truly absent, so keep defaults tight).
  const base = `${TYPE_FOLDER[doc.uiType]}/${doc.slug}`;
  // Prefer webp first if you standardise later
  const candidates = [`${base}.webp`, `${base}.jpg`, `${base}.png`];

  // We return the first candidate; if you want ZERO 404s, keep your assets in sync
  // with the convention, and put exceptions into COVER_OVERRIDES.
  return candidates[0] || TYPE_DEFAULT_COVER[doc.uiType];
}

function toUiType(type: string): UiDocType {
  switch (type) {
    case "Post":
      return "post";
    case "Short":
      return "short";
    case "Book":
      return "book";
    case "Download":
      return "download";
    case "Print":
      return "print";
    case "Resource":
      return "resource";
    case "Canon":
      return "canon";
    case "Event":
      return "event";
    case "Strategy":
      return "strategy";
    default:
      return "post";
  }
}

// -----------------------------
// Page
// -----------------------------

type Props = {
  docs: UiDoc[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const docs = getPublishedDocuments()
    .map(getCardPropsForDocument)
    .map((d) => ({
      ...d,
      uiType: toUiType(d.type),
    }))
    // ensure url fallback exists
    .map((d) => ({
      ...d,
      url: d.url || `/content/${d.slug}`,
      image: d.image ? normalisePublicPath(d.image) : null,
    }));

  return {
    props: {
      docs: docs as UiDoc[],
    },
  };
};

const FILTERS: Array<{ key: "all" | UiDocType; label: string }> = [
  { key: "all", label: "All Types" },
  { key: "post", label: "Essays" },
  { key: "short", label: "Shorts" },
  { key: "book", label: "Books" },
  { key: "canon", label: "Canon" },
  { key: "resource", label: "Resources" },
  { key: "download", label: "Downloads" },
  { key: "print", label: "Prints" },
  { key: "event", label: "Events" },
  { key: "strategy", label: "Strategy" },
];

const ContentIndexPage: NextPage<Props> = ({ docs }) => {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | UiDocType>("all");

  const items = React.useMemo(() => {
    const query = q.trim().toLowerCase();

    return docs
      .filter((d) => (filter === "all" ? true : d.uiType === filter))
      .filter((d) => {
        if (!query) return true;
        const text = [
          d.title,
          d.subtitle,
          d.description,
          d.excerpt,
          (d.tags || []).join(" "),
          d.slug,
          d.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(query);
      });
  }, [docs, q, filter]);

  return (
    <Layout title="Content Library">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <header className="mb-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Library
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Content
          </h1>
          <p className="max-w-2xl text-sm text-gray-200">
            Essays, Canon, resources, downloads, prints, events — one unified index.
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition",
                    active
                      ? "bg-gold text-black"
                      : "bg-white/5 text-gray-200 hover:bg-white/10",
                  ].join(" ")}
                  type="button"
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="w-full sm:w-[360px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles, tags, excerpts…"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-gray-100 placeholder:text-gray-400 outline-none focus:border-gold/60"
            />
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((doc) => {
            const cover = resolveCover(doc);

            return (
              <Link
                key={`${doc.uiType}:${doc.slug}`}
                href={doc.url || `/content/${doc.slug}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition hover:border-gold/40"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={cover}
                    alt={doc.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                    {doc.uiType}
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 font-serif text-lg font-semibold text-cream">
                    {doc.title}
                  </h3>

                  {doc.excerpt || doc.description ? (
                    <p className="line-clamp-3 text-sm text-gray-200">
                      {doc.excerpt || doc.description}
                    </p>
                  ) : (
                    <p className="line-clamp-2 text-sm text-gray-400">
                      {doc.slug}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(doc.tags || []).slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-gold/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {items.length === 0 && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-200">
            No matches. Adjust filters or search terms.
          </div>
        )}
      </main>
    </Layout>
  );
};

export default ContentIndexPage;