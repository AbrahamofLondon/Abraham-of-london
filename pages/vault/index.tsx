import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  assertContentlayerHasDocs,
  getAllDownloads,
  normalizeSlug,
  resolveDocCoverImage,
  resolveDocDownloadHref,
  resolveDocDownloadUrl,
  resolveDocDownloadSizeLabel,
  getAccessLevel,
} from "@/lib/contentlayer-helper";

type VaultItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  fileHref: string | null;
  fileUrl: string | null;
  accessLevel:
    | "public"
    | "inner-circle"
    | "inner-circle-plus"
    | "inner-circle-elite"
    | "private";
  category: string | null;
  size: string | null;
  tags: string[];
  date: string | null;
  featured?: boolean;
};

const VAULT_SLUG_ALLOWLIST = new Set([
  "purpose-pyramid-worksheet",
  "decision-matrix-scorecard",
  "legacy-canvas",
  "board-decision-log-template",
  "operating-cadence-pack",
]);

export const getStaticProps: GetStaticProps<{ items: VaultItem[] }> = async () => {
  assertContentlayerHasDocs("pages/vault/index.tsx getStaticProps");

  const all = getAllDownloads();

  const items: VaultItem[] = all
    .map((d: any) => {
      const slug = normalizeSlug(d);

      if (!VAULT_SLUG_ALLOWLIST.has(slug)) return null;

      const title = d.title ?? "Untitled artifact";

      const excerpt =
        (typeof d.excerpt === "string" && d.excerpt.trim().length ? d.excerpt : null) ??
        (typeof d.description === "string" && d.description.trim().length ? d.description : null);

      const coverImage = resolveDocCoverImage(d) || null;
      const fileUrl = resolveDocDownloadUrl(d);
      const fileHref = resolveDocDownloadHref(d);

      const category =
        (typeof d.category === "string" && d.category.trim().length ? d.category : null) ??
        (typeof d.type === "string" && d.type.trim().length ? d.type : null) ??
        "Vault";

      const size = resolveDocDownloadSizeLabel(d);
      const tags = Array.isArray(d.tags) ? d.tags.filter((t: any) => typeof t === "string") : [];
      const date = typeof d.date === "string" ? d.date : null;
      const featured = Boolean(d.featured);
      const accessLevel = getAccessLevel(d);

      return {
        slug,
        title,
        excerpt,
        coverImage,
        fileHref: fileHref ?? null,
        fileUrl: fileUrl ?? null,
        accessLevel,
        category,
        size,
        tags,
        date,
        featured,
      };
    })
    .filter(Boolean) as VaultItem[];

  // Sort: featured first, then newest
  items.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return { props: { items }, revalidate: 3600 };
};

export default function VaultPage(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const title = "Vault";
  const description =
    "Board-grade artifacts: fillable PDFs, audit-ready templates, and cadence packs — engineered for leaders who execute.";

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
        <link rel="canonical" href="https://www.abrahamoflondon.org/vault" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <header className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-gold/60">
              The Vault
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-cream sm:text-5xl">
              Real artifacts. No fluff.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              If it doesn’t fill clean, print clean, and stand up in a boardroom,
              it doesn’t ship. This Vault is operational — not inspirational.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/downloads"
                className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-xs font-bold uppercase tracking-widest text-black transition-transform hover:scale-105"
              >
                Browse all downloads
              </Link>
              <Link
                href="/inner-circle"
                className="inline-flex items-center justify-center rounded-full border border-gold/30 bg-transparent px-7 py-3 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10 transition-all"
              >
                Unlock Inner Circle
              </Link>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {props.items.map((it) => (
              <div
                key={it.slug}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:border-gold/25 hover:bg-white/[0.05]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    {it.category ?? "Vault"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold/70">
                    {it.accessLevel === "public" ? "Public" : "Gated"}
                  </span>
                </div>

                <h2 className="font-serif text-xl font-semibold text-cream">
                  {it.title}
                </h2>
                {it.excerpt ? (
                  <p className="mt-3 text-sm leading-6 text-gray-300">
                    {it.excerpt}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href={`/downloads/${it.slug}`}
                    className="inline-flex items-center justify-center rounded-xl bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-cream transition-all hover:bg-white/10"
                  >
                    View details
                  </Link>

                  {/* direct download (works for public; gated users will be redirected by your /api/downloads/[slug] flow if you use it) */}
                  {it.fileHref ? (
                    <a
                      href={it.fileHref}
                      className="inline-flex items-center justify-center rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/15"
                    >
                      Download
                    </a>
                  ) : null}

                  {it.size ? (
                    <p className="text-[11px] text-gray-400">Size: {it.size}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-14 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 to-transparent p-8">
            <h3 className="font-serif text-2xl font-semibold text-cream">
              Quality bar
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-200">
              <li>• PDFs are fillable (not image-only).</li>
              <li>• Prints are clean (no blurry raster text).</li>
              <li>• Templates are audit-friendly (versionable, shareable, reusable).</li>
            </ul>
          </section>
        </div>
      </main>
    </Layout>
  );
}