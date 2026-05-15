import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const surfaces = [
  {
    status: "Free entry",
    label: "Fast Diagnostic",
    summary: "Submit one live decision. Receive a named condition, consequence path, and required move.",
    href: "/diagnostics/fast",
    primary: true,
  },
  {
    status: "Free tool",
    label: "Decision Delay Exposure",
    summary: "GBP exposure calculator. Enter a weekly cost and delay window. No login.",
    href: "/tools/decision-delay-exposure",
    primary: false,
  },
  {
    status: "No login",
    label: "Provenance Sample",
    summary: "Inspect a sample chain-of-custody record — merkle root, chain hash, anchor status.",
    href: "/provenance/sample-export",
    primary: false,
  },
  {
    status: "Paid report layer",
    label: "Executive Reporting",
    summary: "A governed report with named condition, seriousness rating, and required sequence of moves. Opens when earned.",
    href: "/diagnostics/executive-reporting",
    primary: false,
  },
  {
    status: "Governed case console",
    label: "Decision Centre",
    summary: "Active cases, checkpoints, retained memory, and next actions carried forward from prior sessions.",
    href: "/decision-centre",
    primary: false,
  },
];

export default function WhatYouCanUseTodaySection() {
  return (
    <section
      id="available-now"
      className="border-t border-white/[0.05] px-6 py-10"
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
            marginBottom: "20px",
          }}
        >
          What you can use today
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {surfaces.map((surface) => (
            <Link
              key={surface.label}
              href={surface.href}
              className="group flex flex-col justify-between border p-5 transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.02]"
              style={{
                borderColor: surface.primary ? `${HOMEPAGE_GOLD}30` : "rgba(255,255,255,0.07)",
                backgroundColor: surface.primary ? `${HOMEPAGE_GOLD}05` : "rgba(255,255,255,0.012)",
              }}
            >
              <div>
                <p
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: surface.primary ? `${HOMEPAGE_GOLD}CC` : "rgba(255,255,255,0.35)",
                    marginBottom: "10px",
                  }}
                >
                  {surface.status}
                </p>
                <p
                  className="text-[14px] leading-[1.3] text-white/88"
                  style={{ fontWeight: 400 }}
                >
                  {surface.label}
                </p>
                <p className="mt-2 text-[14px] leading-[1.65] text-white/50">
                  {surface.summary}
                </p>
              </div>
              <div className="mt-5">
                <ArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  style={{ color: surface.primary ? `${HOMEPAGE_GOLD}88` : "rgba(255,255,255,0.22)" }}
                />
              </div>
            </Link>
          ))}
        </div>

        <div
          className="mx-auto mt-6 max-w-[760px] border border-white/[0.06] bg-white/[0.01] px-5 py-3 text-center"
        >
          <p
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.30)",
              lineHeight: 1.7,
            }}
          >
            Entry diagnostics and public tools are available without a consultation. Executive reporting, intervention, and retained oversight are paid or qualification-gated layers.
          </p>
        </div>
      </div>
    </section>
  );
}
