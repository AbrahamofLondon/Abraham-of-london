/* pages/admin/access-keys.tsx — Admin Access Key Management */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import {
  Key, Plus, Copy, Check, X, AlertTriangle, Loader2,
  ChevronDown, ChevronRight, Shield, Clock, Users, Ban,
  Mail, Send,
} from "lucide-react";

import Layout from "@/components/Layout";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AccessKeyRow = {
  id: string;
  codePreview: string;
  label: string | null;
  status: string;
  grants: Array<{ type: string; key: string }>;
  maxUses: number;
  uses: number;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  issuedBy: string | null;
};

type UseRecord = {
  id: string;
  redeemedAt: string;
  userEmail: string | null;
  userName: string | null;
  ipAddress: string | null;
};

type GrantInput = {
  type: "tier" | "product" | "artifact";
  key: string;
};

type CreateState =
  | { phase: "form" }
  | { phase: "submitting" }
  | { phase: "reveal"; id: string; code: string; preview: string }
  | { phase: "error"; message: string };

// ---------------------------------------------------------------------------
// Grant builder
// ---------------------------------------------------------------------------

const TIER_OPTIONS = ["member", "inner-circle", "architect", "owner"];

function GrantBuilder({
  grants,
  onChange,
}: {
  grants: GrantInput[];
  onChange: (g: GrantInput[]) => void;
}) {
  const [type, setType] = React.useState<"tier" | "product" | "artifact">("tier");
  const [key, setKey] = React.useState("");

  const addGrant = () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    const exists = grants.some((g) => g.type === type && g.key === trimmed);
    if (exists) return;
    onChange([...grants, { type, key: trimmed }]);
    setKey("");
  };

  const removeGrant = (idx: number) => {
    onChange(grants.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label
        className="block font-mono text-[9px] uppercase tracking-[0.36em]"
        style={{ color: "var(--ds-text-subtle)" }}
      >
        Grants
      </label>

      {/* Existing grants */}
      {grants.length > 0 && (
        <div className="mt-3 space-y-2">
          {grants.map((g, i) => (
            <div
              key={i}
              className="flex items-center justify-between border px-4 py-2"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[8px] uppercase tracking-[0.24em]"
                  style={{ color: "var(--ds-accent)" }}
                >
                  {g.type}
                </span>
                <span
                  className="font-mono text-[10px] tracking-wide"
                  style={{ color: "var(--ds-text)" }}
                >
                  {g.key}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeGrant(i)}
                className="transition-colors"
                style={{ color: "var(--ds-text-subtle)" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add grant row */}
      <div className="mt-3 flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as GrantInput["type"])}
          className="border px-3 py-2 font-mono text-[10px] uppercase tracking-wide outline-none"
          style={{
            borderColor: "var(--ds-border)",
            backgroundColor: "var(--ds-panel)",
            color: "var(--ds-text)",
          }}
        >
          <option value="tier">Tier</option>
          <option value="artifact">Artifact</option>
          <option value="product">Product</option>
        </select>

        {type === "tier" ? (
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="flex-1 border px-3 py-2 font-mono text-[10px] tracking-wide outline-none"
            style={{
              borderColor: "var(--ds-border)",
              backgroundColor: "var(--ds-panel)",
              color: "var(--ds-text)",
            }}
          >
            <option value="">Select tier…</option>
            {TIER_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={type === "artifact" ? "e.g. gmi-q1-2026-deck" : "e.g. canon-vol-iv"}
            className="flex-1 border px-3 py-2 font-mono text-[10px] tracking-wide outline-none"
            style={{
              borderColor: "var(--ds-border)",
              backgroundColor: "var(--ds-panel)",
              color: "var(--ds-text)",
            }}
          />
        )}

        <button
          type="button"
          onClick={addGrant}
          disabled={!key.trim()}
          className="border px-4 py-2 transition disabled:opacity-30"
          style={{
            borderColor: "var(--ds-accent-soft)",
            color: "var(--ds-accent)",
          }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key reveal
// ---------------------------------------------------------------------------

function KeyReveal({
  code,
  preview,
  onDone,
}: {
  code: string;
  preview: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard API may fail */ }
  };

  return (
    <div
      className="rounded-xl border p-8"
      style={{
        borderColor: "var(--ds-accent-soft)",
        backgroundColor: "var(--ds-panel)",
      }}
    >
      <div className="flex items-center gap-3">
        <Key className="h-5 w-5" style={{ color: "var(--ds-accent)" }} />
        <h3
          className="font-mono text-[10px] uppercase tracking-[0.32em]"
          style={{ color: "var(--ds-accent)" }}
        >
          Key Created
        </h3>
      </div>

      <div
        className="mt-4 flex items-center gap-3 border p-4 font-mono text-sm tracking-wide"
        style={{
          borderColor: "var(--ds-accent-soft)",
          backgroundColor: "var(--ds-background)",
          color: "var(--ds-text)",
          wordBreak: "break-all",
        }}
      >
        <span className="flex-1">{code}</span>
        <button
          onClick={copyCode}
          className="shrink-0 transition"
          style={{ color: "var(--ds-accent)" }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2">
        <AlertTriangle
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
          style={{ color: "var(--ds-warning, #f0b94f)" }}
        />
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: "var(--ds-text-muted)" }}
        >
          This key will not be shown again. Copy it now and store it securely.
          The preview <strong style={{ color: "var(--ds-text)" }}>{preview}</strong> will
          be shown in the key list for identification.
        </p>
      </div>

      <button
        onClick={onDone}
        className="mt-6 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
        style={{
          borderColor: "var(--ds-border)",
          color: "var(--ds-text-muted)",
        }}
      >
        Done
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: "var(--ds-accent-soft)", text: "var(--ds-accent)" },
    REVOKED: { bg: "rgba(207,77,77,0.15)", text: "#cf4d4d" },
    EXPIRED: { bg: "rgba(255,255,255,0.06)", text: "var(--ds-text-subtle)" },
    DEPLETED: { bg: "rgba(255,255,255,0.06)", text: "var(--ds-text-subtle)" },
  };
  const c = colors[status] || colors.EXPIRED;

  return (
    <span
      className="inline-block px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.20em]"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type PageProps = { initialKeys: AccessKeyRow[] };

const AccessKeysPage: NextPage<PageProps> = ({ initialKeys }) => {
  const [keys, setKeys] = React.useState<AccessKeyRow[]>(initialKeys);
  const [createState, setCreateState] = React.useState<CreateState>({ phase: "form" });
  const [showCreate, setShowCreate] = React.useState(false);
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [uses, setUses] = React.useState<Record<string, UseRecord[]>>({});
  const [revoking, setRevoking] = React.useState<string | null>(null);

  // Form fields
  const [label, setLabel] = React.useState("");
  const [grants, setGrants] = React.useState<GrantInput[]>([]);
  const [maxUses, setMaxUses] = React.useState(1);
  const [expiresAt, setExpiresAt] = React.useState("");

  const refreshKeys = async () => {
    try {
      const res = await fetch("/api/admin/access-keys");
      const json = await res.json();
      if (json.ok) setKeys(json.keys);
    } catch { /* swallow */ }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (grants.length === 0 || createState.phase === "submitting") return;

    setCreateState({ phase: "submitting" });

    try {
      const res = await fetch("/api/admin/access-keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || undefined,
          grants,
          maxUses,
          expiresAt: expiresAt || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setCreateState({
          phase: "reveal",
          id: json.id,
          code: json.code,
          preview: json.preview,
        });
        await refreshKeys();
      } else {
        setCreateState({
          phase: "error",
          message: json.error || "Failed to create key.",
        });
      }
    } catch {
      setCreateState({
        phase: "error",
        message: "Network error. Please retry.",
      });
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (revoking) return;
    setRevoking(keyId);
    try {
      const res = await fetch(`/api/admin/access-keys/${keyId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Revoked by admin" }),
      });
      if (res.ok) await refreshKeys();
    } catch { /* swallow */ }
    setRevoking(null);
  };

  const loadUses = async (keyId: string) => {
    if (expandedKey === keyId) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(keyId);
    if (uses[keyId]) return;

    try {
      const res = await fetch(`/api/admin/access-keys/${keyId}/uses`);
      const json = await res.json();
      if (json.ok) setUses((prev) => ({ ...prev, [keyId]: json.uses }));
    } catch { /* swallow */ }
  };

  const resetCreate = () => {
    setCreateState({ phase: "form" });
    setLabel("");
    setGrants([]);
    setMaxUses(1);
    setExpiresAt("");
    setShowCreate(false);
  };

  // --- Invite state ---
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteGrants, setInviteGrants] = React.useState<GrantInput[]>([]);
  const [inviteExpiry, setInviteExpiry] = React.useState("");
  const [inviteState, setInviteState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [inviteResult, setInviteResult] = React.useState<{ recipientEmail: string; inviteUrl: string } | null>(null);
  const [inviteError, setInviteError] = React.useState("");

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || inviteGrants.length === 0 || inviteState === "sending") return;

    setInviteState("sending");
    setInviteError("");

    try {
      const res = await fetch("/api/admin/invites/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: inviteEmail.trim(),
          grants: inviteGrants,
          expiresAt: inviteExpiry || undefined,
          sendEmail: true,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setInviteState("sent");
        setInviteResult({ recipientEmail: json.recipientEmail, inviteUrl: json.inviteUrl });
      } else {
        setInviteState("error");
        setInviteError(json.error || "Failed to send invitation.");
      }
    } catch {
      setInviteState("error");
      setInviteError("Network error.");
    }
  };

  const resetInvite = () => {
    setShowInvite(false);
    setInviteEmail("");
    setInviteGrants([]);
    setInviteExpiry("");
    setInviteState("idle");
    setInviteResult(null);
    setInviteError("");
  };

  return (
    <Layout title="Access Keys | Admin" fullWidth>
      <Head>
        <title>Access Keys | Admin | Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main
        className="min-h-screen"
        style={{ backgroundColor: "var(--ds-background)" }}
      >
        <div className="mx-auto max-w-4xl px-6 pb-24 pt-28">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4" style={{ color: "var(--ds-accent)" }} />
                <span
                  className="font-mono text-[8px] uppercase tracking-[0.40em]"
                  style={{ color: "var(--ds-accent)" }}
                >
                  Admin · Access Keys
                </span>
              </div>
              <h1
                className="mt-4 font-serif text-3xl font-light"
                style={{ color: "var(--ds-text)" }}
              >
                Access Key Management
              </h1>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreate(!showCreate); setShowInvite(false); }}
                className="inline-flex items-center gap-2 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                style={{
                  borderColor: "var(--ds-accent-soft)",
                  backgroundColor: "var(--ds-accent-soft)",
                  color: "var(--ds-accent)",
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Issue Key
              </button>
              <button
                onClick={() => { setShowInvite(!showInvite); setShowCreate(false); }}
                className="inline-flex items-center gap-2 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                style={{
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text-muted)",
                }}
              >
                <Mail className="h-3.5 w-3.5" />
                Send Invitation
              </button>
            </div>
          </div>

          <div
            className="my-8 h-px"
            style={{ background: "var(--ds-border)" }}
          />

          {/* Invite panel */}
          {showInvite && (
            <div
              className="mb-10 rounded-xl border p-8"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}
            >
              {inviteState === "sent" && inviteResult ? (
                <div>
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5" style={{ color: "var(--ds-accent)" }} />
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.32em]" style={{ color: "var(--ds-accent)" }}>
                      Invitation Sent
                    </h3>
                  </div>
                  <p className="mt-4 text-sm" style={{ color: "var(--ds-text-muted)" }}>
                    An invitation email has been sent to <strong style={{ color: "var(--ds-text)" }}>{inviteResult.recipientEmail}</strong>.
                    They will receive a secure link to activate their entitlements.
                  </p>
                  <button
                    onClick={resetInvite}
                    className="mt-6 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                    style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInvite} className="space-y-6">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.32em]" style={{ color: "var(--ds-text)" }}>
                    Send Access Invitation
                  </h2>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.36em]" style={{ color: "var(--ds-text-subtle)" }}>
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="recipient@institution.com"
                      required
                      className="mt-2 w-full border px-4 py-3 text-sm outline-none transition focus:border-[var(--ds-accent-soft)]"
                      style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-background)", color: "var(--ds-text)" }}
                    />
                  </div>

                  <GrantBuilder grants={inviteGrants} onChange={setInviteGrants} />

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.36em]" style={{ color: "var(--ds-text-subtle)" }}>
                      Expires At (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={inviteExpiry}
                      onChange={(e) => setInviteExpiry(e.target.value)}
                      className="mt-2 w-full border px-4 py-3 text-sm outline-none transition focus:border-[var(--ds-accent-soft)]"
                      style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-background)", color: "var(--ds-text)" }}
                    />
                  </div>

                  {inviteState === "error" && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "#cf4d4d" }}>
                      <AlertTriangle className="h-4 w-4" />
                      {inviteError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={!inviteEmail.trim() || inviteGrants.length === 0 || inviteState === "sending"}
                      className="flex items-center gap-2 border px-6 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition disabled:opacity-40"
                      style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
                    >
                      {inviteState === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {inviteState === "sending" ? "Sending…" : "Send Invitation"}
                    </button>
                    <button
                      type="button"
                      onClick={resetInvite}
                      className="border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                      style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Create panel */}
          {showCreate && (
            <div
              className="mb-10 rounded-xl border p-8"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
              }}
            >
              {createState.phase === "reveal" ? (
                <KeyReveal
                  code={createState.code}
                  preview={createState.preview}
                  onDone={resetCreate}
                />
              ) : (
                <form onSubmit={handleCreate} className="space-y-6">
                  <h2
                    className="font-mono text-[10px] uppercase tracking-[0.32em]"
                    style={{ color: "var(--ds-text)" }}
                  >
                    Issue New Access Key
                  </h2>

                  <div>
                    <label
                      className="block font-mono text-[9px] uppercase tracking-[0.36em]"
                      style={{ color: "var(--ds-text-subtle)" }}
                    >
                      Label (optional)
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Board Member Q1 2026"
                      className="mt-2 w-full border px-4 py-3 text-sm outline-none transition focus:border-[var(--ds-accent-soft)]"
                      style={{
                        borderColor: "var(--ds-border)",
                        backgroundColor: "var(--ds-background)",
                        color: "var(--ds-text)",
                      }}
                    />
                  </div>

                  <GrantBuilder grants={grants} onChange={setGrants} />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label
                        className="block font-mono text-[9px] uppercase tracking-[0.36em]"
                        style={{ color: "var(--ds-text-subtle)" }}
                      >
                        Max Uses
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value) || 1)}
                        className="mt-2 w-full border px-4 py-3 text-sm outline-none transition focus:border-[var(--ds-accent-soft)]"
                        style={{
                          borderColor: "var(--ds-border)",
                          backgroundColor: "var(--ds-background)",
                          color: "var(--ds-text)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="block font-mono text-[9px] uppercase tracking-[0.36em]"
                        style={{ color: "var(--ds-text-subtle)" }}
                      >
                        Expires At (optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="mt-2 w-full border px-4 py-3 text-sm outline-none transition focus:border-[var(--ds-accent-soft)]"
                        style={{
                          borderColor: "var(--ds-border)",
                          backgroundColor: "var(--ds-background)",
                          color: "var(--ds-text)",
                        }}
                      />
                    </div>
                  </div>

                  {createState.phase === "error" && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "#cf4d4d" }}>
                      <AlertTriangle className="h-4 w-4" />
                      {createState.message}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={grants.length === 0 || createState.phase === "submitting"}
                      className="flex items-center gap-2 border px-6 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition disabled:opacity-40"
                      style={{
                        borderColor: "var(--ds-accent-soft)",
                        backgroundColor: "var(--ds-accent-soft)",
                        color: "var(--ds-accent)",
                      }}
                    >
                      {createState.phase === "submitting" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Key className="h-3.5 w-3.5" />
                      )}
                      {createState.phase === "submitting" ? "Issuing…" : "Issue Key"}
                    </button>

                    <button
                      type="button"
                      onClick={resetCreate}
                      className="border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                      style={{
                        borderColor: "var(--ds-border)",
                        color: "var(--ds-text-muted)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Keys table */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span
                className="font-mono text-[9px] uppercase tracking-[0.32em]"
                style={{ color: "var(--ds-text-subtle)" }}
              >
                {keys.length} {keys.length === 1 ? "key" : "keys"} issued
              </span>
            </div>

            {keys.length === 0 ? (
              <div
                className="border p-10 text-center"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                }}
              >
                <Key className="mx-auto h-6 w-6" style={{ color: "var(--ds-text-subtle)" }} />
                <p className="mt-4 text-sm" style={{ color: "var(--ds-text-muted)" }}>
                  No access keys have been issued yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="border"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                    }}
                  >
                    {/* Key row */}
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span
                            className="font-mono text-sm tracking-wide"
                            style={{ color: "var(--ds-text)" }}
                          >
                            {k.codePreview}
                          </span>
                          <StatusBadge status={k.status} />
                        </div>
                        {k.label && (
                          <p
                            className="mt-1 text-[11px]"
                            style={{ color: "var(--ds-text-muted)" }}
                          >
                            {k.label}
                          </p>
                        )}
                        <div
                          className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[8px] uppercase tracking-[0.20em]"
                          style={{ color: "var(--ds-text-subtle)" }}
                        >
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {k.uses}/{k.maxUses} uses
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(k.createdAt).toLocaleDateString("en-GB")}
                          </span>
                          {k.expiresAt && (
                            <span>expires {new Date(k.expiresAt).toLocaleDateString("en-GB")}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {k.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRevoke(k.id)}
                            disabled={revoking === k.id}
                            className="border px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.24em] transition disabled:opacity-40"
                            style={{
                              borderColor: "rgba(207,77,77,0.25)",
                              color: "#cf4d4d",
                            }}
                          >
                            {revoking === k.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Ban className="h-3 w-3" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => loadUses(k.id)}
                          className="border px-3 py-1.5 transition"
                          style={{
                            borderColor: "var(--ds-border)",
                            color: "var(--ds-text-subtle)",
                          }}
                        >
                          {expandedKey === k.id ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Grants summary */}
                    <div
                      className="flex flex-wrap gap-2 border-t px-5 py-3"
                      style={{ borderColor: "var(--ds-border)" }}
                    >
                      {(k.grants || []).map((g, i) => (
                        <span
                          key={i}
                          className="font-mono text-[8px] uppercase tracking-[0.18em]"
                          style={{
                            padding: "2px 8px",
                            backgroundColor: "var(--ds-accent-soft)",
                            color: "var(--ds-accent)",
                          }}
                        >
                          {g.type}:{g.key}
                        </span>
                      ))}
                    </div>

                    {/* Expanded uses */}
                    {expandedKey === k.id && (
                      <div
                        className="border-t px-5 py-4"
                        style={{ borderColor: "var(--ds-border)" }}
                      >
                        <span
                          className="font-mono text-[8px] uppercase tracking-[0.28em]"
                          style={{ color: "var(--ds-text-subtle)" }}
                        >
                          Redemption History
                        </span>
                        {!uses[k.id] ? (
                          <div className="mt-3 flex items-center gap-2">
                            <Loader2
                              className="h-3 w-3 animate-spin"
                              style={{ color: "var(--ds-text-subtle)" }}
                            />
                            <span className="text-[11px]" style={{ color: "var(--ds-text-subtle)" }}>
                              Loading…
                            </span>
                          </div>
                        ) : uses[k.id].length === 0 ? (
                          <p
                            className="mt-3 text-[11px]"
                            style={{ color: "var(--ds-text-subtle)" }}
                          >
                            No redemptions recorded.
                          </p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {uses[k.id].map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center justify-between py-2"
                                style={{ borderBottom: "1px solid var(--ds-border)" }}
                              >
                                <div>
                                  <span
                                    className="text-[11px]"
                                    style={{ color: "var(--ds-text)" }}
                                  >
                                    {u.userEmail || u.userName || "Unknown"}
                                  </span>
                                </div>
                                <div
                                  className="font-mono text-[8px] tracking-wide"
                                  style={{ color: "var(--ds-text-subtle)" }}
                                >
                                  {new Date(u.redeemedAt).toLocaleString("en-GB")}
                                </div>
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
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default AccessKeysPage;

// ---------------------------------------------------------------------------
// Server-side protection
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const userId = (session?.user as any)?.id ?? null;

  if (!userId) {
    return {
      redirect: { destination: "/inner-circle", permanent: false },
    };
  }

  const access = await getUserAccess(prisma, userId);

  if (!access.permissions.isAdmin) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  // Load initial keys
  let initialKeys: AccessKeyRow[] = [];
  try {
    const dbKeys = await prisma.accessKey.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { usesLog: true } } },
    });

    initialKeys = dbKeys.map((k) => ({
      id: k.id,
      codePreview: k.codePreview,
      label: k.label,
      status: k.status,
      grants: (Array.isArray(k.grants) ? k.grants : []) as Array<{ type: string; key: string }>,
      maxUses: k.maxUses,
      uses: k.uses,
      startsAt: k.startsAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
      issuedBy: k.issuedBy,
    }));
  } catch {
    // DB may not have tables yet
  }

  return { props: { initialKeys } };
};
