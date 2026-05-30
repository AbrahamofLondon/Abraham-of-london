/* pages/foundry/brief/success.tsx
 *
 * Payment success page for Decision Failure Brief.
 * Confirms payment, shows reference, explains turnaround.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const TIER_LABELS: Record<string, { label: string; turnaround: string }> = {
  basic:  { label: "Basic",  turnaround: "72 hours" },
  full:   { label: "Full",   turnaround: "48 hours" },
  urgent: { label: "Urgent", turnaround: "24 hours" },
};

export default function BriefSuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;

  const [status, setStatus] = React.useState<"loading" | "confirmed" | "error">("loading");
  const [order, setOrder] = React.useState<{
    reference: string;
    tier: string;
    email: string;
    verificationToken?: string;
  } | null>(null);

  React.useEffect(() => {
    if (!session_id || typeof session_id !== "string") return;

    fetch("/api/checkout/decision-failure-brief-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session_id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setOrder({
            reference: data.reference,
            tier: data.tier,
            email: data.email,
            verificationToken: data.verificationToken,
          });
          setStatus("confirmed");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [session_id]);

  return (
    <Layout
      title="Brief Ordered | Abraham of London"
      description="Your Decision Failure Brief has been ordered."
      canonicalUrl="/foundry/brief/success"
    >
      <Head><title>Brief Ordered | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl px-6 py-24 lg:px-10">

          {status === "loading" && (
            <div className="text-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4">
                Confirming payment...
              </p>
              <div className="animate-pulse h-8 w-48 mx-auto rounded bg-white/5" />
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-red-400/60 mb-4">
                Confirmation pending
              </p>
              <p className="text-sm text-white/60 mb-6">
                Your payment was received but we are still confirming the order.
                If this persists, contact us with your session ID: {session_id}
              </p>
              <Link
                href="/foundry"
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Back to Foundry
              </Link>
            </div>
          )}

          {status === "confirmed" && order && (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: `${GOLD}15` }}>
                  <span className="text-xl" style={{ color: GOLD }}>✓</span>
                </div>
                <h1 className="font-serif text-3xl font-light italic leading-tight text-white/90">
                  Decision Failure Brief ordered
                </h1>
                <p className="mt-3 text-sm text-white/50">
                  Your brief is being prepared. You will receive it at <strong className="text-white/70">{order.email}</strong>.
                </p>
              </div>

              {/* Order details */}
              <div className="border p-6 space-y-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">Reference</span>
                  <span className="font-mono text-sm text-white/70">{order.reference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">Tier</span>
                  <span className="font-mono text-sm text-white/70">
                    {TIER_LABELS[order.tier]?.label ?? order.tier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">Expected turnaround</span>
                  <span className="font-mono text-sm text-white/70">
                    {TIER_LABELS[order.tier]?.turnaround ?? "72 hours"}
                  </span>
                </div>
                {order.verificationToken && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">Verification token</span>
                    <span className="font-mono text-sm" style={{ color: GOLD }}>{order.verificationToken}</span>
                  </div>
                )}
              </div>

              {/* What happens next */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">What happens next</p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/60">
                    <span className="font-mono text-[8px] text-white/25 mt-0.5">01</span>
                    <span>Your submission is reviewed by the Foundry team.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/60">
                    <span className="font-mono text-[8px] text-white/25 mt-0.5">02</span>
                    <span>The Decision Failure Map is generated using the full engine.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/60">
                    <span className="font-mono text-[8px] text-white/25 mt-0.5">03</span>
                    <span>A human review is applied to ensure accuracy and actionable output.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/60">
                    <span className="font-mono text-[8px] text-white/25 mt-0.5">04</span>
                    <span>The brief is delivered to your email with a verifiable record reference.</span>
                  </li>
                </ol>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link
                  href="/foundry"
                  className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
                >
                  Back to Foundry
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </Layout>
  );
}
