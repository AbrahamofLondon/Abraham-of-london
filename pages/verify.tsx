/* pages/verify.tsx — PUBLIC VERIFICATION PAGE
 *
 * Honest token verification. Distinguishes clearly between:
 *  - Demo reference IDs (from public tests — not verifiable)
 *  - Full review tokens (verifiable when engine is live)
 *  - Invalid / unrecognised formats
 *
 * Does not claim tokens are "cryptographically bound" until that
 * verification engine is wired and tested.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { track } from "@/lib/foundry/track";

const GOLD = "#C9A96E";

type TokenKind =
  | "demo_ref"
  | "full_review"
  | "invalid_format"
  | "not_found"
  | "expired"
  | "mismatch";

type VerifyResult = {
  kind: TokenKind;
  verified: boolean;
  title: string;
  explanation: string;
  nextAction: string;
};

function kindColor(kind: TokenKind): string {
  if (kind === "demo_ref") return "text-amber-400";
  if (kind === "invalid_format") return "text-red-400/70";
  if (kind === "full_review" && true) return "text-white/60"; // pending engine
  return "text-emerald-400";
}

function kindBorder(kind: TokenKind): string {
  if (kind === "demo_ref") return "border-amber-500/20 bg-amber-500/5";
  if (kind === "invalid_format") return "border-red-500/20 bg-red-500/5";
  return "border-white/10 bg-white/3";
}

export default function VerifyPage() {
  const [token, setToken] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleVerify() {
    if (!token.trim()) return;
    setVerifying(true);
    setResult(null);
    setError(null);

    track("foundry_verify_attempt", {
      tokenLength: token.trim().length,
      // Never log the token value itself
    });

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Verification failed.");
        return;
      }

      setResult({
        kind: data.kind as TokenKind,
        verified: data.valid === true,
        title: data.title,
        explanation: data.explanation,
        nextAction: data.nextAction,
      });
    } catch {
      setError("Could not reach the verification service. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && token.trim() && !verifying) handleVerify();
  }

  return (
    <Layout
      title="Verify | Abraham of London"
      description="Verify the authenticity of a Foundry-issued review token. Understand the difference between a demo reference and a full verified record."
      canonicalUrl="/verify"
    >
      <Head><title>Verify | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl px-6 py-24 lg:px-10">

          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Verify</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Verify
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60">
            Enter a token to confirm whether it corresponds to a genuine Foundry-issued
            record. Not all tokens are verifiable — see below.
          </p>

          {/* Input */}
          <div className="mt-10 space-y-4">
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste token here..."
              className="w-full border bg-black/30 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none font-mono tracking-wider"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={handleVerify}
              disabled={!token.trim() || verifying}
              className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30"
              style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
            >
              {verifying ? "Checking..." : "Verify Token"}
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div className="mt-8 border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`mt-8 border p-6 ${kindBorder(result.kind)}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${kindColor(result.kind)}`}>
                  {result.title}
                </p>
                {result.verified && (
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-white/65 leading-relaxed">{result.explanation}</p>
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30 mb-1">Next step</p>
                <p className="text-sm text-white/55">{result.nextAction}</p>
              </div>
            </div>
          )}

          {/* Token type explanation */}
          <div className="mt-16 border-t border-white/8 pt-10 space-y-8">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-4">Token types</p>

              <div className="space-y-4">
                {/* Demo ref */}
                <div className="border border-white/8 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400">
                      Demo Reference
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    A 6-character reference ID generated during a public test. Included for
                    continuity — so you can reference the test session — but not cryptographically
                    signed and not verifiable here.
                  </p>
                  <p className="mt-2 font-mono text-[8px] text-white/25">Example: A3F9KC</p>
                </div>

                {/* Full review token */}
                <div className="border border-white/8 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
                      Full Review Token
                    </span>
                    <span className="rounded bg-white/3 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-white/25">
                      Engine pending
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    A token issued at the conclusion of a full governed review. When the public
                    verification engine is active, these tokens will confirm the record's existence,
                    issuer, date, and decision type — without exposing private content.
                  </p>
                  <p className="mt-2 font-mono text-[8px] text-white/25">Format: FDY-XXXX...</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="border border-white/8 bg-white/2 p-6 text-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">
                Don't have a token yet?
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/foundry/decision-test"
                  data-analytics="verify-to-test"
                  onClick={() => track("foundry_verify_attempt", { action: "go-to-test" })}
                  className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                  style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
                >
                  Run a public test →
                </Link>
                <Link
                  href="/foundry/start"
                  data-analytics="verify-to-start"
                  className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
                >
                  Request a full review →
                </Link>
              </div>
              <p className="mt-3 font-mono text-[7px] uppercase tracking-[0.25em] text-white/20">
                Public tests include a demo reference. Full reviews issue governed tokens.
              </p>
            </div>
          </div>

        </div>
      </main>
    </Layout>
  );
}
