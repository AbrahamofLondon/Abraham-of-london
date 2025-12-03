// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  getAllContent,
  type AnyContent,
} from "@/lib/content";

type ContentKind =
  | "strategic-essays"
  | "curated-volumes"
  | "execution-tools"
  | "live-sessions"
  | "print-editions"
  | "core-resources";

type HubItem = {
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  kind: ContentKind;
  url: string;
};

type Props = {
  items: HubItem[];
};

function resolveKind(doc: AnyContent): ContentKind {
  // Adjust these checks if your _type names differ
  switch ((doc as any)._type) {
    case "Book":
      return "curated-volumes";
    case "Event":
      return "live-sessions";
    case "Download":
      return "execution-tools";
    case "Print":
      return "print-editions";
    case "Resource":
      return "core-resources";
    case "Post":
    default:
      return "strategic-essays";
  }
}

function resolveUrl(item: AnyContent, kind: ContentKind): string {
  const slug = item.slug;
  switch (kind) {
    case "curated-volumes":
      return slug.startsWith("books/") ? `/${slug}` : `/books/${slug}`;
    case "live-sessions":
      return `/events/${slug}`;
    case "execution-tools":
      return `/downloads/${slug}`;
    case "print-editions":
      return `/prints/${slug}`;
    case "core-resources":
      return `/resources/${slug}`;
    case "strategic-essays":
    default:
      return `/${slug}`;
  }
}

const ContentHubPage: NextPage<Props> = ({ items }) => {
  const [activeFilter, setActiveFilter] = React.useState<ContentKind | "all">("all");

  const filtered = React.useMemo(
    () =>
      activeFilter === "all"
        ? items
        : items.filter((i) => i.kind === activeFilter),
    [items, activeFilter]
  );

  const counts = React.useMemo(() => {
    const base: Record<ContentKind, number> = {
      "strategic-essays": 0,
      "curated-volumes": 0,
      "execution-tools": 0,
      "live-sessions": 0,
      "print-editions": 0,
      "core-resources": 0,
    };
    for (const i of items) base[i.kind]++;
    return base;
  }, [items]);

  return (
    <Layout title="Content" pageTitle="Content">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
        {/* HEADER */}
        <header className="mb-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Abraham of London · Canon
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Content Library
          </h1>
          <p className="max-w-2xl text-sm text-gray-300">
            Essays, canon volumes, execution tools, live sessions, and core resources —
            organised for people who are serious about purpose, governance, and legacy.
          </p>
        </header>

        {/* FILTER CHIPS (matching your screenshot categories) */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <ContentFilterChip
            label="All Content"
            count={items.length}
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          <ContentFilterChip
            label="Strategic Essays"
            count={counts["strategic-essays"]}
            active={activeFilter === "strategic-essays"}
            onClick={() => setActiveFilter("strategic-essays")}
          />
          <ContentFilterChip
            label="Curated Volumes"
            count={counts["curated-volumes"]}
            active={activeFilter === "curated-volumes"}
            onClick={() => setActiveFilter("curated-volumes")}
          />
          <ContentFilterChip
            label="Execution Tools"
            count={counts["execution-tools"]}
            active={activeFilter === "execution-tools"}
            onClick={() => setActiveFilter("execution-tools")}
          />
          <ContentFilterChip
            label="Live Sessions"
            count={counts["live-sessions"]}
            active={activeFilter === "live-sessions"}
            onClick={() => setActiveFilter("live-sessions")}
          />
          <ContentFilterChip
            label="Print Editions"
            count={counts["print-editions"]}
            active={activeFilter === "print-editions"}
            onClick={() => setActiveFilter("print-editions")}
          />
          <ContentFilterChip
            label="Core Resources"
            count={counts["core-resources"]}
            active={activeFilter === "core-resources"}
            onClick={() => setActiveFilter("core-resources")}
          />
        </div>

        {/* LIST */}
        {filtered.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gold/30 bg-charcoal-light/40 p-8 text-center text-sm text-gray-200">
            <p>No content in this category yet.</p>
          </section>
        ) : (
          <section className="space-y-4">
            {filtered.map((item) => (
              <article
                key={`${item.kind}:${item.slug}`}
                className="flex flex-col gap-2 rounded-2xl border border-gold/20 bg-charcoal-light/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold/70">
                    {kindLabel(item.kind)}
                  </p>
                  <h2 className="font-serif text-base font-semibold text-cream">
                    <Link href={item.url}>{item.title}</Link>
                  </h2>
                  {item.excerpt && (
                    <p className="max-w-2xl text-xs text-gray-300 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-4 text-[0.7rem] text-gray-400 sm:mt-0 sm:flex-none">
                  {item.date && (
                    <span>
                      {new Date(item.date).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </span>
                  )}
                  <Link
                    href={item.url}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-gold hover:text-gold-light"
                  >
                    Open ↗
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </Layout>
  );
};

type FilterChipProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

const ContentFilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "flex items-center justify-between rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
      active
        ? "bg-gold text-black"
        : "bg-charcoal-light text-gray-200 hover:bg-charcoal",
    ].join(" ")}
  >
    <span>{label}</span>
    <span className="ml-3 rounded-full bg-black/40 px-2 py-0.5 text-[0.65rem]">
      {count}
    </span>
  </button>
);

function kindLabel(kind: ContentKind): string {
  switch (kind) {
    case "strategic-essays":
      return "Strategic Essay";
    case "curated-volumes":
      return "Curated Volume";
    case "execution-tools":
      return "Execution Tool";
    case "live-sessions":
      return "Live Session";
    case "print-editions":
      return "Print Edition";
    case "core-resources":
      return "Core Resource";
  }
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const docs = getAllContent();

  const items: HubItem[] = docs.map((doc) => {
    const kind = resolveKind(doc);
    return {
      slug: doc.slug,
      title: doc.title,
      excerpt: (doc as any).excerpt ?? null,
      date: doc.date ?? null,
      kind,
      url: resolveUrl(doc, kind),
    };
  });

  return {
    props: { items },
    revalidate: 60,
  };
};

export default ContentHubPage;