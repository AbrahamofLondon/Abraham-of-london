/**
 * pages/changelog.tsx - Public changelog
 *
 * Documents significant platform changes. No speculative features.
 * Factual, dated entries only.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type ChangeEntry = {
  date: string;
  version?: string;
  title: string;
  summary: string;
  tags: string[];
};

const CHANGES: ChangeEntry[] = [
  {
    date: "2025-05-16",
    title: "Rate limiting: Postgres-authoritative enforcement",
    summary:
      "Scoped, Postgres-backed rate limiting applied to provenance verification, Return Brief generation, send-to-self, benchmark context, outcome contribution, case save, and API v1 endpoints. Identifier hashing prevents raw IP or email storage in rate-limit records. Redis remains available as an optional accelerator but is no longer a launch dependency.",
    tags: ["security", "infrastructure"],
  },
  {
    date: "2025-05-16",
    title: "Terms and Privacy acceptance tracking",
    summary:
      "Versioned acceptance of Terms of Service and Privacy Policy is now recorded on first authenticated use. Users are re-prompted when a new version is published. Acceptance records include version, timestamp, and a hashed IP. No raw personal data is stored in the acceptance record.",
    tags: ["legal", "privacy"],
  },
  {
    date: "2025-05-16",
    title: "Public provenance verifier",
    summary:
      "Third-party clients can now verify governed case record integrity via GET /api/provenance/public-verify?token=<signed-token>. No authentication required. Tokens are HMAC-signed, time-bounded to 90 days, and expose no internal IDs or case content. Status values: MATCH, MISMATCH, UNAVAILABLE, EXPIRED.",
    tags: ["provenance", "transparency"],
  },
  {
    date: "2025-05-16",
    title: "Security disclosure policy published",
    summary:
      "A responsible disclosure policy is now available at /security/disclosure. It covers reporting channels, response commitments, in-scope systems, ground rules, and reporter protections. No SOC 2, ISO 27001, or similar certification is claimed.",
    tags: ["security"],
  },
  {
    date: "2025-05-16",
    title: "Stale governed case email notifications",
    summary:
      "Automated email notifications now fire when a governed case crosses a staleness threshold (WATCH: 30 days, ALERT: 60 days, CRITICAL: 90 days). Emails include a signed return link, one primary call to action, and respect user mute and snooze settings. Duplicate-send protection is enforced via the database.",
    tags: ["cases", "email"],
  },
  {
    date: "2025-05-16",
    title: "Decision Centre onboarding checklist",
    summary:
      "A collapsible onboarding checklist is shown in Decision Centre for users who have not yet saved a governed case. Steps cover running a first diagnostic, reviewing a case, and understanding Return Briefs. Dismissed state is stored locally and never sent to the server.",
    tags: ["onboarding", "ux"],
  },
  {
    date: "2025-05-16",
    title: "Feedback widget on case result surfaces",
    summary:
      "A lightweight thumbs-up / thumbs-down feedback prompt is now shown on Return Brief and case result pages. Comment is optional, capped at 500 characters, and stored only if provided. No free-text is required. Feedback is rate-limited per IP and stored for operator review, not for marketing.",
    tags: ["feedback", "ux"],
  },
];

const TAG_COLORS: Record<string, string> = {
  security: "rgba(220,50,50,0.40)",
  infrastructure: "rgba(100,160,255,0.40)",
  legal: "rgba(180,140,255,0.40)",
  privacy: "rgba(180,140,255,0.40)",
  provenance: `${GOLD}70`,
  transparency: `${GOLD}60`,
  cases: "rgba(100,200,140,0.45)",
  email: "rgba(100,200,140,0.35)",
  onboarding: "rgba(255,200,80,0.40)",
  ux: "rgba(255,200,80,0.35)",
  feedback: "rgba(255,200,80,0.35)",
};

const ChangelogPage: NextPage = () => {
  return (
    <Layout
      title="Changelog | Abraham of London"
      description="Platform updates and changes to Abraham of London."
      canonicalUrl="/changelog"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Changelog
            </span>
          </div>

          <h1 style={{ ...serif, fontSize: "clamp(1.9rem, 4vw, 2.6rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.92)" }}>
            Platform changes
          </h1>

          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.85, maxWidth: "480px" }}>
            Significant updates to Abraham of London, listed in reverse chronological order.
            Only shipped changes are documented here.
          </p>

          <div className="mt-12 space-y-10">
            {CHANGES.map((entry, i) => (
              <article key={i} style={{ borderLeft: `2px solid ${i === 0 ? GOLD + "40" : "rgba(255,255,255,0.07)"}`, paddingLeft: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <time
                    dateTime={entry.date}
                    style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: i === 0 ? `${GOLD}90` : "rgba(255,255,255,0.30)" }}
                  >
                    {entry.date}
                  </time>
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        ...mono,
                        fontSize: "6px",
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        border: `1px solid ${TAG_COLORS[tag] ?? "rgba(255,255,255,0.12)"}`,
                        color: TAG_COLORS[tag] ?? "rgba(255,255,255,0.30)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 style={{ fontSize: "15px", fontWeight: 400, color: "rgba(255,255,255,0.80)", marginBottom: "8px", lineHeight: 1.35 }}>
                  {entry.title}
                </h2>

                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.42)", lineHeight: 1.8 }}>
                  {entry.summary}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
            {[
              { label: "Security disclosure", href: "/security/disclosure" },
              { label: "Trust Centre", href: "/trust" },
              { label: "Verification", href: "/verification" },
              { label: "Privacy policy", href: "/privacy" },
            ].map((link) => (
              <Link key={link.href} href={link.href} style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", padding: "5px 10px", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)" }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default ChangelogPage;
