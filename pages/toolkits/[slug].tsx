/**
 * /toolkits/[slug] — Individual toolkit page.
 * Data source: lib/toolkits/registry.ts (typed SSOT).
 * Renders: purpose, components, outputs, framework basis, product links.
 * Follows same pattern as /resources/strategic-frameworks/[slug].
 */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { TOOLKITS, getToolkit } from "@/lib/toolkits/registry";
import type { Toolkit } from "@/lib/toolkits/types";
import { CANON_REFERENCES } from "@/lib/canon/reference-codes";
import { getProductDisplayPrice } from "@/lib/commercial/catalog";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

type Props = { toolkit: Toolkit };

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: TOOLKITS.map((t) => ({ params: { slug: t.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const toolkit = getToolkit(String(params?.slug ?? ""));
  if (!toolkit) return { notFound: true };
  return { props: { toolkit } };
};

const ToolkitPage: NextPage<Props> = ({ toolkit }) => {
  const frameworks = toolkit.linkedFrameworks
    .map((code) => CANON_REFERENCES.find((r) => r.code === code))
    .filter(Boolean);

  return (
    <Layout title={`${toolkit.title} | Abraham of London`} description={toolkit.description} canonicalUrl={`/toolkits/${toolkit.slug}`} fullWidth={false}>
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl">

          {/* Breadcrumb */}
          <div className="mb-2">
            <Link href="/toolkits" style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              ← Toolkits
            </Link>
          </div>

          {/* Header */}
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>{toolkit.domain}</span>
          <h1 style={{ ...serif, fontWeight: 300, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.92)", marginTop: "0.5rem" }}>
            {toolkit.title}
          </h1>
          <p className="mt-3" style={{ fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", maxWidth: "48ch" }}>
            {toolkit.description}
          </p>

          {toolkit.tier !== "public" && (
            <div className="mt-3 inline-flex items-center gap-2" style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: toolkit.tier === "enterprise" ? "rgba(252,165,165,0.55)" : `${GOLD}80` }}>
              <Lock style={{ width: 10, height: 10 }} />
              {toolkit.tier === "enterprise" ? "Enterprise access" : "Paid access"}
            </div>
          )}

          {/* Components */}
          <div className="mt-8">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Components</span>
            <div className="mt-3 space-y-2">
              {toolkit.components.map((comp) => (
                <div key={comp} style={{ padding: "8px 12px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.88rem", color: "rgba(255,255,255,0.50)" }}>
                  {comp}
                </div>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div className="mt-8">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Outputs</span>
            <div className="mt-3 space-y-2">
              {toolkit.outputs.map((out) => (
                <div key={out} style={{ padding: "8px 12px", border: `1px solid ${GOLD}12`, backgroundColor: `${GOLD}04`, fontSize: "0.88rem", color: `${GOLD}AA` }}>
                  {out}
                </div>
              ))}
            </div>
          </div>

          {/* Framework Basis */}
          {frameworks.length > 0 && (
            <div className="mt-8">
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Framework Basis</span>
              <div className="mt-3 space-y-3">
                {frameworks.map((fw) => (
                  <div key={fw!.code} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
                    <div className="flex items-baseline gap-2">
                      <span style={{ ...mono, fontSize: "8px", color: `${GOLD}80` }}>{fw!.code}</span>
                      <span style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.55)" }}>{fw!.name}</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.30)", marginTop: "0.25rem", lineHeight: 1.6 }}>
                      {fw!.canonicalClaim}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {fw!.academicAnchors.slice(0, 3).map((a) => (
                        <span key={a} style={{ ...mono, fontSize: "6px", padding: "1px 4px", border: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.18)" }}>{a}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application — linked products */}
          {toolkit.linkedProducts.length > 0 && (
            <div className="mt-8">
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Application</span>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>This toolkit is deployed through:</p>
              <div className="mt-3 space-y-2">
                {toolkit.linkedProducts.map((code) => {
                  const price = getProductDisplayPrice(code);
                  const href = code.includes("strategy") ? "/strategy-room" : code.includes("executive") ? "/diagnostics/executive-reporting" : `/decision-instruments/${code.replace(/_/g, "-")}`;
                  return (
                    <Link key={code} href={href} className="group flex items-center justify-between" style={{ padding: "8px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)" }}>{code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} {price ? `· ${price}` : ""}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-40" style={{ color: "rgba(255,255,255,0.30)" }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upgrade path */}
          <div className="mt-10 pt-6" style={{ borderTop: `1px solid ${GOLD}15` }}>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.40)", lineHeight: 1.7 }}>
              Full diagnostic via <Link href="/diagnostics/executive-reporting" style={{ color: `${GOLD}AA` }}>Executive Reporting</Link>.
              Execution via <Link href="/strategy-room" style={{ color: `${GOLD}AA` }}>Strategy Room</Link>.
            </p>
          </div>

          <p className="mt-8" style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.10)" }}>
            Developed by Abraham Adaramola · Founder, Abraham of London
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default ToolkitPage;
