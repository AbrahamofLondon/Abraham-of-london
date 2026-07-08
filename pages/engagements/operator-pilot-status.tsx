import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import { recordJourneyEvent } from "@/lib/demo/record-journey-event";
import { COLORS, caption, display, bodyText, bodyTextSm, card, primaryButton, field } from "@/lib/demo/journey-design";

type Status = { reference: string; currentState: string; lastUpdate: string; requestedInformation: string | null; nextExpectedStep: string; finalDecision: string | null };

const StatusPage: NextPage = () => {
  const [reference, setReference] = React.useState("");
  const [status, setStatus] = React.useState<Status | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { recordJourneyEvent("PILOT_STATUS_VIEWED"); }, []);

  async function lookup() {
    setLoading(true); setError(null); setStatus(null);
    try {
      const res = await fetch(`/api/engagements/operator-pilot?ref=${encodeURIComponent(reference.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data?.error === "not found" ? "No intake matches that reference." : data?.error ?? "Lookup failed."); return; }
      setStatus(data);
    } catch { setError("Status could not be loaded."); }
    finally { setLoading(false); }
  }

  return (
    <Layout title="Operator Pilot Status | Abraham of London" description="Check the status of a governed Operator Pilot intake.">
      <main style={{ minHeight: "100vh", background: COLORS.canvas, color: COLORS.ink, padding: "72px 24px 120px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 22 }}>
          <div>
            <span style={caption(COLORS.goldSoft)}>Operator Pilot · customer status</span>
            <h1 style={{ ...display, fontSize: "clamp(2.2rem,5vw,3.2rem)", marginTop: 12 }}>Check your pilot review state.</h1>
            <p style={{ ...bodyText, marginTop: 14 }}>Use the reference returned after submission. The status view exposes only customer-safe state: no operator notes, no queue internals, and no other submissions.</p>
          </div>
          <section style={card()}>
            <label style={caption()}>Pilot reference</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="pilot_..." style={field()} />
            {error && <p style={{ ...bodyTextSm, color: COLORS.rose, marginTop: 10 }}>{error}</p>}
            <button onClick={lookup} disabled={loading || reference.trim().length < 12} style={{ ...primaryButton(), marginTop: 14, opacity: loading || reference.trim().length < 12 ? 0.6 : 1 }}>
              {loading ? "Checking" : "Check status"}
            </button>
          </section>
          {status && (
            <section style={card(COLORS.emerald)}>
              <span style={caption(COLORS.emerald)}>Current state</span>
              <p style={{ ...display, fontSize: "1.6rem", marginTop: 8 }}>{status.currentState}</p>
              <p style={{ ...bodyTextSm, marginTop: 8 }}>Reference: {status.reference} · Last update: {new Date(status.lastUpdate).toLocaleString()}</p>
              <p style={{ ...bodyText, marginTop: 12 }}>{status.nextExpectedStep}</p>
              {status.requestedInformation && <p style={{ ...bodyTextSm, marginTop: 10 }}><strong style={{ color: COLORS.gold }}>Requested information: </strong>{status.requestedInformation}</p>}
              {status.finalDecision && <p style={{ ...bodyTextSm, marginTop: 10 }}><strong style={{ color: COLORS.gold }}>Final decision: </strong>{status.finalDecision}</p>}
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default StatusPage;
