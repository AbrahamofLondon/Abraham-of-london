import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import type { EntitlementGrant } from "@/lib/access/types";

type AccessKeyRow = {
  id: string;
  codePreview: string;
  label: string | null;
  status: string;
  grants: EntitlementGrant[];
  maxUses: number;
  uses: number;
  expiresAt: string | null;
  createdAt: string;
  issuedBy: string | null;
};

type AccessInviteRow = {
  id: string;
  recipientEmail: string;
  status: string;
  grants: EntitlementGrant[];
  maxUses: number;
  uses: number;
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  issuedBy: string | null;
  emailSentAt: string | null;
  emailError: string | null;
};

type AccessKeyUseRow = {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  redeemedAt: string;
  ipAddress: string | null;
};

type PageProps = {
  initialKeys: AccessKeyRow[];
  initialInvites: AccessInviteRow[];
};

type GrantInput = EntitlementGrant;

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    ACTIVE:   { bg: "rgba(74,158,96,0.08)",  text: "#4a9e60", border: "rgba(74,158,96,0.25)" },
    PENDING:  { bg: "rgba(201,169,110,0.08)", text: "var(--ds-accent)", border: "var(--ds-accent-soft)" },
    REDEEMED: { bg: "rgba(74,158,96,0.08)",  text: "#4a9e60", border: "rgba(74,158,96,0.25)" },
    REVOKED:  { bg: "rgba(207,77,77,0.06)",  text: "#cf4d4d", border: "rgba(207,77,77,0.2)" },
    EXPIRED:  { bg: "rgba(150,150,150,0.06)", text: "var(--ds-text-subtle)", border: "var(--ds-border)" },
    DEPLETED: { bg: "rgba(150,150,150,0.06)", text: "var(--ds-text-subtle)", border: "var(--ds-border)" },
  };
  const c = colors[status] ?? colors.EXPIRED!;
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em]"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
    >
      {status}
    </span>
  );
}

const TIER_OPTIONS = [
  "member",
  "inner-circle",
  "restricted",
  "client",
  "legacy",
  "architect",
  "owner",
  "top-secret",
] as const;

function GrantEditor({
  grants,
  onChange,
}: {
  grants: GrantInput[];
  onChange: (next: GrantInput[]) => void;
}) {
  const [type, setType] = React.useState<GrantInput["type"]>("tier");
  const [key, setKey] = React.useState("");

  function addGrant() {
    const trimmed = key.trim();
    if (!trimmed) return;
    onChange([...grants, { type, key: trimmed } as GrantInput]);
    setKey("");
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {grants.map((grant, index) => (
          <div
            key={`${grant.type}-${grant.key}-${index}`}
            className="flex items-center justify-between border px-3 py-2"
            style={{ borderColor: "var(--ds-border)" }}
          >
            <span className="font-mono text-xs" style={{ color: "var(--ds-text)" }}>
              {grant.type}:{grant.key}
            </span>
            <button
              type="button"
              onClick={() => onChange(grants.filter((_, grantIndex) => grantIndex !== index))}
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-[160px,1fr,120px]">
        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value as GrantInput["type"]);
            setKey("");
          }}
          className="border px-3 py-3 text-sm"
          style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
        >
          <option value="tier">Tier</option>
          <option value="product">Product</option>
          <option value="artifact">Artifact</option>
        </select>
        {type === "tier" ? (
          <select
            value={key}
            onChange={(event) => setKey(event.target.value)}
            className="border px-3 py-3 text-sm"
            style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
          >
            <option value="">Select tier</option>
            {TIER_OPTIONS.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={key}
            onChange={(event) => setKey(event.target.value)}
            className="border px-3 py-3 text-sm"
            style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
            placeholder={type === "artifact" ? "artifact key" : "product key"}
          />
        )}
        <button
          type="button"
          onClick={addGrant}
          disabled={!key.trim()}
          className="border px-3 py-3 font-mono text-[10px] uppercase tracking-[0.24em] disabled:opacity-40"
          style={{ borderColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
        >
          Add Grant
        </button>
      </div>
    </div>
  );
}

const AccessKeysPage: NextPage<PageProps> = ({ initialKeys, initialInvites }) => {
  const [keys, setKeys] = React.useState(initialKeys);
  const [invites, setInvites] = React.useState(initialInvites);
  const [loadingUses, setLoadingUses] = React.useState<string | null>(null);
  const [uses, setUses] = React.useState<Record<string, AccessKeyUseRow[]>>({});
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);

  const [keyGrants, setKeyGrants] = React.useState<GrantInput[]>([]);
  const [keyLabel, setKeyLabel] = React.useState("");
  const [keyMaxUses, setKeyMaxUses] = React.useState(1);
  const [keyExpiresAt, setKeyExpiresAt] = React.useState("");
  const [createdKey, setCreatedKey] = React.useState<{ code: string; preview: string } | null>(null);
  const [issuingKey, setIssuingKey] = React.useState(false);

  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteGrants, setInviteGrants] = React.useState<GrantInput[]>([]);
  const [inviteMaxUses, setInviteMaxUses] = React.useState(1);
  const [inviteExpiresAt, setInviteExpiresAt] = React.useState("");
  const [issuingInvite, setIssuingInvite] = React.useState(false);
  const [inviteSent, setInviteSent] = React.useState<{ email: string; ok: boolean; error?: string } | null>(null);

  async function refresh() {
    const [keysRes, invitesRes] = await Promise.all([
      fetch("/api/admin/access-keys"),
      fetch("/api/admin/invites"),
    ]);

    const keysJson = await keysRes.json();
    const invitesJson = await invitesRes.json();

    if (keysJson.ok) setKeys(keysJson.keys);
    if (invitesJson.ok) setInvites(invitesJson.invites);
  }

  async function handleIssueKey(event: React.FormEvent) {
    event.preventDefault();
    if (!keyGrants.length) return;
    setIssuingKey(true);

    try {
      const response = await fetch("/api/admin/access-keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: keyLabel || undefined,
          grants: keyGrants,
          maxUses: keyMaxUses,
          expiresAt: keyExpiresAt || undefined,
        }),
      });
      const json = await response.json();
      if (json.ok) {
        setCreatedKey({ code: json.code, preview: json.preview });
        setKeyLabel("");
        setKeyGrants([]);
        setKeyMaxUses(1);
        setKeyExpiresAt("");
        await refresh();
      }
    } finally {
      setIssuingKey(false);
    }
  }

  async function handleIssueInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!inviteEmail || !inviteGrants.length) return;
    setIssuingInvite(true);
    setInviteSent(null);

    try {
      const response = await fetch("/api/admin/invites/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: inviteEmail,
          grants: inviteGrants,
          maxUses: inviteMaxUses,
          expiresAt: inviteExpiresAt || undefined,
          sendEmail: true,
        }),
      });
      const json = await response.json();
      const sentEmail = inviteEmail;
      setInviteEmail("");
      setInviteGrants([]);
      setInviteMaxUses(1);
      setInviteExpiresAt("");
      setInviteSent({
        email: sentEmail,
        ok: json.ok && json.emailStatus?.sent !== false,
        error: json.emailStatus?.error,
      });
      await refresh();
    } finally {
      setIssuingInvite(false);
    }
  }

  async function handleRevokeKey(id: string) {
    await fetch(`/api/admin/access-keys/${id}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Revoked by admin" }),
    });
    await refresh();
  }

  async function handleRevokeInvite(id: string) {
    await fetch(`/api/admin/invites/${id}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Revoked by admin" }),
    });
    await refresh();
  }

  async function toggleUses(id: string) {
    if (expandedKey === id) {
      setExpandedKey(null);
      return;
    }

    setExpandedKey(id);
    if (uses[id]) return;

    setLoadingUses(id);
    try {
      const response = await fetch(`/api/admin/access-keys/${id}/uses`);
      const json = await response.json();
      if (json.ok) {
        setUses((current) => ({ ...current, [id]: json.uses }));
      }
    } finally {
      setLoadingUses(null);
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Access Control | Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="min-h-screen" style={{ backgroundColor: "var(--ds-background)" }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em]" style={{ color: "var(--ds-accent)" }}>
              Admin Access Control
            </p>
            <h1 className="font-serif text-4xl" style={{ color: "var(--ds-text)" }}>
              Access issuance and history
            </h1>
            <p className="max-w-2xl text-sm" style={{ color: "var(--ds-text-muted)" }}>
              Identity is handled by NextAuth. Access is granted by entitlements through either raw keys or email invites.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {/* Raw Key Form */}
            <form onSubmit={handleIssueKey} className="rounded border p-6 space-y-5" style={{ borderColor: "var(--ds-border)" }}>
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--ds-border)" }}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[9px]" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-subtle)" }}>
                  K
                </span>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--ds-text)" }}>
                  Issue Raw Access Key
                </h2>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--ds-text-subtle)" }}>
                Generate a key code to share manually. The full code is shown once after creation.
              </p>
              <div>
                <label className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>Label</label>
                <input
                  value={keyLabel}
                  onChange={(event) => setKeyLabel(event.target.value)}
                  placeholder="e.g. Client onboarding — Q2"
                  className="w-full rounded border px-3 py-3 text-sm"
                  style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>Grants</label>
                <GrantEditor grants={keyGrants} onChange={setKeyGrants} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>Max Uses</label>
                  <input
                    type="number"
                    min={1}
                    value={keyMaxUses}
                    onChange={(event) => setKeyMaxUses(Number(event.target.value) || 1)}
                    className="w-full rounded border px-3 py-3 text-sm"
                    style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>Expires</label>
                  <input
                    type="datetime-local"
                    value={keyExpiresAt}
                    onChange={(event) => setKeyExpiresAt(event.target.value)}
                    className="w-full rounded border px-3 py-3 text-sm"
                    style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={issuingKey || keyGrants.length === 0}
                className="rounded border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] transition disabled:opacity-40"
                style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
              >
                {issuingKey ? "Issuing…" : "Issue Key"}
              </button>
              {createdKey && (
                <div className="rounded border p-4" style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "rgba(201,169,110,0.04)" }}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: "var(--ds-accent)" }}>
                    Key Created — Copy Now
                  </p>
                  <p className="mt-3 break-all rounded border px-3 py-2.5 font-mono text-sm" style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}>
                    {createdKey.code}
                  </p>
                  <p className="mt-2 font-mono text-[10px]" style={{ color: "var(--ds-text-subtle)" }}>
                    Preview: {createdKey.preview}
                  </p>
                </div>
              )}
            </form>

            {/* Email Invite Form */}
            <form onSubmit={handleIssueInvite} className="rounded border p-6 space-y-5" style={{ borderColor: "var(--ds-accent-soft)" }}>
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--ds-border)" }}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[9px]" style={{ borderColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}>
                  @
                </span>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--ds-text)" }}>
                  Issue Email Invite
                </h2>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--ds-text-subtle)" }}>
                Send an invitation email. Access is bound to the recipient address and cannot be transferred.
              </p>
              <div>
                <label className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>Recipient Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded border px-3 py-3 text-sm"
                  style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>Grants</label>
                <GrantEditor grants={inviteGrants} onChange={setInviteGrants} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>Max Uses</label>
                  <input
                    type="number"
                    min={1}
                    value={inviteMaxUses}
                    onChange={(event) => setInviteMaxUses(Number(event.target.value) || 1)}
                    className="w-full rounded border px-3 py-3 text-sm"
                    style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>Expires</label>
                  <input
                    type="datetime-local"
                    value={inviteExpiresAt}
                    onChange={(event) => setInviteExpiresAt(event.target.value)}
                    className="w-full rounded border px-3 py-3 text-sm"
                    style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text)" }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={issuingInvite || inviteGrants.length === 0 || !inviteEmail}
                className="rounded border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] transition disabled:opacity-40"
                style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
              >
                {issuingInvite ? "Sending…" : "Send Invite"}
              </button>
              {inviteSent && (
                <div
                  className="rounded border p-4"
                  style={{
                    borderColor: inviteSent.ok ? "var(--ds-accent-soft)" : "rgba(207,77,77,0.25)",
                    backgroundColor: inviteSent.ok ? "rgba(201,169,110,0.04)" : "rgba(207,77,77,0.04)",
                  }}
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: inviteSent.ok ? "var(--ds-accent)" : "#cf4d4d" }}>
                    {inviteSent.ok ? `Invitation sent to ${inviteSent.email}` : `Failed to send to ${inviteSent.email}`}
                  </p>
                  {inviteSent.error && (
                    <p className="mt-2 text-[11px]" style={{ color: "#cf4d4d" }}>{inviteSent.error}</p>
                  )}
                </div>
              )}
            </form>
          </div>

          <section className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl" style={{ color: "var(--ds-text)" }}>
                Raw Access Keys
              </h2>
              <span className="font-mono text-[9px] tracking-wide" style={{ color: "var(--ds-text-subtle)" }}>
                {keys.length} {keys.length === 1 ? "key" : "keys"}
              </span>
            </div>
            {keys.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: "var(--ds-text-subtle)" }}>
                No access keys issued yet.
              </p>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div key={key.id} className="rounded border p-5" style={{ borderColor: "var(--ds-border)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm" style={{ color: "var(--ds-text)" }}>
                          {key.codePreview}
                        </p>
                        <StatusBadge status={key.status} />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleUses(key.id)}
                          className="rounded border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.24em] transition"
                          style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
                        >
                          {expandedKey === key.id ? "Hide" : "History"}
                        </button>
                        {key.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(key.id)}
                            className="rounded border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.24em] transition"
                            style={{ borderColor: "rgba(207,77,77,0.2)", color: "#cf4d4d" }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--ds-text-muted)" }}>
                      <span>{key.label || "Unlabelled"}</span>
                      <span style={{ color: "var(--ds-text-subtle)" }}>·</span>
                      <span>{key.uses}/{key.maxUses} uses</span>
                      {key.expiresAt && (
                        <>
                          <span style={{ color: "var(--ds-text-subtle)" }}>·</span>
                          <span>Expires {new Date(key.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {key.grants.map((grant, gi) => (
                        <span key={gi} className="rounded border px-2 py-0.5 font-mono text-[9px]" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-subtle)" }}>
                          {grant.type}:{grant.key}
                        </span>
                      ))}
                    </div>
                    {expandedKey === key.id && (
                      <div className="mt-4 rounded border-t pt-4" style={{ borderColor: "var(--ds-border)" }}>
                        {loadingUses === key.id ? (
                          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ds-text-muted)" }}>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading…
                          </div>
                        ) : (uses[key.id] || []).length === 0 ? (
                          <p className="text-[11px]" style={{ color: "var(--ds-text-subtle)" }}>No recorded uses.</p>
                        ) : (
                          <div className="space-y-2">
                            {(uses[key.id] || []).map((use) => (
                              <div key={use.id} className="flex items-center gap-3 text-[11px]" style={{ color: "var(--ds-text-muted)" }}>
                                <span className="font-mono">{use.email || use.name || use.userId}</span>
                                <span style={{ color: "var(--ds-text-subtle)" }}>·</span>
                                <span>{new Date(use.redeemedAt).toLocaleString("en-GB")}</span>
                                {use.ipAddress && (
                                  <>
                                    <span style={{ color: "var(--ds-text-subtle)" }}>·</span>
                                    <span className="font-mono text-[10px]">{use.ipAddress}</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl" style={{ color: "var(--ds-text)" }}>
                Email Invites
              </h2>
              <span className="font-mono text-[9px] tracking-wide" style={{ color: "var(--ds-text-subtle)" }}>
                {invites.length} {invites.length === 1 ? "invite" : "invites"}
              </span>
            </div>
            {invites.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: "var(--ds-text-subtle)" }}>
                No email invitations issued yet.
              </p>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded border p-5" style={{ borderColor: "var(--ds-border)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm" style={{ color: "var(--ds-text)" }}>
                          {invite.recipientEmail}
                        </p>
                        <StatusBadge status={invite.status} />
                      </div>
                      {invite.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="rounded border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.24em] transition"
                          style={{ borderColor: "rgba(207,77,77,0.2)", color: "#cf4d4d" }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--ds-text-muted)" }}>
                      <span>{invite.uses}/{invite.maxUses} uses</span>
                      <span style={{ color: "var(--ds-text-subtle)" }}>·</span>
                      <span>
                        {invite.emailSentAt
                          ? `Sent ${new Date(invite.emailSentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                          : "Not sent"}
                      </span>
                      <span style={{ color: "var(--ds-text-subtle)" }}>·</span>
                      <span>Issued {new Date(invite.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {invite.expiresAt && (
                        <>
                          <span style={{ color: "var(--ds-text-subtle)" }}>·</span>
                          <span>Expires {new Date(invite.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </>
                      )}
                      {invite.redeemedAt && (
                        <>
                          <span style={{ color: "var(--ds-text-subtle)" }}>·</span>
                          <span style={{ color: "var(--ds-accent)" }}>Redeemed {new Date(invite.redeemedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {invite.grants.map((grant, gi) => (
                        <span key={gi} className="rounded border px-2 py-0.5 font-mono text-[9px]" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-subtle)" }}>
                          {grant.type}:{grant.key}
                        </span>
                      ))}
                    </div>
                    {invite.emailError && (
                      <p className="mt-2 rounded border px-3 py-2 text-[11px]" style={{ borderColor: "rgba(207,77,77,0.2)", color: "#cf4d4d" }}>
                        Email delivery failed: {invite.emailError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminLayout>
  );
};

export default AccessKeysPage;

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx, {
    initialKeys: [],
    initialInvites: [],
  });
  if (!guard.authorized) return guard.redirect;

  const [dbKeys, dbInvites] = await Promise.all([
    prisma.accessKey.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.accessInvite.findMany({
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  return {
    props: {
      initialKeys: dbKeys.map((key) => ({
        id: key.id,
        codePreview: key.codePreview,
        label: key.label,
        status: key.status,
        grants: key.grants as unknown as EntitlementGrant[],
        maxUses: key.maxUses,
        uses: key.uses,
        expiresAt: key.expiresAt?.toISOString() ?? null,
        createdAt: key.createdAt.toISOString(),
        issuedBy: key.issuedBy,
      })),
      initialInvites: dbInvites.map((invite) => ({
        id: invite.id,
        recipientEmail: invite.recipientEmail,
        status: invite.status,
        grants: invite.grants as unknown as EntitlementGrant[],
        maxUses: invite.maxUses,
        uses: invite.uses,
        issuedAt: invite.issuedAt.toISOString(),
        expiresAt: invite.expiresAt?.toISOString() ?? null,
        redeemedAt: invite.redeemedAt?.toISOString() ?? null,
        issuedBy: invite.issuedBy,
        emailSentAt: invite.emailSentAt?.toISOString() ?? null,
        emailError: invite.emailError,
      })),
    },
  };
};
