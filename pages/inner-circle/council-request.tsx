/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/inner-circle/council-request.tsx — P2: Private Council Intake */
/* Shown when: repeated High/Critical diagnostics, Council Candidate flag exists */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ShieldCheck, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

import Layout from "@/components/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";

type Props = {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  diagnosticCount: number;
  latestRiskLevel: string;
};

const GOLD = "#C9A96E";
const RULE = "rgba(255,255,255,0.08)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const CouncilRequestPage: NextPage<Props> = ({
  userId,
  userName,
  userEmail,
  diagnosticCount,
  latestRiskLevel,
}) => {
  const router = useRouter();
  const [phase, setPhase] = React.useState<"form" | "submitted" | "error">("form");
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: userName || "",
    email: userEmail || "",
    organisation: "",
    governanceCategory: "",
    urgency: "",
    preferredNextStep: "",
    consent: false,
  });

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/inner-circle/council-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          diagnosticCount,
          latestRiskLevel,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPhase("submitted");
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Private Council Review | Inner Circle" fullWidth>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <WorkspaceNav />
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-20">
          {phase === "submitted" ? (
            <div className="border p-8 text-center" style={{ borderColor: "rgba(201,169,110,0.22)", backgroundColor: "rgba(201,169,110,0.045)" }}>
              <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: GOLD }} />
              <h1 className="mt-6 font-serif text-3xl italic text-white/88">
                Request submitted
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/50">
                Your Private Council review request has been received. A member of the team will
                review your diagnostic history and contact you within two business days.
              </p>
              <Link
                href="/inner-circle/dashboard"
                className="mt-8 inline-flex items-center gap-2 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5"
                style={{ borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14` }}
              >
                Return to Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4" style={{ color: GOLD }} />
                <span className="font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: `${GOLD}AA` }}>
                  Private Council · Selective Intake
                </span>
              </div>

              <h1 className="mt-6 font-serif text-[clamp(2rem,4vw,3rem)] font-light italic leading-none text-white/90">
                Request Private Council Review
              </h1>

              <p className="mt-5 text-sm leading-7 text-white/48">
                Your diagnostic history indicates repeated high-severity governance exposure.
                Private Council review is available to members whose risk profile exceeds
                self-guided diagnostic capacity.
              </p>

              <div className="mt-6 border p-4" style={{ borderColor: "rgba(201,169,110,0.18)", backgroundColor: "rgba(201,169,110,0.04)" }}>
                <p className="font-mono text-[7px] uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.38)" }}>
                  Your diagnostic profile
                </p>
                <div className="mt-3 grid gap-2 text-sm text-white/60">
                  <p>Completed diagnostics: <span className="text-white/80">{diagnosticCount}</span></p>
                  <p>Latest risk level: <span className="text-white/80">{latestRiskLevel}</span></p>
                </div>
              </div>

              {phase === "error" ? (
                <div className="mt-6 border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-red-400">
                    Submission failed
                  </p>
                  <p className="mt-1 text-xs text-red-300/80">
                    Could not submit your request. Please try again or contact support.
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="mt-2 w-full border bg-transparent px-4 py-3 text-sm text-white"
                      style={{ borderColor: RULE }}
                      required
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="mt-2 w-full border bg-transparent px-4 py-3 text-sm text-white"
                      style={{ borderColor: RULE }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">
                    Organisation <span className="text-white/20">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.organisation}
                    onChange={(e) => updateField("organisation", e.target.value)}
                    className="mt-2 w-full border bg-transparent px-4 py-3 text-sm text-white"
                    style={{ borderColor: RULE }}
                  />
                </div>

                <div>
                  <label className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">
                    Governance category
                  </label>
                  <select
                    value={form.governanceCategory}
                    onChange={(e) => updateField("governanceCategory", e.target.value)}
                    className="mt-2 w-full border bg-[rgb(3,3,5)] px-4 py-3 text-sm text-white"
                    style={{ borderColor: RULE }}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="authority-clarity">Authority & Decision Rights</option>
                    <option value="capital-sovereignty">Capital & Sovereignty</option>
                    <option value="lead-succession">Leadership & Succession</option>
                    <option value="operational-cadence">Operating Cadence & Strain</option>
                    <option value="cultural-integrity">Cultural Integrity & Drift</option>
                    <option value="legacy-transmission">Legacy & Transmission</option>
                    <option value="board-governance">Board & Governance Structure</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">Urgency</label>
                  <select
                    value={form.urgency}
                    onChange={(e) => updateField("urgency", e.target.value)}
                    className="mt-2 w-full border bg-[rgb(3,3,5)] px-4 py-3 text-sm text-white"
                    style={{ borderColor: RULE }}
                    required
                  >
                    <option value="">Select urgency level</option>
                    <option value="immediate">Immediate — within days</option>
                    <option value="urgent">Urgent — within two weeks</option>
                    <option value="soon">Soon — within the month</option>
                    <option value="exploratory">Exploratory — no fixed timeline</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">
                    Preferred next step
                  </label>
                  <select
                    value={form.preferredNextStep}
                    onChange={(e) => updateField("preferredNextStep", e.target.value)}
                    className="mt-2 w-full border bg-[rgb(3,3,5)] px-4 py-3 text-sm text-white"
                    style={{ borderColor: RULE }}
                  >
                    <option value="">Select preferred next step</option>
                    <option value="discovery-call">Discovery call</option>
                    <option value="boardroom-brief">Boardroom Brief</option>
                    <option value="strategy-room">Strategy Room review</option>
                    <option value="retainer-oversight">Retainer Oversight discussion</option>
                    <option value="not-sure">Not sure — need guidance</option>
                  </select>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={form.consent}
                    onChange={(e) => updateField("consent", e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <label htmlFor="consent" className="text-xs leading-6 text-white/40">
                    I consent to being contacted regarding this request. I understand this is
                    a selective intake and submission does not guarantee acceptance into
                    Private Council.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !form.consent}
                  className="inline-flex min-h-11 items-center gap-2 border px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5 disabled:opacity-40"
                  style={{ borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14` }}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const [{ getServerSession }, { authOptions }, { prisma }] = await Promise.all([
    import("next-auth/next"),
    import("@/lib/auth/options"),
    import("@/lib/prisma"),
  ]);

  const session = await getServerSession(context.req, context.res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/inner-circle/council-request",
        permanent: false,
      },
    };
  }

  const profile = await prisma.$queryRaw<Array<{
    email: string | null;
    name: string | null;
  }>>`
    SELECT email, name FROM inner_circle_profiles WHERE user_id = ${userId} LIMIT 1
  `;

  const diagnosticCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM inner_circle_diagnostic_results
    WHERE user_id = ${userId}
  `;

  const latestResult = await prisma.$queryRaw<Array<{ risk_level: string }>>`
    SELECT risk_level
    FROM inner_circle_diagnostic_results
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return {
    props: {
      userId,
      userName: profile[0]?.name ?? null,
      userEmail: profile[0]?.email ?? null,
      diagnosticCount: Number(diagnosticCount[0]?.count ?? 0),
      latestRiskLevel: latestResult[0]?.risk_level ?? "Unknown",
    },
  };
};

export default CouncilRequestPage;
