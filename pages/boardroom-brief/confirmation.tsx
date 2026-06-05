/* pages/boardroom-brief/confirmation.tsx — Boardroom Brief Payment Confirmation */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";

type Props = {
  orderId: string | null;
  email: string | null;
  hasOrder: boolean;
};

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const ConfirmationPage: NextPage<Props> = ({ orderId, email, hasOrder }) => {
  return (
    <Layout title="Boardroom Brief — Confirmation | Abraham of London" fullWidth headerTransparent>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white" }}>
        <div className="mx-auto max-w-2xl px-6 py-24 lg:px-8">
          <div style={{ border: `1px solid ${GOLD}30`, backgroundColor: `${GOLD}06`, padding: "2.5rem" }}>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 style={{ width: "24px", height: "24px", color: GOLD }} />
              <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD }}>
                Payment Received
              </span>
            </div>

            <h1 style={{ ...serif, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.90)", fontStyle: "italic" }}>
              Your Boardroom Brief is being prepared.
            </h1>

            <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: "1.25rem" }}>
              Thank you for your order. Your Boardroom Brief is now in review. A member of the team will
              review your intake and deliver the full brief within two business days.
            </p>

            {orderId ? (
              <div style={{ marginTop: "1.5rem", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Order Reference
                </p>
                <p style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.60)", marginTop: "0.3rem" }}>
                  {orderId}
                </p>
              </div>
            ) : null}

            {email ? (
              <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginTop: "1rem" }}>
                A confirmation will be sent to <span style={{ color: "rgba(255,255,255,0.60)" }}>{email}</span>.
              </p>
            ) : null}

            <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.75rem" }}>
                What happens next
              </p>
              <div style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(255,255,255,0.50)" }}>
                <p>1. Your intake is reviewed by the team.</p>
                <p>2. The full Boardroom Brief is generated with objection handling, decision paths, and next admissible move.</p>
                <p>3. You receive the dossier and a follow-up discussion is scheduled if appropriate.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/inner-circle/dashboard"
                style={{ padding: "12px 22px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                Return to Dashboard <ArrowRight style={{ width: "11px", height: "11px" }} />
              </Link>
              <Link
                href="/boardroom-brief"
                style={{ padding: "12px 22px", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)", ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                Boardroom Brief <ArrowRight style={{ width: "11px", height: "11px" }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const sessionId = context.query?.session_id;
  let orderId: string | null = null;
  let email: string | null = null;
  let hasOrder = false;

  if (typeof sessionId === "string") {
    try {
      const { prisma } = await import("@/lib/prisma");
      const order = await prisma.boardroomBriefOrder.findUnique({
        where: { stripeSessionId: sessionId },
        select: { id: true, email: true },
      });
      if (order) {
        orderId = order.id;
        email = order.email;
        hasOrder = true;
      }
    } catch {
      // Graceful fallback
    }
  }

  return {
    props: { orderId, email, hasOrder },
  };
};

export default ConfirmationPage;
