import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Stripe from "stripe";
import {
  ArrowLeft,
  FileText,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Presentation,
  Globe,
} from "lucide-react";

import Layout from "@/components/Layout";
import NextStepCTA from "@/components/content/NextStepCTA";
import DownloadButton from "@/components/premium/DownloadButton";
import PremiumAssetLaunchButton from "@/components/premium/PremiumAssetLaunchButton";
import PremiumAssetCard from "@/components/premium/PremiumAssetCard";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";
import {
  getPremiumContentById,
  getRelatedPremiumContent,
  type PremiumContentItem,
} from "@/lib/premium/content-registry";

type Props = {
  item: PremiumContentItem | null;
  related: PremiumContentItem[];
  hasAccess: boolean;
  accessState: "PUBLIC" | "NO_ACCESS" | "HAS_ACCESS";
};

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isMarketIntelligenceItem(item: PremiumContentItem): boolean {
  const id = item.id.toLowerCase();
  const title = item.title.toLowerCase();
  const category = String(item.categorySlug || item.category || "").toLowerCase();
  const tags = Array.isArray(item.tags) ? item.tags.join(" ").toLowerCase() : "";

  return (
    id.includes("global-market") ||
    title.includes("market intelligence") ||
    title.includes("market outlook") ||
    category.includes("market") ||
    tags.includes("macro")
  );
}

async function verifyArtifactCheckout(
  sessionId: string | string[] | undefined,
  productCode: string,
): Promise<{ verified: boolean; email: string | null }> {
  if (!sessionId || Array.isArray(sessionId)) return { verified: false, email: null };
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return { verified: false, email: null };

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const email =
    String(session.metadata?.email || session.customer_details?.email || "")
      .trim()
      .toLowerCase() || null;

  return {
    verified:
      session.payment_status === "paid" &&
      session.metadata?.priceCode === productCode &&
      session.metadata?.productCode === productCode,
    email,
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const rawId = typeof ctx.params?.id === "string" ? ctx.params.id : "";
  const id = safeStr(rawId);
  const item = id ? getPremiumContentById(id) : null;

  if (!item) {
    return { notFound: true };
  }

  const related = getRelatedPremiumContent(item.id);
  const isPublic =
    !item.metadata?.allowedTiers?.length ||
    item.metadata.allowedTiers.includes("public");

  const checkoutResult =
    ctx.query.checkout === "success"
      ? await verifyArtifactCheckout(ctx.query.session_id, item.id).catch(() => ({ verified: false, email: null }))
      : { verified: false, email: null };

  let email: string | null =
    typeof ctx.query.email === "string" ? ctx.query.email.trim().toLowerCase() : checkoutResult.email;
  let userId: string | null = null;
  try {
    const { resolveIdentity } = await import("@/lib/auth/resolve-identity");
    const headers = new Headers();
    if (ctx.req.headers.cookie) headers.set("cookie", ctx.req.headers.cookie);
    if (ctx.req.headers.host) headers.set("host", ctx.req.headers.host);
    const fakeReq = new Request(`http://${ctx.req.headers.host ?? "localhost"}${ctx.req.url}`, { headers });
    const identity = await resolveIdentity(fakeReq as any);
    email = identity.email ?? email;
    userId = identity.subjectId ?? null;
  } catch {
    // unauthenticated public browsing remains available
  }

  if (checkoutResult.verified && typeof ctx.query.session_id === "string" && (email || userId)) {
    await ensureEntitlementAfterPayment({
      checkoutSessionId: ctx.query.session_id,
      slug: item.id,
      userId,
      email,
    }).catch(() => null);
  }

  const entitlement = isPublic
    ? { granted: true }
    : await resolveCanonicalEntitlement({ userId, email, slug: item.id });

  return {
    props: {
      item,
      related,
      hasAccess: isPublic || entitlement.granted,
      accessState: isPublic ? "PUBLIC" : entitlement.granted ? "HAS_ACCESS" : "NO_ACCESS",
    },
  };

};

function getAssetType(
  item: PremiumContentItem,
): "brief" | "framework" | "report" | "intelligence" | "editorial" | "toolkit" | "deck" {
  const mime = safeStr(item.asset.mimeType).toLowerCase();
  const cat = String(item.categorySlug || item.category || "").toLowerCase();

  if (mime.includes("presentationml")) return "deck";
  if (cat.includes("editorial")) return "editorial";
  if (cat.includes("framework")) return "framework";
  if (cat.includes("report")) return "report";
  if (cat.includes("toolkit")) return "toolkit";
  if (cat.includes("brief")) return "brief";
  if (cat.includes("market")) return "intelligence";
  return "intelligence";
}

function getFormatLabel(item: PremiumContentItem): string {
  const mime = safeStr(item.asset.mimeType).toLowerCase();
  const filename = safeStr(item.asset.filename).toLowerCase();

  if (mime.includes("presentationml") || filename.endsWith(".pptx")) {
    return "PowerPoint";
  }
  if (mime.includes("pdf") || filename.endsWith(".pdf")) {
    return "PDF";
  }
  if (mime.includes("zip") || filename.endsWith(".zip")) {
    return "ZIP";
  }
  if (mime.includes("wordprocessingml") || filename.endsWith(".docx")) {
    return "DOCX";
  }

  return "Artifact";
}

function getEditionLabel(item: PremiumContentItem): string {
  switch (item.metadata?.editionType) {
    case "public-surface":
      return "Public Surface";
    case "institutional-pdf":
      return "Institutional PDF";
    case "board-deck":
      return "Board Deck";
    default:
      return item.category;
  }
}

function getPrimaryLaunchHref(item: PremiumContentItem): string {
  if (item.metadata?.directDownloadHref) {
    return `/downloads/${item.id}`;
  }

  return item.metadata?.surfaceHref || `/artifacts/${item.id}`;
}

function ArtifactCheckout({ item }: { item: PremiumContentItem }) {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function beginCheckout(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required to attach access.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          priceCode: item.id,
          originPath: `/artifacts/${item.id}`,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.url) throw new Error(data.reason || "Checkout failed");
      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={beginCheckout} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Entitlement email"
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/28"
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#C9A96A]/35 bg-[#C9A96A]/10 px-5 py-3 text-sm font-semibold text-[#D7B77E] transition hover:bg-[#C9A96A]/15 disabled:opacity-50"
      >
        {busy ? "Confirming access" : "Confirm access"}
      </button>
      {error ? <p className="text-xs text-red-300/80">{error}</p> : null}
    </form>
  );
}

export default function ArtifactDetailPage({
  item,
  related,
  hasAccess,
  accessState,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (!item) {
    return (
      <Layout>
        <Head>
          <title>Artifact Not Found | Abraham of London</title>
        </Head>

        <main className="min-h-screen bg-[#050609] px-6 py-24 text-white">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/[0.03] p-10">
            <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/70">
              Intelligence Archives
            </div>
            <h1 className="mt-4 font-serif text-3xl text-white/95">
              Asset not found
            </h1>
            <p className="mt-4 max-w-2xl text-white/65">
              The requested artifact does not exist in the current premium
              registry.
            </p>
            <Link
              href="/artifacts"
              className="mt-8 inline-flex items-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Intelligence Archives
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  const coverImage =
    safeStr(item.metadata?.coverImage) ||
    "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg";

  const classification = item.metadata?.classification || "PUBLIC";
  const formatLabel = getFormatLabel(item);
  const assetType = getAssetType(item);
  const isMarket = isMarketIntelligenceItem(item);

  const tierLabel = item.metadata?.watermarkRequired
    ? "Traceable distribution"
    : item.asset.mimeType?.includes("presentationml")
      ? "Controlled distribution"
      : "Open circulation";

  return (
    <Layout>
      <Head>
        <title>{item.title} | Intelligence Archives | Abraham of London</title>
        <meta name="description" content={item.description} />
      </Head>

      <main className="min-h-screen bg-[#050609] text-white">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.10),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_26%)]" />
          <div className="absolute inset-0 opacity-[0.06] aol-grain" />

          <div className="relative mx-auto max-w-6xl px-6 py-20 md:px-10">
            <div className="mb-8">
              <Link
                href="/artifacts"
                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-white/62 transition hover:bg-white/[0.05]"
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Back to Intelligence Archives
              </Link>
            </div>

            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
                  <div className="relative h-[280px] md:h-[420px]">
                    <img
                      src={coverImage}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                    <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-amber-300/90">
                        {isMarket ? (
                          <>
                            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                            {getEditionLabel(item)}
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            Artifact
                          </>
                        )}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-white/65">
                        {classification}
                      </span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                        {item.metadata?.productLine || item.category}
                      </div>

                      <h1 className="font-serif text-3xl leading-tight text-white/95 md:text-5xl">
                        {item.title}
                      </h1>

                      {item.subtitle ? (
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/68 md:text-base">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-300/75">
                    Asset Briefing
                  </div>

                  <p className="mt-5 text-base leading-8 text-white/70">
                    {item.description}
                  </p>

                  {item.tags.length > 0 ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/55"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {isMarket ? (
                  <div className="mt-8 rounded-[28px] border border-[#C9A96A]/20 bg-[linear-gradient(180deg,rgba(201,169,106,0.08),rgba(255,255,255,0.02))] p-8">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]">
                      Intelligence Line
                    </div>

                    <h2 className="mt-4 font-serif text-2xl text-white/95">
                      Three editions. One product family.
                    </h2>

                    <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
                      The Q1 2026 intelligence line is structured as a public
                      surface edition, an institutional PDF edition, and an
                      executive board deck. Each serves a different reading
                      context without diluting the core signal.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        href="/intelligence/global-market-intelligence-q1-2026"
                        className="inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95"
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        Intelligence surface
                      </Link>

                      <Link
                        href="/artifacts/global-market-intelligence-report-q1-2026"
                        className="inline-flex items-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Institutional PDF
                      </Link>

                      <Link
                        href="/artifacts/global-market-intelligence-board-deck-q1-2026"
                        className="inline-flex items-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
                      >
                        <Presentation className="mr-2 h-4 w-4 text-[#C9A96A]" />
                        Board deck
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-8">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Document ID
                      </div>
                      <div className="mt-2 text-white/82">
                        {item.metadata?.docId || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Revision
                      </div>
                      <div className="mt-2 text-white/82">
                        {item.metadata?.version || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Classification
                      </div>
                      <div className="mt-2 text-white/82">{classification}</div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Format
                      </div>
                      <div className="mt-2 text-white/82">{formatLabel}</div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        File Size
                      </div>
                      <div className="mt-2 text-white/82">
                        {item.fileSize || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Pages
                      </div>
                      <div className="mt-2 text-white/82">
                        {item.asset.pageCount || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
                  <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.24em] text-amber-300/75">
                    Access Layer
                  </div>

                  <div className="space-y-4">
                    {hasAccess ? (
                      <PremiumAssetLaunchButton
                        contentId={item.id}
                        fallbackHref={getPrimaryLaunchHref(item)}
                        variant="primary"
                        className="w-full justify-center"
                      >
                        {accessState === "HAS_ACCESS" ? "Resume current edition" : "Open current edition"}
                      </PremiumAssetLaunchButton>
                    ) : (
                      <ArtifactCheckout item={item} />
                    )}

                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                      {item.metadata?.watermarkRequired ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-300/70" />
                          Traceable distribution
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" />
                          Open circulation
                        </>
                      )}
                    </div>

                    {hasAccess ? (
                      <PremiumAssetLaunchButton
                        contentId={item.id}
                        fallbackHref={getPrimaryLaunchHref(item)}
                        variant="secondary"
                        className="w-full justify-center"
                      >
                        {formatLabel === "PowerPoint" ? (
                          <Presentation className="mr-2 h-4 w-4 text-[#C9A96A]" />
                        ) : (
                          <Scale className="mr-2 h-4 w-4 text-[#C9A96A]" />
                        )}
                        Download {formatLabel}
                      </PremiumAssetLaunchButton>
                    ) : null}
                  </div>
                </div>

                {hasAccess ? (
                  <DownloadButton
                    contentId={item.id}
                    assetTitle={item.title}
                    assetType={assetType}
                    classification={classification}
                    tierLabel={tierLabel}
                    fileName={item.asset.filename || `${item.id}.bin`}
                    maxDownloads={item.metadata?.maxDownloads || 1}
                    usedCount={0}
                  />
                ) : null}

                {isMarket ? (
                  <div className="rounded-[28px] border border-[#C9A96A]/20 bg-white/[0.03] p-8">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]">
                      Product Position
                    </div>
                    <p className="mt-4 text-sm leading-8 text-white/68">
                      This line is structured as a quiet premium product family.
                      Discovery happens through the public surface. Deeper reading
                      happens through the PDF. Executive portability happens through
                      the board deck.
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                      <Lock className="h-3.5 w-3.5 text-[#C9A96A]" />
                      Quiet premium positioning
                    </div>
                  </div>
                ) : null}

                <NextStepCTA surface="intelligence" title="Next step" />
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
            <div className="mb-8 text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/70">
              Related Editions
            </div>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {related.map((relatedItem) => (
                <PremiumAssetCard
                  key={relatedItem.id}
                  id={relatedItem.id}
                  title={relatedItem.title}
                  subtitle={relatedItem.subtitle}
                  description={relatedItem.description}
                  category={relatedItem.category}
                  categorySlug={relatedItem.categorySlug}
                  classification={relatedItem.metadata?.classification || "PUBLIC"}
                  tier={relatedItem.metadata?.allowedTiers?.[0] || "public"}
                  docId={relatedItem.metadata?.docId}
                  version={relatedItem.metadata?.version}
                  fileSize={relatedItem.fileSize}
                  pageCount={relatedItem.asset.pageCount}
                  href={`/artifacts/${relatedItem.id}`}
                  coverImage={
                    safeStr(relatedItem.metadata?.coverImage) ||
                    "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg"
                  }
                  tags={relatedItem.tags}
                  featured={Boolean(relatedItem.featured)}
                  watermarkRequired={Boolean(relatedItem.metadata?.watermarkRequired)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </Layout>
  );
}
