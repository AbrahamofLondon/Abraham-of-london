import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

export default function StartHereStrip() {
  return (
    <section
      id="start-here"
      className="border-t border-white/[0.05] px-6 py-12 lg:py-14"
      style={{ backgroundColor: "rgb(3,3,5)" }}
    >
      <div className="mx-auto max-w-[1100px]">
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
          Start here
        </p>
        <h2
          className="mb-8 max-w-[42ch]"
          style={{
            ...serif,
            fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
            lineHeight: 1.1,
            color: "rgba(255,255,255,0.88)",
            fontStyle: "italic",
          }}
        >
          Start with the decision in front of you.
        </h2>

        <div className="grid gap-3 md:grid-cols-3">
          {/* Card 1: Free pressure signal */}
          <Link
            href="/decision-pressure"
            className="group flex flex-col justify-between border p-6 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.02]"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.012)",
            }}
          >
            <div>
              <p
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(110,231,183,0.80)",
                  marginBottom: "12px",
                }}
              >
                Free · Open entry
              </p>
              <p
                className="text-[15px] font-light leading-[1.25] text-white/90"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontStyle: "italic" }}
              >
                Free Decision Pressure Signal
              </p>
              <p className="mt-3 text-[13px] leading-[1.65] text-white/50">
                Paste one decision and receive a pressure band, missing evidence, and next admissible move.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Get pressure reading
              </span>
              <ArrowRight className="h-3 w-3 text-white/30 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Card 2: Boardroom Brief — visually strongest */}
          <Link
            href="/boardroom-brief"
            className="group flex flex-col justify-between border p-6 transition-all duration-150 hover:border-[#C9A96E]/40"
            style={{
              borderColor: `${HOMEPAGE_GOLD}28`,
              backgroundColor: `${HOMEPAGE_GOLD}06`,
            }}
          >
            <div>
              <div className="mb-3 flex items-center gap-3">
                <p
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: `${HOMEPAGE_GOLD}CC`,
                  }}
                >
                  Open entry
                </p>
                <span
                  className="border px-2 py-0.5"
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.12em",
                    color: `${HOMEPAGE_GOLD}AA`,
                    borderColor: `${HOMEPAGE_GOLD}30`,
                  }}
                >
                  £99
                </span>
              </div>
              <p
                className="text-[15px] leading-[1.25] text-white/92"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontStyle: "italic" }}
              >
                Boardroom Brief
              </p>
              <p className="mt-3 text-[13px] leading-[1.65] text-white/55">
                Generate a boardroom-style challenge brief for one serious decision.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: `${HOMEPAGE_GOLD}BB`,
                  }}
                >
                  Generate a brief
                </span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" style={{ color: `${HOMEPAGE_GOLD}88` }} />
              </div>
              <Link
                href="/boardroom-brief?sample=true"
                onClick={e => e.stopPropagation()}
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.32)",
                }}
              >
                View sample
              </Link>
            </div>
          </Link>

          {/* Card 3: Enterprise Decision Scan */}
          <Link
            href="/enterprise"
            className="group flex flex-col justify-between border p-6 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.02]"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.012)",
            }}
          >
            <div>
              <p
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(147,197,253,0.75)",
                  marginBottom: "12px",
                }}
              >
                Organisational
              </p>
              <p
                className="text-[15px] leading-[1.25] text-white/90"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontStyle: "italic" }}
              >
                Enterprise Decision Scan
              </p>
              <p className="mt-3 text-[13px] leading-[1.65] text-white/50">
                Assess organisational decision risk across evidence, ownership, authority, dependencies, and execution.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Run organisational scan
              </span>
              <ArrowRight className="h-3 w-3 text-white/30 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
