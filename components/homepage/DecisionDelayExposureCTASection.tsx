import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

export default function DecisionDelayExposureCTASection() {
  return (
    <section
      id="decision-delay-exposure"
      className="border-t border-white/[0.05] px-6 py-16 md:py-20"
      style={{ backgroundColor: "rgb(3,3,5)" }}
    >
      <div className="mx-auto max-w-[900px]">
        <div
          className="border px-8 py-10"
          style={{ borderColor: `${HOMEPAGE_GOLD}20`, backgroundColor: `${HOMEPAGE_GOLD}03` }}
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-[44ch]">
              <p
                style={{
                  ...mono,
                  fontSize: "9px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: `${HOMEPAGE_GOLD}80`,
                  marginBottom: "16px",
                }}
              >
                Decision Delay Exposure Instrument
              </p>
              <h2
                style={{
                  ...serif,
                  fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                  lineHeight: 1.1,
                  color: "rgba(255,255,255,0.88)",
                  fontStyle: "italic",
                  letterSpacing: "-0.02em",
                }}
              >
                How much is the deferred decision costing?
              </h2>
              <p className="mt-4 text-[14px] leading-[1.85] text-white/50">
                Enter a weekly cost estimate, delay window, and decision state. The instrument returns
                a governed exposure reading across financial drag, structural consequence, governance
                pressure, and the required next move.
              </p>
              <p className="mt-3 text-[12px] leading-[1.75] text-white/30">
                No login. No data captured. Scenario only.
              </p>
            </div>

            <div className="flex flex-col gap-4 md:items-end md:justify-center">
              <Link
                href="/tools/decision-delay-exposure"
                className="group inline-flex min-h-[52px] items-center gap-3 border px-8 py-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: `${HOMEPAGE_GOLD}55`,
                  backgroundColor: `${HOMEPAGE_GOLD}14`,
                  color: "#F5F5F5",
                  ...mono,
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Open the exposure instrument
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <p
                style={{
                  ...mono,
                  fontSize: "9px",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                  textAlign: "right",
                }}
              >
                Then run the Fast Diagnostic to govern the decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
