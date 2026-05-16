/**
 * pages/account/organisation.tsx
 *
 * Organisation management page for Professional users.
 *
 * Shows:
 * - Organisation name and member count
 * - Seat usage (X of 5 used)
 * - Member list with roles
 * - Invite member form
 * - Remove member (owner only)
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import ContextualUpgradePrompt from "@/components/product/ContextualUpgradePrompt";
import type { OrgLiteSummary, OrgLiteMember, OrgLiteRole } from "@/lib/product/organisation-lite";
import { PROFESSIONAL_SEAT_ALLOWANCE } from "@/lib/product/organisation-lite";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const ROLE_LABELS: Record<OrgLiteRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  CONTRIBUTOR: "Contributor",
  VIEWER: "Viewer",
  AUDITOR: "Auditor",
};

const OrganisationPage: NextPage = () => {
  const router = useRouter();
  const [orgs, setOrgs] = React.useState<OrgLiteSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<OrgLiteRole>("CONTRIBUTOR");
  const [inviting, setInviting] = React.useState(false);
  const [inviteResult, setInviteResult] = React.useState("");
  const [showCreate, setShowCreate] = React.useState(false);
  const [newOrgName, setNewOrgName] = React.useState("");
  const [newOrgSlug, setNewOrgSlug] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);

  async function loadOrgs() {
    setLoading(true);
    try {
      const res = await fetch("/api/organisation/list");
      if (res.status === 401) { void router.push("/auth/signin"); return; }
      const data = await res.json() as { ok: boolean; organisations: OrgLiteSummary[] };
      if (data.ok) setOrgs(data.organisations);
      else setError("Failed to load organisations");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  React.useEffect(() => { void loadOrgs(); }, [router]);

  async function handleCreateOrg() {
    if (!newOrgName || !newOrgSlug) return;
    setCreating(true);
    try {
      const res = await fetch("/api/organisation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName, slug: newOrgSlug }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        setShowCreate(false);
        setNewOrgName("");
        setNewOrgSlug("");
        await loadOrgs();
      } else {
        setError(data.error ?? "Failed to create organisation");
      }
    } catch { setError("Network error"); }
    finally { setCreating(false); }
  }

  async function handleInvite(orgId: string) {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteResult("");
    try {
      const res = await fetch("/api/organisation/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId: orgId, recipientEmail: inviteEmail, role: inviteRole }),
      });
      const data = await res.json() as { ok: boolean; token?: string; error?: string; code?: string };
      if (res.status === 403 && data.code === "PROFESSIONAL_REQUIRED") {
        setShowUpgradePrompt(true);
        return;
      }
      if (data.ok && data.token) {
        setInviteResult(`Invite sent! Share this link: ${window.location.origin}/invite?token=${data.token}`);
        setInviteEmail("");
      } else {
        setInviteResult(data.error ?? "Failed to invite");
      }
    } catch { setInviteResult("Network error"); }
    finally { setInviting(false); }
  }

  async function handleRemoveMember(orgId: string, membershipId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await fetch("/api/organisation/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId: orgId, membershipId }),
      });
      if (res.ok) await loadOrgs();
      else setError("Failed to remove member");
    } catch { setError("Network error"); }
  }

  if (loading) {
    return (
      <Layout title="Organisation | Abraham of London" fullWidth>
        <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
          <p style={{ color: "rgba(255,255,255,0.30)" }}>Loading...</p>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Organisation | Abraham of London" description="Manage your organisation and team members." fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 96px" }}>
          <h1 style={{ ...serif, fontSize: "2rem", color: "rgba(255,255,255,0.90)", marginBottom: "8px" }}>
            Organisation
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: "32px" }}>
            Add collaborators as your governed case load grows.
          </p>

          {error && (
            <div style={{ border: "1px solid rgba(252,165,165,0.30)", backgroundColor: "rgba(252,165,165,0.05)", padding: "12px 16px", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "rgba(252,165,165,0.70)" }}>{error}</p>
            </div>
          )}

          {/* Create organisation */}
          {orgs.length === 0 && !showCreate && (
            <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "24px", textAlign: "center", marginBottom: "24px" }}>
              <p style={{ ...serif, fontSize: "1.1rem", color: "rgba(255,255,255,0.70)", marginBottom: "16px" }}>
                You are not part of any organisation yet.
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                style={{
                  ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "#0A0A0A", backgroundColor: GOLD, padding: "12px 24px", border: "none", cursor: "pointer",
                }}
              >
                Create organisation
              </button>
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "20px", marginBottom: "24px" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "12px" }}>
                Create organisation
              </p>
              <input
                value={newOrgName}
                onChange={(e) => { setNewOrgName(e.target.value); setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")); }}
                placeholder="Organisation name"
                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", padding: "10px 14px", fontSize: "13px", marginBottom: "10px", boxSizing: "border-box" }}
              />
              <input
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                placeholder="organisation-slug"
                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", padding: "10px 14px", fontSize: "13px", marginBottom: "12px", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={handleCreateOrg} disabled={creating}
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: creating ? "rgba(255,255,255,0.20)" : "#0A0A0A", backgroundColor: creating ? "rgba(255,255,255,0.06)" : GOLD, padding: "10px 20px", border: "none", cursor: creating ? "not-allowed" : "pointer" }}>
                  {creating ? "Creating..." : "Create"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", padding: "10px 20px", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Organisation list */}
          {orgs.map((org) => (
            <div key={org.organisationId} style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "24px", marginBottom: "20px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ ...serif, fontSize: "1.2rem", color: "rgba(255,255,255,0.85)", marginBottom: "4px" }}>
                    {org.organisationName}
                  </h2>
                  <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: org.overageCount > 0 ? "rgba(252,165,165,0.55)" : "rgba(255,255,255,0.25)" }}>
                    {org.seatsUsed} of {org.seatAllowance} seats used
                    {org.overageCount > 0 ? ` · ${org.overageCount} overage` : ""}
                  </p>
                </div>
              </div>

              {/* Member list */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}77`, marginBottom: "8px" }}>
                  Members ({org.members.length})
                </p>
                {org.members.map((member) => (
                  <div key={member.membershipId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div>
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>
                        {member.fullName || member.email}
                      </p>
                      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                        {member.email} · {ROLE_LABELS[member.role] ?? member.role}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(org.organisationId, member.membershipId)}
                      style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(252,165,165,0.45)", border: "1px solid rgba(252,165,165,0.12)", backgroundColor: "transparent", padding: "4px 10px", cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Invite form */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}77`, marginBottom: "10px" }}>
                  Invite member
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    style={{ flex: 1, minWidth: "200px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", padding: "8px 12px", fontSize: "12px", boxSizing: "border-box" }}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrgLiteRole)}
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", padding: "8px 12px", fontSize: "12px" }}
                  >
                    {(Object.keys(ROLE_LABELS) as OrgLiteRole[]).map((role) => (
                      <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleInvite(org.organisationId)}
                    disabled={inviting || !inviteEmail}
                    style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: inviting || !inviteEmail ? "rgba(255,255,255,0.20)" : "#0A0A0A", backgroundColor: inviting || !inviteEmail ? "rgba(255,255,255,0.06)" : GOLD, padding: "8px 16px", border: "none", cursor: inviting || !inviteEmail ? "not-allowed" : "pointer" }}
                  >
                    {inviting ? "Sending..." : "Invite"}
                  </button>
                </div>
                {inviteResult && (
                  <p style={{ fontSize: "11px", lineHeight: 1.5, color: `${GOLD}AA`, wordBreak: "break-all" }}>
                    {inviteResult}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Seat info */}
          <div style={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)", padding: "16px", marginTop: "16px" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "4px" }}>
              Seats
            </p>
            <p style={{ fontSize: "11px", lineHeight: 1.6, color: "rgba(255,255,255,0.30)" }}>
              Professional includes {PROFESSIONAL_SEAT_ALLOWANCE} seats. Additional collaborators currently require a plan upgrade or billing contact until automated seat billing is enabled.
            </p>
          </div>
        </div>
      </main>
      {showUpgradePrompt && (
        <ContextualUpgradePrompt
          action="invite_organisation_member"
          onDismiss={() => setShowUpgradePrompt(false)}
        />
      )}
    </Layout>
  );
};

export default OrganisationPage;
