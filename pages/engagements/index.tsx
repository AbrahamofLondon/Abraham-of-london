import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";
import OperatorPilotBlock from "@/components/homepage/OperatorPilotBlock";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function Section({
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>{eyebrow}</p>
      <p className="mt-3 text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-white/60">{body}</p>
      {href && cta ? (
        <div className="mt-5">
          <Link href={href} className="text-sm text-white/72 underline-offset-4 hover:underline">
            {cta}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

const EngagementsPage: NextPage = () => {
  return (
    <Layout
      title="Selective Engagements | Abraham of London"
      description="Selective engagement pathways available where evidence, seriousness, and consequence justify review."
      canonicalUrl="/engagements"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Selective engagements
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Not a product menu.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Abraham of London offers selective engagements only where evidence, seriousness, and consequence justify review. These are continuation pathways for live conditions, not a generic consulting catalogue.
            </p>
          </header>

          <section className="grid gap-6 xl:grid-cols-2">
            <Section
              eyebrow="Selective operator pilot"
              title="A governed trial around one real decision."
              body="Use this when the organisation has a live decision under pressure and needs the system to test the case, name the contradiction, issue the required move, and retain accountability."
              href="/engagements/operator-pilot"
              cta="Review engagement path"
            />
            <Section
              eyebrow="Retained oversight"
              title="Retained institutional memory where the record justifies it."
              body="Use this when the buyer already understands the value of governed continuity and needs sponsor-safe cadence, attention, counsel continuity, boardroom history, and outcome memory."
              href="/engagements/retained-oversight"
              cta="Review retained oversight pathway"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Section
              eyebrow="Counsel review pathway"
              title="Human escalation only when the record warrants it."
              body="Counsel is not a first stop. It is an earned pathway when the system determines that structured review, legal interpretation, or higher judgement is required."
              href="/counsel"
              cta="Continue to Counsel Review"
            />
            <Section
              eyebrow="What must be true first"
              title="Evidence comes before engagement."
              body="Selective engagements are not a starting point. There must be a real decision, real stakes, and enough evidence to justify a governed continuation path. Where that record is absent, the correct instruction is simple: test a decision first."
              href="/diagnostics/fast"
              cta="Test a decision first"
            />
          </section>
        </div>

        <OperatorPilotBlock />
      </main>
    </Layout>
  );
};

export default EngagementsPage;
