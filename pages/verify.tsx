/* pages/verify.tsx — PUBLIC VERIFICATION PAGE
 *
 * Allows anyone to verify the authenticity of a Foundry-issued
 * verification token. No auth required. Public.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

export default function VerifyPage() {
  const [token, setToken] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [result, setResult] = React.useState<{ valid: boolean; message: string } | null>(null);

  async function handleVerify() {
    if (!token.trim()) return;
    setVerifying(true);
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      setResult({ valid: data.valid === true, message: data.message || "Verification completed." });
    } catch {
      setResult({ valid: false, message: "Could not reach verification service. Try again later." });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Layout
      title="Verify | Abraham of London"
      description="Verify the authenticity of a Foundry-issued verification token."
      canonicalUrl="/verify"
    >
      <Head><title>Verify | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl px-6 py-24 lg:px-10">
          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Verify
          </h1>
          <p className="mt-4 text-base leading-7 text-white/50">
            Enter a verification token to confirm the authenticity of a Foundry-issued report or assessment.
          </p>

          <div className="mt-10 space-y-4">
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste verification token..."
              className="w-full border bg-black/30 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none font-mono tracking-wider"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={handleVerify}
              disabled={!token.trim() || verifying}
              className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30"
              style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
            >
              {verifying ? "Verifying..." : "Verify Token"}
            </button>
          </div>

          {result && (
            <div className={`mt-8 border p-5 ${
              result.valid ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
            }`}>
              <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${
                result.valid ? "text-emerald-400" : "text-red-400"
              }`}>
                {result.valid ? "✓ Verified" : "✗ Not Verified"}
              </p>
              <p className="mt-2 text-sm text-white/60">{result.message}</p>
            </div>
          )}

          <div className="mt-16 border-t border-white/10 pt-8">
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">How verification works</p>
            <p className="mt-3 text-sm leading-6 text-white/40">
              Each Foundry-issued report or assessment is issued with a unique verification token.
              This token is cryptographically bound to the report content and timestamp.
              Entering the token here confirms that the report was genuinely issued by the Foundry
              and has not been tampered with since issuance.
            </p>
          </div>

          {/* ── Conversion CTA ────────────────────────────────────────────── */}
          <div className="mt-12 border border-white/8 bg-white/2 p-6 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">
              Don't have a token yet?
            </p>
            <Link
              href="/foundry"
              data-analytics="verify-to-foundry"
              className="inline-block border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
              style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
            >
              Run a public test →
            </Link>
            <p className="mt-3 font-mono text-[7px] uppercase tracking-[0.25em] text-white/20">
              Public tests include a demo reference. Full reviews issue verifiable tokens.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
