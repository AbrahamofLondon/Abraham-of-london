/**
 * pages/invite.tsx
 *
 * Accept an organisation invite.
 *
 * /invite?token=xxx
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type State = "loading" | "accepted" | "error" | "auth_required";

const InvitePage: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [state, setState] = React.useState<State>("loading");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (!token || typeof token !== "string") return;

    async function accept() {
      try {
        const res = await fetch("/api/organisation/accept-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.status === 401) {
          setState("auth_required");
          return;
        }

        const data = await res.json() as { ok: boolean; error?: string; reason?: string };
        if (data.ok) {
          setState("accepted");
        } else {
          setState("error");
          setErrorMsg(data.reason ?? data.error ?? "Failed to accept invite");
        }
      } catch {
        setState("error");
        setErrorMsg("Network error");
      }
    }

    void accept();
  }, [token]);

  return (
    <Layout title="Accept Invite | Abraham of London" fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>

          {state === "loading" && (
            <>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "12px" }}>
                Accepting invitation...
              </p>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.40)" }}>Please wait.</p>
            </>
          )}

          {state === "accepted" && (
            <>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.70)", marginBottom: "12px" }}>
                Invitation accepted
              </p>
              <p style={{ ...serif, fontSize: "1.2rem", color: "rgba(255,255,255,0.85)", marginBottom: "20px" }}>
                You have joined the organisation.
              </p>
              <Link href="/account/organisation"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#0A0A0A", backgroundColor: GOLD, padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
                View organisation
              </Link>
            </>
          )}

          {state === "auth_required" && (
            <>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "12px" }}>
                Sign in required
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginBottom: "20px" }}>
                You need to sign in before accepting this invitation.
              </p>
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`}
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#0A0A0A", backgroundColor: GOLD, padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
                Sign in
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.60)", marginBottom: "12px" }}>
                Invitation failed
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginBottom: "20px" }}>
                {errorMsg || "Could not accept this invitation. It may have expired or already been used."}
              </p>
              <Link href="/decision-centre"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "12px 24px", textDecoration: "none", display: "inline-block" }}>
                Go to Decision Centre
              </Link>
            </>
          )}

        </div>
      </main>
    </Layout>
  );
};

export default InvitePage;
