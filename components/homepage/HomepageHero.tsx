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
          Decision Infrastructure by Abraham of London
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
          The decision system that can refuse to proceed.
        </h1>

        <p
          className="mx-auto mt-6 max-w-[58ch] text-[16px] leading-[1.85]"
          style={{ color: "rgba(255,255,255,0.58)" }}
        >
          Not generic AI advice. Not a dashboard. Not a consultancy brochure.
          This system tests a serious decision against evidence, authority,
          consequence, and execution reality. If the case is not ready, it does
          not pretend.
        </p>

        <p
          className="mx-auto mt-5 max-w-[48ch] text-[13px] leading-[1.75]"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          Submit one real decision under pressure. The system returns a finding,
          a contradiction, a required move, and the next checkpoint. It also
          remembers what entered the record.
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
            Test a Decision
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#refusal-demo"
            className="inline-flex min-h-[44px] items-center"
            style={{
              ...mono,
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.36)",
            }}
          >
            See how refusal works
          </a>
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
