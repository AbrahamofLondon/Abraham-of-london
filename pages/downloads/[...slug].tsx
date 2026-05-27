import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, FileText, Lock, Shield } from "lucide-react";

import Layout from "@/components/Layout";
import {
  getDownloadManifestEntry,
  getDownloadRedirectUrl,
  normalizeDownloadManifestSlug,
  type DownloadManifestEntry,
} from "@/lib/downloads/download-manifest";
import { getProductByEntitlementSlug } from "@/lib/commercial/catalog";

const GOLD = "#C9A96E";

type Props = {
  entry: DownloadManifestEntry;
  redirectUrl: string | null;
  price: { display: string; justification: string } | null;
};

const ACCESS_LABEL: Record<DownloadManifestEntry["accessLevel"], string> = {
  public: "Available now",
  inner_circle: "Included in Inner Circle",
  paid: "Unlock access",
  restricted: "Request access required",
};

const Page: NextPage<Props> = ({ entry, redirectUrl, price }) => {
  const isPublic = entry.isPublic;
  const accessLabel = price ? `${price.display} - Unlock access` : ACCESS_LABEL[entry.accessLevel];

  return (
    <Layout
      title={`${entry.title} | Abraham of London`}
      description={`${entry.title} is a governed Abraham of London decision asset.`}
      canonicalUrl={`/downloads/${entry.slug}`}
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
      </Head>

      <main className="min-h-screen px-6 py-16 md:py-24" style={{ backgroundColor: "var(--ds-background)", color: "var(--ds-text)" }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-2 flex items-center gap-3">
            <span className="h-px w-8" style={{ backgroundColor: `${GOLD}50` }} />
            <span className="font-mono uppercase" style={{ fontSize: "8px", letterSpacing: "0.34em", color: `${GOLD}90` }}>
              {entry.fileType.toUpperCase()} Asset
            </span>
          </div>

          <h1 className="font-['Cormorant_Garamond',Georgia,serif] font-light" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.05 }}>
            {entry.title}
          </h1>

          <p className="mt-4 max-w-[56ch]" style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--ds-text-muted)" }}>
            This asset is delivered through the static media layer. Dynamic runtime is used only for entitlement checks where required.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border p-5" style={{ borderColor: `${GOLD}25`, backgroundColor: `${GOLD}08` }}>
            <div className="flex items-center gap-3">
              {isPublic ? (
                <FileText className="h-4 w-4" style={{ color: `${GOLD}CC` }} />
              ) : (
                <Lock className="h-4 w-4" style={{ color: `${GOLD}CC` }} />
              )}
              <span className="font-mono uppercase" style={{ fontSize: "8px", letterSpacing: "0.28em", color: `${GOLD}CC` }}>
                {accessLabel}
              </span>
            </div>

            {isPublic && redirectUrl ? (
              <a
                href={redirectUrl}
                className="inline-flex items-center gap-2 border px-5 py-2.5 transition-all hover:opacity-80"
                style={{
                  borderColor: `${GOLD}40`,
                  backgroundColor: `${GOLD}0D`,
                  color: `${GOLD}CC`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Access asset
                <ArrowRight className="h-3 w-3" />
              </a>
            ) : entry.accessLevel === "inner_circle" ? (
              <Link
                href="/inner-circle"
                className="inline-flex items-center gap-2 border px-5 py-2.5 transition-all hover:opacity-80"
                style={{ borderColor: `${GOLD}40`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase" }}
              >
                Unlock with Inner Circle
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : entry.accessLevel === "paid" ? (
              <Link
                href={`/access?asset=${encodeURIComponent(entry.entitlementSlug || entry.slug)}`}
                className="inline-flex items-center gap-2 border px-5 py-2.5 transition-all hover:opacity-80"
                style={{ borderColor: `${GOLD}40`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase" }}
              >
                Unlock this resource
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <Link
                href="/access"
                className="inline-flex items-center gap-2 border px-5 py-2.5 transition-all hover:opacity-80"
                style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase" }}
              >
                Request access
                <Shield className="h-3 w-3" />
              </Link>
            )}
          </div>

          {price?.justification ? (
            <p className="mt-3 max-w-[56ch]" style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ds-text-muted)", fontStyle: "italic" }}>
              {price.justification}
            </p>
          ) : null}

          {!isPublic && (
            <p className="mt-4 font-mono" style={{ fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--ds-text-subtle)" }}>
              Protected delivery is handled by the entitlement resolver. Unknown assets are not resolvable.
            </p>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const slug = normalizeDownloadManifestSlug(
    Array.isArray(params?.slug) ? params.slug.join("/") : params?.slug,
  );
  const entry = getDownloadManifestEntry(slug);

  if (!entry) return { notFound: true };

  const product = entry.entitlementSlug
    ? getProductByEntitlementSlug(entry.entitlementSlug)
    : getProductByEntitlementSlug(entry.slug);

  return {
    props: {
      entry,
      redirectUrl: getDownloadRedirectUrl(entry),
      price: product
        ? {
            display: product.displayPrice,
            justification: "Catalog-governed paid decision asset.",
          }
        : null,
    },
  };
};

export default Page;
