import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import type { NextPage } from "next";

import Layout from "@/components/Layout";
import { getPublicGmiCallLedger } from "@/lib/intelligence/gmi-instrument";
import {
  listPublicAcknowledgedGmiRedTeamSubmissions,
  type GmiRedTeamSubmissionView,
} from "@/lib/intelligence/gmi-red-team-store";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const calls = getPublicGmiCallLedger();

type Props = {
  acknowledged: GmiRedTeamSubmissionView[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      acknowledged: await listPublicAcknowledgedGmiRedTeamSubmissions(),
    },
    revalidate: 1800,
  };
};

const GmiRedTeamPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ acknowledged }) => {
  return (
    <Layout
      title="GMI Red Team Challenge | Abraham of London"
      description="Governed challenge intake for Global Market Intelligence calls, assumptions, and falsification thresholds."
      canonicalUrl="/intelligence/gmi/red-team"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Red Team Challenge
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              Challenge a call with evidence, not theatre.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              Accepted challenges must cite evidence, name the call or threshold being challenged, and survive editorial review. Strong challenges may appear in the next edition or Red Team Register.
            </p>
          </header>

          <form method="post" action="/api/gmi/red-team" className="space-y-4 border border-white/10 bg-white/[0.015] p-6">
            <label className="block">
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/38" style={mono}>Call being challenged</span>
              <select name="callId" className="mt-2 w-full border border-white/12 bg-black px-3 py-2 text-sm text-white/75">
                {calls.map((call) => (
                  <option key={call.callId} value={call.callId}>{call.callId}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/38" style={mono}>Counter-thesis</span>
              <textarea name="counterThesis" rows={5} className="mt-2 w-full border border-white/12 bg-black px-3 py-2 text-sm text-white/75" />
            </label>
            <label className="block">
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/38" style={mono}>Evidence</span>
              <textarea name="evidence" rows={5} className="mt-2 w-full border border-white/12 bg-black px-3 py-2 text-sm text-white/75" />
            </label>
            <label className="block">
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/38" style={mono}>Source link</span>
              <input name="sourceLinks" type="url" className="mt-2 w-full border border-white/12 bg-black px-3 py-2 text-sm text-white/75" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-[9px] uppercase tracking-[0.18em] text-white/38" style={mono}>Name</span>
                <input name="submitterName" className="mt-2 w-full border border-white/12 bg-black px-3 py-2 text-sm text-white/75" />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase tracking-[0.18em] text-white/38" style={mono}>Email</span>
                <input name="submitterEmail" type="email" className="mt-2 w-full border border-white/12 bg-black px-3 py-2 text-sm text-white/75" />
              </label>
            </div>
            <label className="flex items-start gap-3 text-xs leading-5 text-white/46">
              <input name="consentToPublishIfSelected" type="checkbox" value="true" className="mt-1" />
              <span>I consent to publication if this challenge is selected after editorial review.</span>
            </label>
            <button type="submit" className="border border-[#C9A96E]/35 bg-[#C9A96E]/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#E6C98C]" style={mono}>
              Submit challenge
            </button>
          </form>

          <section className="border border-white/10 bg-white/[0.015] p-6">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Red Team Register
            </p>
            {acknowledged.length > 0 ? (
              <div className="mt-4 space-y-3">
                {acknowledged.map((submission) => (
                  <article key={submission.id} className="border border-white/8 bg-black/20 p-4">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/32" style={mono}>
                      {submission.id} · {submission.status}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/62">{submission.counterArgument}</p>
                    {submission.publicResponse ? (
                      <p className="mt-3 border-l border-[#C9A96E]/35 pl-3 text-xs leading-6 text-white/48">
                        {submission.publicResponse}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-white/42">
                No public Red Team challenges have been acknowledged yet.
              </p>
            )}
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiRedTeamPage;
