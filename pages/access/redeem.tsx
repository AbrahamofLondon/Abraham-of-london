/* pages/access/redeem.tsx — Access Key Redemption */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import { ShieldCheck, Key, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

import Layout from "@/components/Layout";
import { authOptions } from "@/lib/auth/options";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RedeemState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; grants: GrantResult[] }
  | { status: "error"; message: string };

type GrantResult = {
  type: "tier" | "product" | "artifact";
  key: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_KEY: "The access key provided is not recognised.",
  KEY_EXPIRED: "This access key has expired and can no longer be redeemed.",
  KEY_EXHAUSTED: "This access key has reached its maximum number of uses.",
  KEY_NOT_ACTIVE: "This access key is no longer active.",
  ALREADY_REDEEMED: "This key has already been redeemed by this account.",
  ACCESS_KEY_REQUIRED: "Enter the access key you were given.",
  INVALID_KEY_FORMAT: "This access key is malformed.",
  REDEEM_FAILED: "The access key could not be redeemed.",
  METHOD_NOT_ALLOWED: "Request method not permitted.",
  AUTHENTICATION_REQUIRED: "Authentication is required to redeem an access key.",
};

function resolveErrorMessage(raw: string): string {
  if (ERROR_MESSAGES[raw]) return ERROR_MESSAGES[raw];
  if (/already.*redeemed/i.test(raw)) return ERROR_MESSAGES.ALREADY_REDEEMED;
  if (/not found|invalid/i.test(raw)) return ERROR_MESSAGES.INVALID_KEY;
  if (/expired/i.test(raw)) return ERROR_MESSAGES.KEY_EXPIRED;
  if (/deplet/i.test(raw)) return ERROR_MESSAGES.KEY_EXHAUSTED;
  return raw || "Unable to complete this request. Please try again.";
}

function grantLabel(grant: GrantResult): string {
  const typeLabels: Record<string, string> = {
    tier: "Tier Access",
    product: "Product Entitlement",
    artifact: "Artifact Entitlement",
  };
  return `${typeLabels[grant.type] || grant.type} — ${grant.key}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const RedeemPage: NextPage = () => {
  const { data: session, update: refreshSession } = useSession();
  const [code, setCode] = React.useState("");
  const [state, setState] = React.useState<RedeemState>({ status: "idle" });

  const isAuthenticated = !!session?.user;

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = code.trim();
      if (!trimmed || state.status === "submitting") return;

      setState({ status: "submitting" });

      try {
        const res = await fetch("/api/access/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmed }),
        });

        const json = await res.json().catch(() => ({}));

        if (res.ok && json.ok) {
          setState({ status: "success", grants: json.granted || [] });
          // Refresh session so entitlements propagate immediately
          await refreshSession();
        } else {
          setState({
            status: "error",
            message: resolveErrorMessage(json.error || ""),
          });
        }
      } catch {
        setState({
          status: "error",
          message: "Network failure. Please check your connection and try again.",
        });
      }
    },
    [code, state.status, refreshSession],
  );

  const reset = () => {
    setCode("");
    setState({ status: "idle" });
  };

  return (
    <Layout
      title="Redeem Access Key | Abraham of London"
      canonicalUrl="/access/redeem"
      fullWidth
    >
      <Head>
        <title>Redeem Access Key | Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main
        className="min-h-screen"
        style={{ backgroundColor: "var(--ds-background)" }}
      >
        <div className="mx-auto max-w-xl px-6 pb-24 pt-32">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-5 w-px"
              style={{ backgroundColor: "var(--ds-accent)", opacity: 0.5 }}
            />
            <span
              className="font-mono text-[8px] uppercase tracking-[0.40em]"
              style={{ color: "var(--ds-accent)" }}
            >
              Access Control
            </span>
          </div>

          <h1
            className="mt-6 font-serif text-4xl font-light italic"
            style={{ color: "var(--ds-text)" }}
          >
            Redeem Access Key
          </h1>

          <p
            className="mt-4 max-w-md text-sm leading-relaxed"
            style={{ color: "var(--ds-text-muted)" }}
          >
            Enter the access key issued to your account. Valid keys grant
            tier upgrades, artifact access, or product entitlements.
          </p>

          <div
            className="my-8 h-px"
            style={{
              background: "linear-gradient(to right, var(--ds-accent-soft), transparent)",
            }}
          />

          {/* Unauthenticated state */}
          {!isAuthenticated ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
              }}
            >
              <ShieldCheck
                className="mx-auto h-8 w-8"
                style={{ color: "var(--ds-accent)", opacity: 0.6 }}
              />
              <h2
                className="mt-5 font-serif text-xl"
                style={{ color: "var(--ds-text)" }}
              >
                Authentication Required
              </h2>
              <p
                className="mt-3 text-sm"
                style={{ color: "var(--ds-text-muted)" }}
              >
                You must be signed in to redeem an access key.
              </p>
              <button
                onClick={() => signIn(undefined, { callbackUrl: "/access/redeem" })}
                className="mt-6 inline-flex items-center gap-2 border px-6 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                style={{
                  borderColor: "var(--ds-accent-soft)",
                  backgroundColor: "var(--ds-accent-soft)",
                  color: "var(--ds-accent)",
                }}
              >
                <Key className="h-3.5 w-3.5" />
                Sign In
              </button>
            </div>
          ) : state.status === "success" ? (
            /* Success state */
            <div
              className="rounded-xl border p-8"
              style={{
                borderColor: "var(--ds-accent-soft)",
                backgroundColor: "var(--ds-panel)",
              }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: "var(--ds-accent)" }}
                />
                <h2
                  className="font-mono text-[10px] uppercase tracking-[0.32em]"
                  style={{ color: "var(--ds-accent)" }}
                >
                  Access Granted
                </h2>
              </div>

              <p
                className="mt-4 text-sm leading-relaxed"
                style={{ color: "var(--ds-text-muted)" }}
              >
                The following entitlements have been applied to your account.
              </p>

              {state.grants.length > 0 && (
                <div
                  className="mt-6 space-y-2"
                  style={{ borderTop: "1px solid var(--ds-border)" }}
                >
                  {state.grants.map((grant, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3"
                      style={{ borderBottom: "1px solid var(--ds-border)" }}
                    >
                      <span
                        className="font-mono text-[9px] uppercase tracking-[0.24em]"
                        style={{ color: "var(--ds-text-subtle)" }}
                      >
                        {grant.type}
                      </span>
                      <span
                        className="font-mono text-[10px] tracking-wide"
                        style={{ color: "var(--ds-text)" }}
                      >
                        {grant.key}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/access"
                  className="inline-flex items-center gap-2 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                  style={{
                    borderColor: "var(--ds-accent-soft)",
                    backgroundColor: "var(--ds-accent-soft)",
                    color: "var(--ds-accent)",
                  }}
                >
                  View Access
                </a>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                  style={{
                    borderColor: "var(--ds-border)",
                    color: "var(--ds-text-muted)",
                  }}
                >
                  Redeem Another Key
                </button>
              </div>
            </div>
          ) : (
            /* Redeem form */
            <form onSubmit={handleSubmit}>
              <label
                className="block font-mono text-[9px] uppercase tracking-[0.36em]"
                style={{ color: "var(--ds-text-subtle)" }}
              >
                Access Key
              </label>

              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="aolk_xxxxxxxxxxxxxxxxxxxxxxxx"
                disabled={state.status === "submitting"}
                autoComplete="off"
                spellCheck={false}
                className="mt-3 w-full border px-5 py-4 font-mono text-sm outline-none transition-all focus:border-[var(--ds-accent-soft)]"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                  color: "var(--ds-text)",
                }}
              />

              {state.status === "error" && (
                <div className="mt-4 flex items-start gap-3">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: "var(--ds-danger, #cf4d4d)" }}
                  />
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--ds-danger, #cf4d4d)" }}
                  >
                    {state.message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!code.trim() || state.status === "submitting"}
                className="mt-6 flex w-full items-center justify-center gap-3 border py-4 font-mono text-[10px] uppercase tracking-[0.32em] transition disabled:opacity-40"
                style={{
                  borderColor: "var(--ds-accent-soft)",
                  backgroundColor: "var(--ds-accent-soft)",
                  color: "var(--ds-accent)",
                }}
              >
                {state.status === "submitting" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                {state.status === "submitting" ? "Validating…" : "Redeem Key"}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-16">
            <div
              className="h-px"
              style={{ background: "linear-gradient(to right, var(--ds-border), transparent)" }}
            />
            <p
              className="mt-6 font-mono text-[7px] uppercase tracking-[0.40em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              Access keys are single-use unless otherwise specified. Contact
              support if your key has been issued in error.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default RedeemPage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Pre-check auth — page works for both states but we pass session status
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  return { props: { initialAuth: !!session?.user } };
};
