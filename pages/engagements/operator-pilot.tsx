import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const sequence = [
  "Homepage refusal thesis",
  "Fast Diagnostic live",
  "Fast Result",
  "Decision Centre",
  "Executive Reporting result",
  "Strategy Room",
  "Return Brief",
  "Evidence Standards close",
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>{title}</p>
      <div className="mt-3 text-sm leading-7 text-white/60">{children}</div>
    </section>
  );
}

const OperatorPilotPage: NextPage = () => {
  return (
    <Layout
      title="Operator Pilot | Selective Engagement"
      description="Buyer-facing selective operator pilot pathway."
      canonicalUrl="/engagements/operator-pilot"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Selective engagement · operator pilot</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              A governed trial around one real decision.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Bring one serious decision your organisation cannot afford to keep circling. The system will test it, identify the contradiction, issue a required move, schedule accountability, and show what changes.
            </p>
          </header>

          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="Who it is for">
              Operators, founders, and executives carrying a real decision under pressure, with authority, consequence, and a willingness to let the record govern what happens next.
            </Block>
            <Block title="What decision the operator brings">
              One live decision with real stakes, a real constraint environment, and a real cost to drift. This is not for generic ideation, theatre, or platform browsing.
            </Block>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="What the system tests">
              Evidence, authority, consequence, execution reality, contradiction, and whether escalation is actually earned.
            </Block>
            <Block title="What gets returned">
              A governed finding, the contradiction or exposure holding the case in place, a required move, a checkpoint, and a next-step architecture.
            </Block>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="What gets remembered">
              The submitted decision record, the result, the contradiction, the required move, checkpoint state, and any earned follow-up surfaces such as Return Brief, counsel, proof, or retained oversight.
            </Block>
            <Block title="What follow-up happens">
              Decision Centre continuity, Executive Reporting, Strategy Room, Return Brief if the condition remains unresolved, and later proof surfaces where outcomes are actually verified.
            </Block>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="What is not promised">
              No promise of instant transformation. No promise that every case will be cleared to proceed. No promise of verified improvement without verification. No promise that escalation is always justified.
            </Block>
            <Block title="Pilot success criteria">
              Within 14 to 30 days, one serious decision has been tested under evidence and consequence, the contradiction has been named clearly, a required move has been issued, accountability has been scheduled, and the organisation can see whether anything actually changed.
            </Block>
          </section>

          <Block title="Demo sequence">
            <ol className="space-y-2">
              {sequence.map((step, index) => (
                <li key={step}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </Block>

          <div className="flex flex-wrap gap-3">
            <Link href="/engagements/selective-pilot" className="border border-white/10 px-4 py-3 text-sm text-white/72 transition hover:bg-white/5">View selective pilot terms</Link>
            <Link href="/diagnostics/fast" className="border border-white/10 px-4 py-3 text-sm text-white/72 transition hover:bg-white/5">Test a decision first</Link>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default OperatorPilotPage;
