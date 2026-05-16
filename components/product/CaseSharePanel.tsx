import * as React from "react";

import ContextualUpgradePrompt from "@/components/product/ContextualUpgradePrompt";
import type { CaseShareRecord, CaseShareRole } from "@/lib/product/case-sharing-contract";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type ProfessionalState = "loading" | "free" | "professional";

export default function CaseSharePanel({ caseId }: { caseId: string }) {
  const [professionalState, setProfessionalState] = React.useState<ProfessionalState>("loading");
  const [role, setRole] = React.useState<CaseShareRole>("VIEWER");
  const [expiresInDays, setExpiresInDays] = React.useState(7);
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [allowExport, setAllowExport] = React.useState(false);
  const [shares, setShares] = React.useState<CaseShareRecord[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [createdUrl, setCreatedUrl] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/trial/status").then((res) => res.json()).catch(() => null),
      fetch(`/api/cases/share?caseId=${encodeURIComponent(caseId)}`).then((res) => res.json()).catch(() => null),
    ]).then(([trialData, sharesData]) => {
      if (cancelled) return;
      const status = trialData?.trial?.status;
      setProfessionalState(status === "ACTIVE" || status === "CONVERTED" ? "professional" : "free");
      if (sharesData?.ok && Array.isArray(sharesData.shares)) {
        setShares(sharesData.shares);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function createShare() {
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/cases/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          role,
          recipientEmail: recipientEmail.trim() || undefined,
          expiresInDays,
          allowExport: role === "AUDITOR" ? allowExport : false,
        }),
      });
      const data = await response.json() as {
        ok?: boolean;
        shareId?: string;
        shareUrl?: string;
        expiresAt?: string;
        role?: CaseShareRole;
        code?: string;
        actionType?: string;
        error?: string;
      };
      if (response.status === 403 && data.code === "PROFESSIONAL_REQUIRED") {
        setProfessionalState("free");
        setShowUpgradePrompt(true);
        return;
      }
      if (!response.ok || !data.ok || !data.shareId || !data.shareUrl || !data.expiresAt || !data.role) {
        setMessage(data.error ?? "Share link could not be created.");
        return;
      }

      const nextShare: CaseShareRecord = {
        id: data.shareId,
        caseId,
        ownerEmail: "",
        recipientEmail: recipientEmail.trim() || null,
        role: data.role,
        status: "ACTIVE",
        tokenHash: "",
        allowExport: role === "AUDITOR" ? allowExport : false,
        expiresAt: data.expiresAt,
        createdAt: new Date().toISOString(),
        revokedAt: null,
      };
      setShares((current) => [nextShare, ...current]);
      setCreatedUrl(data.shareUrl);
      setMessage("Share link created.");
    } catch {
      setMessage("Network error — share link could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeShare(shareId: string) {
    const response = await fetch("/api/cases/share/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId }),
    });
    if (!response.ok) {
      setMessage("Share link could not be revoked.");
      return;
    }
    setShares((current) => current.map((share) => (
      share.id === shareId
        ? { ...share, status: "REVOKED", revokedAt: new Date().toISOString() }
        : share
    )));
    setMessage("Share link revoked.");
  }

  async function copyShareLink() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setMessage("Share link copied.");
    } catch {
      setMessage("Copy failed — select the link manually.");
    }
  }

  return (
    <>
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "rgba(255,255,255,0.01)",
          padding: "1rem",
        }}
      >
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.5rem" }}>
          Share this case
        </p>

        {professionalState !== "professional" ? (
          <>
            <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)" }}>
              Sharing cases with reviewers is a Professional collaboration feature.
            </p>
            <button
              type="button"
              onClick={() => setShowUpgradePrompt(true)}
              style={{
                ...mono,
                marginTop: "0.8rem",
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#0A0A0A",
                backgroundColor: GOLD,
                border: "none",
                padding: "0.6rem 0.9rem",
                cursor: "pointer",
              }}
            >
              Try Professional free for 7 days
            </button>
          </>
        ) : (
          <>
            <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginBottom: "0.9rem" }}>
              Create a client-safe reviewer link. Shared recipients can never edit the governed record or see raw evidence.
            </p>
            <div style={{ display: "grid", gap: "0.7rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.7rem" }}>
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Role</span>
                  <select value={role} onChange={(event) => setRole(event.target.value as CaseShareRole)}
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", padding: "0.55rem" }}>
                    <option value="VIEWER">Viewer</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Expiry</span>
                  <select value={expiresInDays} onChange={(event) => setExpiresInDays(Number(event.target.value))}
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", padding: "0.55rem" }}>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: "0.35rem" }}>
                <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                  Recipient email (optional)
                </span>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  placeholder="reviewer@example.com"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", padding: "0.55rem" }}
                />
              </label>

              {role === "AUDITOR" && (
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>
                  <input type="checkbox" checked={allowExport} onChange={(event) => setAllowExport(event.target.checked)} />
                  Allow client-safe evidence export
                </label>
              )}

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={createShare}
                  disabled={creating}
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: creating ? "rgba(255,255,255,0.24)" : "#0A0A0A",
                    backgroundColor: creating ? "rgba(255,255,255,0.08)" : GOLD,
                    border: "none",
                    padding: "0.6rem 0.9rem",
                    cursor: creating ? "not-allowed" : "pointer",
                  }}
                >
                  {creating ? "Creating…" : "Create share link"}
                </button>
                {createdUrl && (
                  <button
                    type="button"
                    onClick={copyShareLink}
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: `${GOLD}AA`,
                      border: `1px solid ${GOLD}28`,
                      backgroundColor: "transparent",
                      padding: "0.6rem 0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    Copy link
                  </button>
                )}
              </div>

              {createdUrl && (
                <p style={{ fontSize: "11px", lineHeight: 1.5, color: `${GOLD}AA`, wordBreak: "break-all" }}>
                  {createdUrl}
                </p>
              )}
            </div>

            {shares.length > 0 && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.85rem" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.5rem" }}>
                  Existing links
                </p>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {shares.map((share) => (
                    <div key={share.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)", padding: "0.55rem 0.7rem" }}>
                      <div>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.58)" }}>
                          {share.role} · expires {new Date(share.expiresAt).toLocaleDateString("en-GB")}
                        </p>
                        <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
                          {share.status.toLowerCase().replace(/_/g, " ")}
                          {share.allowExport ? " · export enabled" : ""}
                        </p>
                      </div>
                      {share.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => revokeShare(share.id)}
                          style={{
                            ...mono,
                            fontSize: "7px",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "rgba(252,165,165,0.58)",
                            border: "1px solid rgba(252,165,165,0.14)",
                            backgroundColor: "transparent",
                            padding: "0.35rem 0.6rem",
                            cursor: "pointer",
                          }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {message && (
          <p style={{ marginTop: "0.75rem", fontSize: "11px", lineHeight: 1.5, color: "rgba(255,255,255,0.34)" }}>
            {message}
          </p>
        )}
      </section>

      {showUpgradePrompt && (
        <ContextualUpgradePrompt
          action="share_case"
          onDismiss={() => setShowUpgradePrompt(false)}
          onTrialStarted={() => setProfessionalState("professional")}
        />
      )}
    </>
  );
}
