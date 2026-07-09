import * as React from "react";
import Link from "next/link";
import { CalendarDays, FileText, Mail, ShieldAlert } from "lucide-react";

import Layout from "@/components/Layout";
import EvidenceBoundaryNotice, {
  type EvidenceBoundaryVariant,
} from "@/components/commercial/EvidenceBoundaryNotice";
import type { ProductReleaseGovernance } from "@/lib/product/product-release-governance";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type OfferCta = {
  label: string;
  href: string;
  kind: "primary" | "secondary" | "quiet";
  icon: "mail" | "file" | "calendar";
};

export type EvidenceLimitedOffer = {
  code: string;
  slug: string;
  title: string;
  eyebrow: string;
  heroPromise: string;
  summary: string;
  variant: EvidenceBoundaryVariant;
  buyer: string[];
  receives: string[];
  cannotClaim: string[];
  price: string;
  timeline: string;
  manualFulfilmentNote: string;
  ctas: OfferCta[];
  faq: Array<{ question: string; answer: string }>;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "11px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.42)",
        marginBottom: "12px",
      }}
    >
      {children}
    </p>
  );
}

function CtaIcon({ icon }: { icon: OfferCta["icon"] }) {
  const props = { size: 15, strokeWidth: 1.7, "aria-hidden": true } as const;
  if (icon === "mail") return <Mail {...props} />;
  if (icon === "calendar") return <CalendarDays {...props} />;
  return <FileText {...props} />;
}

function OfferCtaLink({ cta }: { cta: OfferCta }) {
  const base: React.CSSProperties = {
    ...mono,
    minHeight: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "12px 15px",
    fontSize: "10px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    textDecoration: "none",
    transition: "border-color 160ms ease, background 160ms ease, color 160ms ease",
  };

  const styles: Record<OfferCta["kind"], React.CSSProperties> = {
    primary: {
      ...base,
      background: GOLD,
      borderColor: GOLD,
      color: "rgb(3 3 5)",
    },
    secondary: {
      ...base,
      background: "rgba(201,169,110,0.08)",
      borderColor: `${GOLD}55`,
      color: `${GOLD}E6`,
    },
    quiet: {
      ...base,
      background: "rgba(255,255,255,0.025)",
      color: "rgba(255,255,255,0.72)",
    },
  };

  return (
    <Link href={cta.href} style={styles[cta.kind]}>
      <CtaIcon icon={cta.icon} />
      {cta.label}
    </Link>
  );
}

function BulletPanel({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "neutral" | "boundary";
}) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: tone === "boundary" ? "rgba(252,165,165,0.045)" : "rgba(255,255,255,0.018)",
        padding: "22px",
      }}
    >
      <SectionLabel>{title}</SectionLabel>
      <ul style={{ display: "grid", gap: "10px" }}>
        {items.map((item) => (
          <li key={item} style={{ color: "rgba(255,255,255,0.70)", fontSize: "14px", lineHeight: 1.7 }}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function EvidenceLimitedOfferPage({
  offer,
  governance,
}: {
  offer: EvidenceLimitedOffer;
  governance?: ProductReleaseGovernance | null;
}) {
  // If governance is loaded and blocks commercial release, show blocked state
  if (governance && !governance.commercialClaimAllowed && governance.releaseMode === "blocked") {
    return (
      <Layout
        title={`${offer.title} | Abraham of London`}
        description={offer.summary}
        canonicalUrl={`/offers/${offer.slug}`}
        fullWidth
      >
        <div style={{ background: "rgb(3 3 5)", minHeight: "100vh", padding: "40px 20px" }}>
          <div className="mx-auto max-w-2xl text-center">
            <p style={{ color: "rgba(255, 255, 255, 0.5)", marginBottom: "16px" }}>
              This offer is not currently available
            </p>
            <h1 style={{ fontSize: "28px", color: "white", marginBottom: "20px" }}>
              {offer.title}
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "24px" }}>
              This product is temporarily unavailable due to authority governance constraints. Please contact
              us for updates.
            </p>
            <Link href="/" style={{ color: "#C9A96E", textDecoration: "underline" }}>
              Return to home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${offer.title} | Abraham of London`}
      description={offer.summary}
      canonicalUrl={`/offers/${offer.slug}`}
      fullWidth
    >
      <div style={{ background: "rgb(3 3 5)", minHeight: "100%" }}>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-12 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pb-16 lg:pt-18">
          <div>
            <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}B8` }}>
              {offer.eyebrow}
            </p>
            <h1
              style={{
                ...serif,
                marginTop: "18px",
                maxWidth: "820px",
                color: "rgba(255,255,255,0.92)",
                fontSize: "clamp(44px, 7vw, 86px)",
                lineHeight: 0.95,
              }}
            >
              {offer.title}
            </h1>
            <p className="mt-7 max-w-2xl text-[17px] leading-8 text-white/70">
              {offer.heroPromise}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {offer.ctas.map((cta) => (
                <OfferCtaLink key={cta.label} cta={cta} />
              ))}
            </div>
          </div>

          <aside
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.018)",
              padding: "24px",
              alignSelf: "start",
            }}
          >
            <SectionLabel>Commercial terms</SectionLabel>
            <div className="grid gap-5">
              <div>
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                  Price
                </p>
                <p className="mt-2 text-2xl text-white/86" style={serif}>{offer.price}</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                  Delivery timeline
                </p>
                <p className="mt-2 text-sm leading-7 text-white/68">{offer.timeline}</p>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "16px",
                }}
              >
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                  Manual fulfilment
                </p>
                <p className="mt-2 text-sm leading-7 text-white/62">{offer.manualFulfilmentNote}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-2 lg:px-12">
          <BulletPanel title="Who it is for" items={offer.buyer} />
          <BulletPanel title="What the buyer receives" items={offer.receives} />
        </section>

        <section className="mx-auto max-w-6xl px-6 py-4 lg:px-12">
          <EvidenceBoundaryNotice variant={offer.variant} />
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
          <BulletPanel title="What it cannot claim" items={offer.cannotClaim} tone="boundary" />
          <div
            style={{
              border: `1px solid ${GOLD}22`,
              background: "rgba(201,169,110,0.035)",
              padding: "22px",
            }}
          >
            <SectionLabel>Fulfilment sequence</SectionLabel>
            <ol className="grid gap-3 text-sm leading-7 text-white/68">
              <li>1. Buyer requests purchase, review, or advisory call.</li>
              <li>2. Operator confirms scope and sends intake instructions.</li>
              <li>3. Buyer accepts the evidence boundary before delivery begins.</li>
              <li>4. Manual invoice or payment link is issued where appropriate.</li>
              <li>5. Output is prepared from buyer-supplied material and reviewed against the boundary.</li>
              <li>6. Delivery email is sent and the case is archived for follow-up.</li>
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-10 lg:px-12">
          <SectionLabel>FAQ</SectionLabel>
          <div className="grid gap-4 md:grid-cols-2">
            {offer.faq.map((item) => (
              <article
                key={item.question}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.018)",
                  padding: "20px",
                }}
              >
                <h2 className="text-base text-white/84">{item.question}</h2>
                <p className="mt-3 text-sm leading-7 text-white/60">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20 pt-8 lg:px-12">
          <div
            className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
              padding: "22px",
            }}
          >
            <div className="flex gap-3">
              <ShieldAlert size={20} color={GOLD} aria-hidden="true" />
              <p className="max-w-3xl text-sm leading-7 text-white/64">
                This offer can be sold and fulfilled manually as evidence-limited work. It must not be described as restored authority, external proof, or independent verification.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              {offer.ctas.slice(0, 2).map((cta) => (
                <OfferCtaLink key={`footer-${cta.label}`} cta={cta} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
