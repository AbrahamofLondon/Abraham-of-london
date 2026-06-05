import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import Layout from "@/components/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";

const GOLD = "#C9A96E";
const RULE = "rgba(255,255,255,0.08)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export default function InnerCircleBriefingsPage() {
  return (
    <Layout title="Inner Circle Briefings | Abraham of London" fullWidth>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <WorkspaceNav />
        <section className="border-b px-6 pb-10 pt-20" style={{ borderBottomColor: RULE }}>
          <div className="mx-auto max-w-5xl">
            <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
              Monthly Briefing Archive · MVP
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2rem,4vw,3rem)] font-light italic leading-none text-white/90">
              One monthly pattern, one audit, one governed next action.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/48">
              The archive begins with a monthly cadence only. Weekly content and live sessions are intentionally withheld until operational capacity and engagement justify expansion.
            </p>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <article className="border p-6 md:p-8" style={{ borderColor: RULE, backgroundColor: "rgba(255,255,255,0.014)" }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5" style={{ color: GOLD }} />
                  <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                    June 2026
                  </p>
                </div>
                <span style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Founder Under Pressure
                </span>
              </div>

              <h2 className="mt-6 font-serif text-3xl italic text-white/88">
                Founder dependency is not resilience.
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <BriefingBlock title="Institutional pattern">
                  The leader becomes the memory store, escalation layer, final quality control, and emotional shock absorber. The organisation calls this commitment. In practice, it is key-person fragility.
                </BriefingBlock>
                <BriefingBlock title="Why it matters">
                  Under pressure, founder dependency narrows decision bandwidth and prevents second-line authority from maturing. Growth then hides fragility until the founder becomes unavailable or overloaded.
                </BriefingBlock>
                <BriefingBlock title="What to audit this month">
                  Name one decision bottleneck, one unowned decision, and one judgment area that still depends on founder presence. Then complete the Rise-Decay Scorecard.
                </BriefingBlock>
                <BriefingBlock title="Recommended next action">
                  If the scorecard returns High or Critical risk, move the case into Boardroom Brief or Strategy Room rather than continuing self-guided review.
                </BriefingBlock>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/vault/briefs/frontier-resilience-founder-endurance-is-not-a-plan" label="Related Vault brief" />
                <LinkButton href="/inner-circle/tools/rise-decay-scorecard" label="Open scorecard" />
                <LinkButton href="/inner-circle/dashboard" label="Return to dashboard" />
              </div>
            </article>
          </div>
        </section>
      </main>
    </Layout>
  );
}

function BriefingBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-4" style={{ borderTopColor: RULE }}>
      <h3 style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase" }}>
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-white/56">{children}</p>
    </section>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 border px-5 py-3 text-[9px] uppercase tracking-[0.15em]"
      style={{ ...mono, borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}12` }}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const [{ getServerSession }, { authOptions }, { ensureOperatingProfile }] = await Promise.all([
    import("next-auth/next"),
    import("@/lib/auth/options"),
    import("@/lib/inner-circle/operating-repository.server"),
  ]);

  const session = await getServerSession(context.req, context.res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/inner-circle/briefings",
        permanent: false,
      },
    };
  }

  await ensureOperatingProfile({
    userId,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
  });

  return { props: {} };
};
