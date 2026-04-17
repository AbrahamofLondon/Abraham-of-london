/* pages/access/accept.tsx — Invite Acceptance Flow */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ShieldCheck, CheckCircle, AlertTriangle, Loader2, Key } from "lucide-react";

import Layout from "@/components/Layout";
import { authOptions } from "@/lib/auth/options";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AcceptState =
  | { status: "idle" }
  | { status: "accepting" }
  | { status: "success"; grants: Array<{ type: string; key: string }> }
  | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// Error messages
// ---------------------------------------------------------------------------

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_INVITE: "This invitation link is not valid or has already been used.",
  INVITE_EXPIRED: "This invitation has expired.",
  INVITE_REVOKED: "This invitation has been revoked.",
  INVITE_REDEEMED: "This invitation has already been redeemed.",
  INVITE_DEPLETED: "This invitation has reached its maximum uses.",
  EMAIL_MISMATCH: "This invitation was issued to a different email address. Please sign in with the correct account.",
  INVALID_INVITE_FORMAT: "This invitation contains invalid data. Contact the issuer.",
};

function resolveError(raw: string): string {
  return ERROR_MESSAGES[raw] || raw || "Unable to process this invitation.";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const AcceptInvitePage: NextPage = () => {
  const router = useRouter();
  const { data: session, update: refreshSession } = useSession();
  const [state, setState] = React.useState<AcceptState>({ status: "idle" });

  const token = typeof router.query.token === "string" ? router.query.token : "";
  const isAuthenticated = !!session?.user;

  // Auto-accept on mount if authenticated and token present
  React.useEffect(() => {
    if (!token || !isAuthenticated || state.status !== "idle") return;

    setState({ status: "accepting" });

    fetch("/api/access/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          setState({ status: "success", grants: json.granted || [] });
          await refreshSession();
        } else {
          setState({ status: "error", message: resolveError(json.error || "") });
        }
      })
      .catch(() => {
        setState({ status: "error", message: "Network failure. Please try again." });
      });
  }, [token, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout title="Accept Invitation | Abraham of London" fullWidth>
      <Head>
        <title>Accept Invitation | Abraham of London</title>
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
              Access Invitation
            </span>
          </div>

          <h1
            className="mt-6 font-serif text-3xl font-light italic"
            style={{ color: "var(--ds-text)" }}
          >
            Accept Invitation
          </h1>

          <div
            className="my-8 h-px"
            style={{ background: "linear-gradient(to right, var(--ds-accent-soft), transparent)" }}
          />

          {/* No token */}
          {!token ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}
            >
              <AlertTriangle className="mx-auto h-6 w-6" style={{ color: "var(--ds-text-subtle)" }} />
              <p className="mt-4 text-sm" style={{ color: "var(--ds-text-muted)" }}>
                No invitation token provided. If you received an invitation email,
                use the link in that email.
              </p>
              <Link
                href="/access/redeem"
                className="mt-6 inline-flex items-center gap-2 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
              >
                <Key className="h-3.5 w-3.5" />
                Redeem Key Instead
              </Link>
            </div>

          /* Unauthenticated */
          ) : !isAuthenticated ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}
            >
              <ShieldCheck className="mx-auto h-8 w-8" style={{ color: "var(--ds-accent)", opacity: 0.6 }} />
              <h2 className="mt-5 font-serif text-xl" style={{ color: "var(--ds-text)" }}>
                Sign In to Continue
              </h2>
              <p className="mt-3 text-sm" style={{ color: "var(--ds-text-muted)" }}>
                You must be signed in to accept this invitation. Your entitlements
                will be activated immediately after sign-in.
              </p>
              <button
                onClick={() => signIn(undefined, { callbackUrl: `/access/accept?token=${encodeURIComponent(token)}` })}
                className="mt-6 inline-flex items-center gap-2 border px-6 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
              >
                Sign In
              </button>
            </div>

          /* Accepting */
          ) : state.status === "idle" || state.status === "accepting" ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}
            >
              <Loader2 className="mx-auto h-6 w-6 animate-spin" style={{ color: "var(--ds-accent)" }} />
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-muted)" }}>
                Validating invitation…
              </p>
            </div>

          /* Success */
          ) : state.status === "success" ? (
            <div
              className="rounded-xl border p-8"
              style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-panel)" }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5" style={{ color: "var(--ds-accent)" }} />
                <h2 className="font-mono text-[10px] uppercase tracking-[0.32em]" style={{ color: "var(--ds-accent)" }}>
                  Access Granted
                </h2>
              </div>

              <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                Your entitlements have been activated and are effective immediately.
              </p>

              {state.grants.length > 0 && (
                <div className="mt-6" style={{ borderTop: "1px solid var(--ds-border)" }}>
                  {state.grants.map((grant, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3"
                      style={{ borderBottom: "1px solid var(--ds-border)" }}
                    >
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: "var(--ds-text-subtle)" }}>
                        {grant.type}
                      </span>
                      <span className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ds-text)" }}>
                        {grant.key}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <Link
                  href="/access"
                  className="inline-flex items-center gap-2 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                  style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
                >
                  View Access
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                  style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
                >
                  Continue
                </Link>
              </div>
            </div>

          /* Error */
          ) : (
            <div
              className="rounded-xl border p-8"
              style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" style={{ color: "var(--ds-danger, #cf4d4d)" }} />
                <h2 className="font-mono text-[10px] uppercase tracking-[0.32em]" style={{ color: "var(--ds-danger, #cf4d4d)" }}>
                  Invitation Failed
                </h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                {state.message}
              </p>
              <div className="mt-8 flex gap-3">
                <Link
                  href="/access/redeem"
                  className="inline-flex items-center gap-2 border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                  style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
                >
                  <Key className="h-3.5 w-3.5" />
                  Redeem Key Instead
                </Link>
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.28em] transition"
                  style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
                >
                  Request Access
                </Link>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16">
            <div className="h-px" style={{ background: "linear-gradient(to right, var(--ds-border), transparent)" }} />
            <p className="mt-6 font-mono text-[7px] uppercase tracking-[0.40em]" style={{ color: "var(--ds-text-subtle)" }}>
              Invitations are bound to the recipient email address. Contact support if you
              believe you received this invitation in error.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default AcceptInvitePage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  return { props: { initialAuth: !!session?.user } };
};
