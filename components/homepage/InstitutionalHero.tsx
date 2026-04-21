"use client";

/* components/homepage/InstitutionalHero.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-3xl ProofTile cards, rounded-2xl icon container + all CTAs
   - rounded-full eyebrow badge and three "Dossiers/Governance/Deployable" tags
   - bg-gradient-to-r from-amber-500 to-amber-600 primary CTA — gradient fill
   - font-bold/font-extrabold throughout
   - Emerald-400/500 on fourth CTA — third colour system
   - "Institutional operating system" badge with Shield icon
   - "Built as a system — not a vibe." — performed informality
   - Vault icon (removed from Lucide — build error)
   - Emerald-400/500 radial backdrop on right side

   Rebuilt: Sharp tile proof strip. Clean CTA hierarchy.
   The three proof tiles demonstrate the system; they don't announce it.
*/

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, Layers, Archive, BookOpen, Fingerprint } from "lucide-react";

const GOLD = "#C9A96E";
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PROOF_TILES = [
  {
    Icon: Layers,
    title: "Canon to deployment",
    body:  "One doctrinal spine. Many deployments: frameworks, vault assets, briefings.",
  },
  {
    Icon: Shield,
    title: "Governance posture",
    body:  "Decision systems, cadence, accountability — not motivational noise.",
  },
  {
    Icon: Archive,
    title: "Deployable artifacts",
    body:  "Templates, playbooks, and operator packs designed for execution under pressure.",
  },
];

export default function InstitutionalHero(): React.ReactElement {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{ backgroundColor: "rgb(3 3 5)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Atmosphere — single softGold radial, no emerald */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 0%, ${GOLD}09, transparent 55%)` }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-12 sm:px-8 lg:px-12 lg:pt-20 lg:pb-14">

        {/* Top strip — eyebrow + factual tags */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          {/* Eyebrow — platform canonical */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: `${GOLD}BF`,
            }}>
              Institutional platform
            </span>
          </div>

          {/* Factual content tags — sharp, no rounded-full */}
          <div className="hidden md:flex items-center gap-2">
            {["Frameworks", "Governance cadence", "Deployable assets"].map((tag) => (
              <span key={tag} style={{
                padding: "4px 12px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.018)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.38)",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">

          {/* Left — headline + CTAs */}
          <div className="lg:col-span-8">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(2.2rem, 5vw, 4rem)",
                lineHeight: 0.96, letterSpacing: "-0.032em",
                color: "rgba(255,255,255,0.93)",
              }}
            >
              Strategy that survives pressure.
              <span style={{ display: "block", color: `${GOLD}CC`, marginTop: "0.4rem" }}>
                Built as a system.
              </span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease, delay: 0.05 }}
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "1.12rem", lineHeight: 1.72,
                color: "rgba(255,255,255,0.42)",
                maxWidth: "48ch",
                marginTop: "1.25rem",
              }}
            >
              Frameworks, governance discipline, and deployable assets — derived from
              the Canon and engineered for founders, boards, and institutions that
              refuse fragility.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease, delay: 0.10 }}
              style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
            >
              {/* Primary — gold sharp */}
              <Link
                href="/resources/strategic-frameworks"
                className="group inline-flex items-center gap-2 transition-all duration-300"
                style={{
                  padding: "12px 24px",
                  border: `1px solid ${GOLD}44`,
                  backgroundColor: `${GOLD}10`,
                  color: GOLD,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}66`; el.style.backgroundColor = `${GOLD}18`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}44`; el.style.backgroundColor = `${GOLD}10`; }}
              >
                Strategic frameworks
                <ArrowRight style={{ width: "12px", height: "12px" }} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Secondary — ghost */}
              <Link
                href="/vault"
                className="inline-flex items-center gap-2 transition-all duration-300"
                style={{
                  padding: "12px 24px",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.48)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.72)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.48)"; }}
              >
                <Archive style={{ width: "12px", height: "12px" }} />
                The vault
              </Link>

              {/* Tertiary — ghost dimmer */}
              <Link
                href="/books/the-architecture-of-human-purpose"
                className="inline-flex items-center gap-2 transition-all duration-300"
                style={{
                  padding: "12px 24px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.14)"; el.style.color = "rgba(255,255,255,0.60)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.35)"; }}
              >
                <BookOpen style={{ width: "12px", height: "12px" }} />
                Architecture of human purpose
              </Link>

              {/* Fourth — same ghost system, softGold not emerald */}
              <Link
                href="/blog/ultimate-purpose-of-man"
                className="inline-flex items-center gap-2 transition-all duration-300"
                style={{
                  padding: "12px 24px",
                  border: `1px solid ${GOLD}25`,
                  backgroundColor: `${GOLD}07`,
                  color: `${GOLD}AA`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0F`; el.style.color = GOLD; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}25`; el.style.backgroundColor = `${GOLD}07`; el.style.color = `${GOLD}AA`; }}
              >
                <Fingerprint style={{ width: "12px", height: "12px" }} />
                Ultimate purpose of man
              </Link>
            </motion.div>
          </div>

          {/* Right — proof tiles */}
          <div className="lg:col-span-4">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {PROOF_TILES.map((tile) => {
                const { Icon } = tile;
                return (
                  <div
                    key={tile.title}
                    className="transition-all duration-300"
                    style={{
                      border: "1px solid rgba(255,255,255,0.062)",
                      backgroundColor: "rgb(5 5 7)",
                      padding: "1.25rem",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${GOLD}20`; el.style.backgroundColor = "rgb(7 7 11)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(255,255,255,0.062)"; el.style.backgroundColor = "rgb(5 5 7)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                      {/* Icon container — sharp, no rounded */}
                      <div style={{
                        width: "32px", height: "32px", flexShrink: 0,
                        border: "1px solid rgba(255,255,255,0.07)",
                        backgroundColor: "rgba(255,255,255,0.018)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon style={{ width: "13px", height: "13px", color: `${GOLD}90` }} />
                      </div>
                      <div>
                        <div style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.15,
                          letterSpacing: "-0.015em", color: "rgba(255,255,255,0.80)",
                          marginBottom: "0.35rem",
                        }}>
                          {tile.title}
                        </div>
                        <div style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.62,
                          color: "rgba(255,255,255,0.38)",
                        }}>
                          {tile.body}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}