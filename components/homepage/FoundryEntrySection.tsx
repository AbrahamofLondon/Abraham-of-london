import Link from "next/link";
import { HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const TESTS = [
  {
    label: "Test a Decision",
    href: "/foundry/decision-test",
    desc: "Submit a decision. Get a risk score, evidence gaps, and authority flags.",
    detail: "Risk score · Evidence gaps · Authority flags · Next action",
  },
  {
    label: "Check a Market Signal",
    href: "/foundry/market-signal-test",
    desc: "Paste a claim or offer. Assess overclaim risk, clarity, and buyer friction.",
    detail: "Overclaim risk · Clarity score · Buyer friction · Credibility flags",
  },
  {
    label: "Check Release Risk",
    href: "/foundry/release-risk-test",
    desc: "Describe a release. Get a proceed / hold / escalate directive.",
    detail: "Release readiness · Approval gaps · Hidden dependencies · Risk severity",
  },
];

export default function FoundryEntrySection() {
  return (
    <section
      id="foundry-entry"
      className="border-t border-white/[0.05] px-6 py-16 lg:py-20"
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
            marginBottom: "8px",
          }}
        >
          The Decision Foundry
        </p>
        <h2
          className="font-serif text-2xl font-light italic leading-tight sm:text-3xl"
          style={{ color: "rgba(255,255,255,0.85)", marginBottom: "24px" }}
        >
          Three public tests. No sign-up. Each returns a specific result.
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {TESTS.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="group flex flex-col justify-between border p-5 transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.02]"
              style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.012)" }}
            >
              <div>
                <div
                  style={{ height: "2px", width: "1.5rem", backgroundColor: `${HOMEPAGE_GOLD}77`, marginBottom: "1rem" }}
                />
                <p
                  style={{
                    ...mono,
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: `${HOMEPAGE_GOLD}AA`,
                    marginBottom: "6px",
                  }}
                >
                  Public test
                </p>
                <h3
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.85)", marginBottom: "8px" }}
                >
                  {t.label}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {t.desc}
                </p>
                <p
                  className="mt-3 text-[9px] leading-relaxed"
                  style={{ ...mono, color: "rgba(255,255,255,0.30)" }}
                >
                  {t.detail}
                </p>
              </div>
              <p
                className="mt-4 text-[10px] uppercase tracking-widest font-medium"
                style={{ ...mono, color: `${HOMEPAGE_GOLD}BB` }}
              >
                Run test →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/foundry"
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors"
            style={{ ...mono, color: "rgba(255,255,255,0.30)" }}
          >
            Explore all Foundry tests →
          </Link>
        </div>
      </div>
    </section>
  );
}
