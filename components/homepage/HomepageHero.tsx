import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

export default function HomepageHero() {
  return (
    <section
      id="hero"
      className="flex min-h-[78vh] items-start justify-center px-6 pb-14 pt-[132px] sm:min-h-[82vh] sm:items-center sm:pt-24"
      style={{ backgroundColor: "rgb(3,3,5)" }}
    >
      <div className="mx-auto max-w-[760px] text-center">
        <p
          style={{
            ...mono,
            fontSize: "12px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: `${HOMEPAGE_GOLD}88`,
          }}
        >
          Governed Decision Infrastructure by Abraham of London
        </p>

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
          Governed decision infrastructure for leaders who cannot afford advisory theatre.
        </h1>

        <p
          className="mx-auto mt-6 max-w-[58ch] text-[16px] leading-[1.85]"
          style={{ color: "rgba(255,255,255,0.58)" }}
        >
          Start with one real decision. If the evidence holds, the system can
          progress it into executive reporting, intervention, retained oversight,
          and chain-anchored provenance.
        </p>

        <p
          className="mx-auto mt-5 max-w-[48ch] text-[13px] leading-[1.75]"
          style={{ color: "rgba(255,255,255,0.36)" }}
        >
          No guaranteed outcomes. No hidden certainty. Evidence first.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/diagnostics/fast"
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
            Run the Fast Diagnostic
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/tools/decision-delay-exposure"
            className="inline-flex min-h-[44px] items-center"
            style={{
              ...mono,
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.36)",
            }}
          >
            Estimate decision delay exposure
          </Link>
        </div>

        <div className="mt-4">
          <Link
            href="/provenance/sample-export"
            style={{
              ...mono,
              fontSize: "10px",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: `${HOMEPAGE_GOLD}55`,
            }}
          >
            View provenance sample →
          </Link>
        </div>

        <div
          className="mx-auto mt-10 max-w-[560px] border border-white/[0.06] bg-white/[0.015] px-5 py-4"
          style={{ color: "rgba(255,255,255,0.54)" }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {[
              "Evidence tested",
              "Authority checked",
              "Escalation may be refused",
              "Checkpoint retained",
            ].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: `${HOMEPAGE_GOLD}AA` }}
                />
                <span
                  style={{
                    ...mono,
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.42)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
