import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";

import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";
import { composeReturnBriefV1 } from "@/lib/product/return-brief-composer";
import type { ReturnBriefV1 } from "@/lib/product/return-brief-contract";

type Props =
  | { state: "unauthenticated" }
  | { state: "not_found"; sessionKey: string }
  | { state: "ok"; brief: ReturnBriefV1 };

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const STATUS_COLOR: Record<ReturnBriefV1["status"], string> = {
  ACTIVE: "rgba(252,165,165,0.64)",
  RESOLVED: "rgba(110,231,183,0.64)",
  INSUFFICIENT_EVIDENCE: "rgba(251,191,36,0.60)",
  UNKNOWN: "rgba(255,255,255,0.34)",
};

function Unauthenticated() {
  return (
    <Layout title="Return Brief | Abraham of London" fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
            Authentication required
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "12px" }}>
            This Return Brief is part of a governed case record. Sign in to view it.
          </p>
          <Link href="/decision-centre" style={{ display: "inline-block", marginTop: "20px", ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}CC`, border: `1px solid ${GOLD}40`, padding: "10px 20px", textDecoration: "none" }}>
            Open Decision Centre
          </Link>
        </div>
      </main>
    </Layout>
  );
}

function NotFound() {
  return (
    <Layout title="Return Brief | Abraham of London" fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
            Brief not available
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "12px" }}>
            No governed case record could be found for this reference.
          </p>
          <Link href="/decision-centre" style={{ display: "inline-block", marginTop: "20px", ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}CC`, border: `1px solid ${GOLD}40`, padding: "10px 20px", textDecoration: "none" }}>
            Return to Decision Centre
          </Link>
        </div>
      </main>
    </Layout>
  );
}

const ReturnBriefPage: NextPage<Props> = (props) => {
  if (props.state === "unauthenticated") return <Unauthenticated />;
  if (props.state === "not_found") return <NotFound />;

  const { brief } = props;
  return (
    <Layout
      title="Return Brief | Abraham of London"
      description="Governed Return Brief — the case-specific record reopened when the condition remains active."
      fullWidth
    >
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem", marginBottom: "1rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}99` }}>
              Governed Return Brief
            </p>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginTop: "6px" }}>
              Case reference {brief.caseRef}
            </p>
            <h1 style={{ ...serif, fontSize: "1.45rem", lineHeight: 1.3, color: "rgba(255,255,255,0.90)", marginTop: "12px" }}>
              A Return Brief reopens the governed record when the condition remains active.
            </h1>
            <p style={{ fontSize: "12px", lineHeight: 1.65, color: "rgba(255,255,255,0.34)", marginTop: "10px" }}>
              It is not a fresh assessment or a generic follow-up email.
            </p>
          </header>

          <section style={{ border: `1px solid ${GOLD}25`, background: `${GOLD}05`, padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>
              Status
            </p>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: STATUS_COLOR[brief.status], marginTop: "8px" }}>
              {brief.status.replace(/_/g, " ")}
            </p>
            {brief.elapsedTimeLabel && (
              <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginTop: "6px" }}>
                {brief.elapsedTimeLabel}
              </p>
            )}
          </section>

          <section style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
            {brief.originalCondition && (
              <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Original condition
                </p>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.62)", marginTop: "8px" }}>
                  {brief.originalCondition}
                </p>
              </article>
            )}
            {brief.originalCommitment && (
              <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Original commitment
                </p>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.62)", marginTop: "8px" }}>
                  {brief.originalCommitment}
                </p>
              </article>
            )}
          </section>

          <BriefListSection title="What changed" items={brief.whatChanged} emptyLabel="No completed change has been verified from the current record." />
          <BriefListSection title="What did not change" items={brief.whatDidNotChange} emptyLabel="No unchanged condition could be stated safely from the current record." />
          <BriefListSection title="What is now required" items={brief.nowRequired} emptyLabel="No next move is available from the current record." emphasis />

          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
              Escalation status
            </p>
            <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, marginTop: "8px" }}>
              {brief.escalationStatus?.replace(/_/g, " ") ?? "UNKNOWN"}
            </p>
          </section>

          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
              Provenance status
            </p>
            <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.42)", marginTop: "8px" }}>
              {brief.provenanceStatus === "AVAILABLE"
                ? "Case-specific provenance is available."
                : brief.provenanceStatus === "PENDING"
                  ? "Case-specific provenance is pending."
                  : "Case-specific provenance is not available on this brief."}
            </p>
          </section>

          <section style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", padding: "1rem", marginBottom: "1.5rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              Boundary
            </p>
            <p style={{ fontSize: "11px", lineHeight: 1.65, color: "rgba(255,255,255,0.28)", marginTop: "8px" }}>
              {brief.boundaryNote}
            </p>
          </section>

          <Link href={brief.decisionCentreHref} style={{ display: "inline-flex", alignItems: "center", gap: "6px", ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}BB`, border: `1px solid ${GOLD}35`, padding: "10px 18px", textDecoration: "none" }}>
            Return to Decision Centre
          </Link>
        </div>
      </main>
    </Layout>
  );
};

function BriefListSection({
  title,
  items,
  emptyLabel,
  emphasis = false,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  emphasis?: boolean;
}) {
  return (
    <section style={{ border: emphasis ? `1px solid ${GOLD}22` : "1px solid rgba(255,255,255,0.08)", background: emphasis ? `${GOLD}04` : "rgba(255,255,255,0.015)", padding: "1rem", marginBottom: "1rem" }}>
      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: emphasis ? `${GOLD}88` : "rgba(255,255,255,0.28)" }}>
        {title}
      </p>
      <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
        {(items.length > 0 ? items : [emptyLabel]).map((item) => (
          <p key={item} style={{ fontSize: emphasis ? "13px" : "12px", lineHeight: 1.6, color: emphasis ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.48)" }}>
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const sessionKey = typeof ctx.params?.sessionKey === "string" ? ctx.params.sessionKey : null;
  if (!sessionKey) return { notFound: true };

  const { session, access } = await resolvePageAccess(ctx);
  const email = typeof session?.user?.email === "string" ? session.user.email.toLowerCase() : null;
  if (!access.permissions.isAuthenticated || !email) {
    return { props: { state: "unauthenticated" } };
  }

  const [{ prisma }, { generateReturnBrief }] = await Promise.all([
    import("@/lib/prisma.server"),
    import("@/lib/server/strategy-room/return-brief.server"),
  ]);

  const sessionRecord = await prisma.strategyRoomExecutionSession.findFirst({
    where: {
      email,
      OR: [{ id: sessionKey }, { sessionKey }],
    },
    select: {
      id: true,
      sessionKey: true,
    },
  });

  if (!sessionRecord) {
    return { props: { state: "not_found", sessionKey } };
  }

  const raw = await generateReturnBrief(sessionRecord.id);
  const brief = composeReturnBriefV1(
    raw
      ? {
          sessionKey: raw.sessionKey,
          trigger: raw.trigger,
          trajectory: raw.trajectory,
          contradiction: raw.contradiction,
          delta: raw.delta,
          costOfInaction: raw.costOfInaction
            ? { daysElapsed: raw.costOfInaction.daysElapsed }
            : null,
          verification: raw.verification?.map((item) => ({
            label: item.label,
            status: item.status,
          })) ?? null,
          challenge: raw.challenge,
        }
      : null,
    sessionRecord.sessionKey,
  );

  return { props: { state: "ok", brief } };
};

export default ReturnBriefPage;
