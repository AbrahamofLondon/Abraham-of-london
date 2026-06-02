import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

const ESTATE_PILLARS = [
  {
    status: "Free entry",
    label: "Decision Pressure Signal",
    summary: "Paste one decision. Receive a pressure band, missing evidence, and next admissible move.",
    href: "/decision-pressure",
    accent: "rgba(110,231,183,0.80)",
    primary: false,
  },
  {
    status: "Paid proof · £99",
    label: "Boardroom Brief",
    summary: "A structured board-facing brief with objections, evidence weaknesses, and the next admissible move.",
    href: "/boardroom-brief",
    accent: `${HOMEPAGE_GOLD}CC`,
    primary: true,
  },
  {
    status: "Governed intelligence line",
    label: "Global Market Intelligence",
    summary: "Quarterly market intelligence that reviews prior material calls before issuing the next report.",
    href: "/artifacts/global-market-intelligence-report-q1-2026",
    accent: "rgba(216,180,254,0.80)",
    primary: false,
  },
  {
    status: "Organisational assessment",
    label: "Enterprise Decision Scan",
    summary: "Tests where the organisation breaks under evidence gaps, authority ambiguity, and execution pressure.",
    href: "/enterprise",
    accent: "rgba(147,197,253,0.80)",
    primary: false,
  },
  {
    status: "Specialist instruments",
    label: "Governed Instruments",
    summary: "Structured instruments for exposure, mandate clarity, execution risk, governance drift, and board briefing.",
    href: "/decision-instruments",
    accent: "rgba(251,191,36,0.75)",
    primary: false,
  },
];

export default function WhatYouCanUseTodaySection() {
  return (
    <section
      id="product-estate"
      className="border-t border-white/[0.05] px-6 py-12 lg:py-16"
      style={{ backgroundColor: "rgb(3,3,5)" }}
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: `${HOMEPAGE_GOLD}70`,
                marginBottom: "10px",
              }}
            >
              Product estate
            </p>
            <h2
              style={{
                ...serif,
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                lineHeight: 1.1,
                color: "rgba(255,255,255,0.88)",
                fontStyle: "italic",
              }}
            >
              Decision infrastructure in use.
            </h2>
            <p className="mt-3 max-w-[60ch] text-[14px] leading-[1.75] text-white/45">
              Public proof surfaces, paid decision products, governed instruments, market intelligence, and retained review pathways.
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex shrink-0 items-center gap-2"
            style={{
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: `${HOMEPAGE_GOLD}AA`,
            }}
          >
            Explore all products
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ESTATE_PILLARS.map((pillar) => (
            <Link
              key={pillar.label}
              href={pillar.href}
              className="group flex flex-col justify-between border p-5 transition-all duration-150 hover:border-white/[0.13] hover:bg-white/[0.02]"
              style={{
                borderColor: pillar.primary ? `${HOMEPAGE_GOLD}30` : "rgba(255,255,255,0.07)",
                backgroundColor: pillar.primary ? `${HOMEPAGE_GOLD}05` : "rgba(255,255,255,0.012)",
              }}
            >
              <div>
                <p
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: pillar.accent,
                    marginBottom: "10px",
                  }}
                >
                  {pillar.status}
                </p>
                <p
                  className="text-[14px] leading-[1.3] text-white/88"
                  style={{ fontWeight: 400 }}
                >
                  {pillar.label}
                </p>
                <p className="mt-2 text-[13px] leading-[1.65] text-white/48">
                  {pillar.summary}
                </p>
              </div>
              <div className="mt-5">
                <ArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  style={{ color: pillar.primary ? `${HOMEPAGE_GOLD}88` : "rgba(255,255,255,0.22)" }}
                />
              </div>
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-[760px] border border-white/[0.06] bg-white/[0.01] px-5 py-3 text-center">
          <p
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.28)",
              lineHeight: 1.7,
            }}
          >
            Free entry signals and public instruments require no account. Boardroom Brief, instruments, and intelligence reports are paid one-time access. Executive reporting, governed execution, and retained review are evidence-gated layers.
          </p>
        </div>
      </div>
    </section>
  );
}
