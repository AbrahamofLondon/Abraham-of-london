/* components/homepage/CanonInstitutionalIntro.tsx
   Design: Institutional Monumentalism — sharp panels, softGold tokens, no gradients
   
   Previous version had: rounded-3xl, rounded-2xl, rounded-full throughout,
   amber gradient fills, "Not random content" defensive copy, font-semibold weights.
   
   Rebuilt: Sharp panel system. Cormorant typography. Factual copy — the Canon
   is presented as what it is, not defended against what it isn't.
*/

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronRight, Layers } from "lucide-react";

const GOLD = "#C9A96E";

export type CanonPrelude = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  href: string;
  canonHref: string;
  ctaLabel?: string | null;
};

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: "1.25rem",
        border: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(255,255,255,0.018)",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: `${GOLD}90`,
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.92rem",
          lineHeight: 1.62,
          color: "rgba(255,255,255,0.58)",
        }}
      >
        {body}
      </div>
    </div>
  );
}

export default function CanonInstitutionalIntro({
  prelude,
}: {
  prelude: CanonPrelude;
}): React.ReactElement {
  const title      = prelude?.title       || "The Architecture of Human Purpose";
  const subtitle   = prelude?.subtitle    || "Prelude MiniBook — Gateway to the Canon";
  const excerpt    = prelude?.excerpt || prelude?.description || "Human flourishing is not accidental. It is architectural.";
  const cover      = prelude?.coverImage  || "/assets/images/books/the-architecture-of-human-purpose.jpg";
  const primaryHref = prelude?.href       || "/books/the-architecture-of-human-purpose";
  const canonHref  = prelude?.canonHref   || "/canon";
  const ctaLabel   = prelude?.ctaLabel    || "Open the Prelude MiniBook";

  return (
    <section>
      <div
        style={{
          border: `1px solid ${GOLD}20`,
          backgroundColor: `${GOLD}06`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold thread — top */}
        <div
          style={{
            position: "absolute", inset: 0, top: 0, left: 0, right: 0,
            height: "1px",
            background: `linear-gradient(to right, transparent, ${GOLD}35, transparent)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ padding: "2rem 2rem 2rem", position: "relative", zIndex: 1 }}>

          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: `${GOLD}BF`,
            }}>
              Canon gateway
            </span>
          </div>

          {/* Main grid */}
          <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">

            {/* Left — cover */}
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  border: `1px solid ${GOLD}28`,
                  backgroundColor: "rgba(0,0,0,0.40)",
                  padding: "8px",
                  display: "inline-block",
                }}
              >
                <Image
                  src={cover}
                  alt={`${title} cover`}
                  width={220}
                  height={320}
                  loading="lazy"
                  quality={75}
                  sizes="(max-width: 640px) 100px, (max-width: 1024px) 130px, 150px"
                  className="h-auto w-[100px] sm:w-[130px] md:w-[150px]"
                  style={{ display: "block" }}
                />
              </div>
            </div>

            {/* Right — content */}
            <div>
              {/* Title block */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.5rem, 2.5vw, 2.4rem)",
                    lineHeight: 1.0,
                    letterSpacing: "-0.028em",
                    color: "rgba(255,255,255,0.94)",
                    marginBottom: "0.6rem",
                  }}
                >
                  {title}
                </h2>
                <p style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                  color: `${GOLD}90`,
                }}>
                  {subtitle}
                </p>
              </div>

              {/* Excerpt panel */}
              <div
                style={{
                  padding: "1rem 1.25rem",
                  border: "1px solid rgba(255,255,255,0.055)",
                  backgroundColor: "rgba(255,255,255,0.018)",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "6.5px", letterSpacing: "0.32em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)", marginBottom: "0.5rem",
                }}>
                  From the text
                </div>
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.68,
                  color: "rgba(255,255,255,0.72)", fontStyle: "italic",
                }}>
                  {excerpt}
                </p>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link
                  href={primaryHref}
                  className="group inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "12px 22px",
                    border: `1px solid ${GOLD}42`,
                    backgroundColor: `${GOLD}0E`,
                    color: GOLD,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}16`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0E`; }}
                >
                  <BookOpen style={{ width: "13px", height: "13px" }} />
                  {ctaLabel}
                  <ChevronRight style={{ width: "13px", height: "13px" }} />
                </Link>

                <Link
                  href={canonHref}
                  className="inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "12px 22px",
                    border: "1px solid rgba(255,255,255,0.09)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.50)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.75)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.50)"; }}
                >
                  Browse Canon
                </Link>
              </div>
            </div>
          </div>

          {/* Three pillars */}
          <div className="grid gap-3 md:grid-cols-3" style={{ marginTop: "2rem" }}>
            <Pillar title="Purpose architecture" body="Meaning, formation, and direction — the structural logic beneath serious work." />
            <Pillar title="Canon discipline"     body="Frameworks built to survive pressure, not to comfort the comfortable." />
            <Pillar title="Operational use"      body="Deployable models and tools extracted from the doctrinal layer." />
          </div>
        </div>
      </div>
    </section>
  );
}