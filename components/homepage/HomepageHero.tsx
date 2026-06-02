import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

export default function HomepageHero() {
  return (
    <section
      id="hero"
      className="flex min-h-[82vh] items-start justify-center px-6 pb-14 pt-[132px] sm:min-h-[86vh] sm:items-center sm:pt-24"
      style={{ backgroundColor: "rgb(3,3,5)" }}
    >
      <div className="mx-auto max-w-[800px] text-center">
        {/* Eyebrow */}
        <p
          style={{
            ...mono,
            fontSize: "11px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: `${HOMEPAGE_GOLD}77`,
          }}
        >
          Decision Infrastructure by Abraham of London
        </p>

        {/* Headline */}
        <h1
          className="mt-6"
          style={{
            ...serif,
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            lineHeight: 1.02,
            color: "#F5F5F5",
            fontStyle: "italic",
            letterSpacing: "-0.02em",
          }}
        >
          Stop making serious decisions with weak evidence.
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mt-6 max-w-[60ch] text-[16px] leading-[1.85]"
          style={{ color: "rgba(255,255,255,0.58)" }}
        >
          A governed decision system for leaders, teams, and organisations under pressure.
          It tests whether a decision has enough evidence, authority, ownership, and
          execution clarity before it moves forward.
        </p>

        {/* Trust line */}
        <p
          className="mx-auto mt-4 max-w-[56ch] text-[14px] leading-[1.75]"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          Built to challenge weak evidence, unclear authority, and unsupported decisions before they become expensive mistakes.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* Primary CTA */}
          <Link
            href="/decision-pressure"
            className="group inline-flex min-h-[52px] items-center gap-3 border px-8 py-4 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              borderColor: `${HOMEPAGE_GOLD}60`,
              backgroundColor: `${HOMEPAGE_GOLD}18`,
              color: "#F5F5F5",
              ...mono,
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Test your decision
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/boardroom-brief"
            className="group inline-flex min-h-[48px] items-center gap-2 border px-6 py-3 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              borderColor: `${HOMEPAGE_GOLD}30`,
              backgroundColor: `${HOMEPAGE_GOLD}08`,
              color: "rgba(255,255,255,0.75)",
              ...mono,
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Generate Boardroom Brief
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Tertiary */}
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center gap-2"
            style={{
              ...mono,
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.32)",
            }}
          >
            Explore products
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}