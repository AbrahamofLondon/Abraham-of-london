import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

export default function HomepageFinalCTA() {
  return (
    <section
      id="final-cta"
      className="border-t border-white/[0.05] px-6 py-20 text-center"
      style={{ backgroundColor: "rgb(3,3,5)" }}
    >
      <div className="mx-auto max-w-[760px]">
        <p
          style={{
            ...mono,
            fontSize: "9px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: `${HOMEPAGE_GOLD}88`,
          }}
        >
          Final entry
        </p>
        <h2
          className="mt-4"
          style={{
            ...serif,
            fontSize: "clamp(1.9rem, 4vw, 2.9rem)",
            lineHeight: 1.08,
            color: "rgba(255,255,255,0.86)",
            fontStyle: "italic",
          }}
        >
          Bring one decision the organisation cannot afford to get wrong.
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-[15px] leading-[1.85] text-white/50">
          Start with evidence. If escalation is not earned, the system will say
          so. If the case is real, it will not disappear after the first pass.
        </p>
        <div className="mt-8">
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
        </div>
        <div className="mt-5">
          <Link
            href="/engagements"
            style={{
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.38)",
            }}
          >
            Selective engagements
          </Link>
        </div>
      </div>
    </section>
  );
}
