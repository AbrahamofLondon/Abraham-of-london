import * as React from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import { COLORS, FONTS, caption, field, primaryButton, bodyTextSm, card } from "@/lib/demo/journey-design";
import { isPilotApiErrorResponse, isPilotStatusSessionResponse, type PilotStatusSessionResponse } from "@/lib/engagements/operator-pilot-api-contract";

type Status = PilotStatusSessionResponse["status"];

export default function OperatorPilotStatusPage() {
  const [secret, setSecret] = React.useState("");
  const [status, setStatus] = React.useState<Status | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadExistingSession() {
    const res = await fetch("/api/engagements/operator-pilot-status");
    if (!res.ok) return;
    const data: unknown = await res.json().catch(() => null);
    if (isPilotStatusSessionResponse(data)) setStatus(data.status);
  }

  React.useEffect(() => { void loadExistingSession(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/engagements/operator-pilot-status-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) { setError(isPilotApiErrorResponse(data) ? data.error : "Unable to validate status access."); return; }
      if (!isPilotStatusSessionResponse(data)) { setError("Status response was not recognised. Please retry."); return; }
      setStatus(data.status);
      setSecret("");
    } catch {
      setError("Status could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Operator Pilot Status | Abraham of London" description="Securely check the current state of an Operator Pilot intake.">
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ minHeight: "100vh", background: COLORS.canvas, color: COLORS.ink, padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 20 }}>
          <div>
            <span style={caption(COLORS.goldSoft)}>Operator Pilot · secure status</span>
            <h1 style={{ fontFamily: FONTS.display, fontWeight: 300, fontSize: "clamp(2rem,5vw,3.2rem)", margin: "10px 0 0" }}>Check the state of your pilot review.</h1>
            <p style={{ ...bodyTextSm, marginTop: 12 }}>Enter the private status secret shown after submission. It is sent in the request body, not placed in the URL, and opens a short-lived secure status session.</p>
          </div>

          <form onSubmit={submit} style={{ ...card(COLORS.gold), display: "grid", gap: 12 }}>
            <label htmlFor="operator-pilot-status-secret" style={{ display: "grid", gap: 8 }}>
              <span style={caption(COLORS.goldSoft)}>Status secret</span>
              <input id="operator-pilot-status-secret" value={secret} onChange={(e) => setSecret(e.target.value)} style={field()} autoComplete="off" spellCheck={false} />
            </label>
            {error && <p role="alert" aria-live="polite" style={{ ...bodyTextSm, color: COLORS.rose }}>{error}</p>}
            <button type="submit" disabled={loading || !secret.trim()} style={{ ...primaryButton(), opacity: loading || !secret.trim() ? 0.55 : 1 }}>{loading ? "Checking..." : "Open status"}</button>
          </form>

          {status && (
            <section style={card(COLORS.emerald)}>
              <span style={caption(COLORS.emerald)}>Current state</span>
              <p style={{ fontFamily: FONTS.display, fontSize: "1.6rem", marginTop: 8 }}>{status.currentState.replace(/_/g, " ")}</p>
              <p style={{ ...bodyTextSm, marginTop: 8 }}>Reference {status.reference} · Last update {new Date(status.lastUpdate).toLocaleString("en-GB")}</p>
              <p style={{ ...bodyTextSm, marginTop: 12 }}>{status.nextExpectedStep}</p>
              {status.requestedInformation && <p style={{ ...bodyTextSm, marginTop: 12, color: COLORS.amber }}>Requested information: {status.requestedInformation}</p>}
              {status.finalDecision && <p style={{ ...bodyTextSm, marginTop: 12 }}>Decision: {status.finalDecision}</p>}
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
}