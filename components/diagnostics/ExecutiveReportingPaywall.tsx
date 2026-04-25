"use client";

import { useEffect, useRef, useState } from "react";
import { readConstitutionalThread } from "@/lib/diagnostics/session-thread";
import { loadSpineFromSession } from "@/lib/decision/spine-persistence";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import { track } from "@/lib/analytics/track";
import { getProductAmountGbp } from "@/lib/commercial/catalog";

type ExecutiveReportingPaywallProps = {
  price?: number;
  checkoutPriceCode?: string;
  primaryCtaLabel?: string;
  ctaHref?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  sampleLines?: Array<{ label: string; value: string }>;
};

export default function ExecutiveReportingPaywall({
  price = getProductAmountGbp("executive_reporting"),
  checkoutPriceCode = "executive_reporting",
  primaryCtaLabel = "See the cost you are already paying",
}: ExecutiveReportingPaywallProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutCancelled, setCheckoutCancelled] = useState(false);
  const [committed, setCommitted] = useState(false);
  const paywallMountTime = useRef(Date.now());
  const [spine, setSpine] = useState<IntelligenceSpine | null>(null);
  const [currentSignal, setCurrentSignal] = useState<string[]>([
    "Structural strain has been detected",
    "Interpretation is now required to determine consequence",
    "This stage translates condition into decision impact",
  ]);

  // Case-linked data from spine
  const costOfDelay = spine?.case.costOfDelay ?? null;
  const hasCostText = costOfDelay && costOfDelay.trim().length > 5;
  const conditionClass = spine?.deterministic.conditionClass ?? null;
  const forcedAction = spine?.synthesis?.concreteMove ?? spine?.case.forcedAction ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedEmail = window.sessionStorage.getItem("aol_exec_checkout_email") || "";
    const params = new URLSearchParams(window.location.search);
    const thread = readConstitutionalThread();
    const loadedSpine = loadSpineFromSession();

    if (storedEmail) setEmail(storedEmail);
    if (loadedSpine) setSpine(loadedSpine);

    if (params.get("checkout") === "cancelled") {
      setCheckoutCancelled(true);
      setMessage("Checkout cancelled. No payment was taken. Your progress has been preserved where possible.");
    }
    if (thread) {
      const weakestDomain = Object.entries(thread.domainScores).sort((a, b) => a[1] - b[1])[0];
      setCurrentSignal([
        thread.failureModes[0] || `${weakestDomain?.[0] || "Constitutional"} strain remains active`,
        thread.teamFindings
          ? `${thread.teamFindings.patternTitle} has already been confirmed`
          : "Team confirmation is still unresolved",
        `${thread.route} route pressure with ${thread.readinessTier.toLowerCase()} readiness`,
      ]);
    }
    track("executive_reporting_paywall_viewed", {
      checkout_cancelled: params.get("checkout") === "cancelled",
      has_thread: Boolean(thread),
      has_spine: Boolean(loadedSpine),
    });
    const startedAt = Date.now();
    const handleUnload = () => {
      if (Date.now() - startedAt > 5000) {
        track("executive_reporting_paywall_abandoned", { has_thread: Boolean(thread) });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  async function handleCheckout() {
    setLoading(true);
    setMessage("Preparing decision session...");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("aol_exec_checkout_email", email);
    }
    track("executive_reporting_checkout_clicked", {
      price_code: checkoutPriceCode,
      has_email: Boolean(email.trim()),
      hesitation_ms: Date.now() - paywallMountTime.current,
      committed,
    });

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productCode: checkoutPriceCode, email }),
    });

    const data = await res.json();

    if (data?.url) {
      setMessage("Securing your decision session...");
      window.location.href = data.url;
    } else {
      setLoading(false);
      const reason = data?.reason || data?.error || "no_url_returned";
      const errorMessage = reason === "EMAIL_REQUIRED"
        ? "A valid email is required before the decision session can begin."
        : "Decision session could not be prepared. Please try again.";
      setMessage(errorMessage);
      track("checkout_failed", { price_code: checkoutPriceCode, reason });
    }
  }

  const GOLD = "#C9A96E";
  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">

      {checkoutCancelled && (
        <div className="border border-amber-700/30 bg-amber-950/20 p-4 mb-6 text-sm text-amber-100/75">
          Checkout cancelled. No payment was taken.
        </div>
      )}

      {/* SIGNAL SUMMARY */}
      <div className="mb-6 border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="mb-3 font-medium text-white" style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase" }}>Your current signal</div>
        <ul className="space-y-2 text-sm leading-6 text-white/72">
          {currentSignal.slice(0, 3).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      {/* ═══ CASE-LINKED PRICE FRAMING ═══ */}
      <div className="mb-6 border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        {hasCostText ? (
          <>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>
              You said this is costing:
            </p>
            <p className="mt-2 text-[15px] leading-7 text-white/70" style={{ fontStyle: "italic" }}>
              &ldquo;{costOfDelay}&rdquo;
            </p>
            <p className="mt-3 text-sm leading-6 text-white/45">
              If that is even partially accurate, this is already more expensive than £{price}.
            </p>
          </>
        ) : conditionClass ? (
          <>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.50)" }}>
              You said this is affecting:
            </p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {conditionClass === "authority" && "Authority, decision ownership, and who actually decides."}
              {conditionClass === "definition" && "Decision clarity, alignment, and shared understanding."}
              {conditionClass === "execution" && "Execution speed, accountability, and follow-through."}
              {conditionClass === "instability" && "Structural stability — untested under real pressure."}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/40">
              That is not neutral. It compounds.
            </p>
          </>
        ) : (
          <p className="text-sm leading-6 text-white/50">
            Your diagnostic result is usable. This layer exists when consequence must be made explicit.
          </p>
        )}
        <p className="mt-4 text-[13px] font-medium leading-6" style={{ color: `${GOLD}CC` }}>
          This is where that cost becomes visible.
        </p>
      </div>

      {/* WHAT HAPPENS IN STAGE 4 */}
      <div className="mb-6 border border-white/10 bg-black/35 p-5 text-sm sm:p-6">
        <div className="mb-3 font-medium text-white" style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>What changes here</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-white/10 p-4">
            <div className="mb-1 text-white/45">Stages 1-3</div>
            <div className="text-white/72">Detect the condition.</div>
          </div>
          <div className="border border-amber-700/30 bg-amber-950/10 p-4">
            <div className="text-amber-200/70 mb-1">This stage</div>
            <div className="text-gray-200">Price the consequence. Order the decisions.</div>
          </div>
        </div>
      </div>

      {/* OUTPUT LIST — strong language */}
      <div className="mb-6">
        <h3 className="mb-3 font-medium text-white" style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>This produces:</h3>
        <ul className="space-y-2 text-sm leading-6 text-white/72">
          <li>• Position statement — what the condition actually is</li>
          <li>• Exposure direction — financial and structural</li>
          <li>• Decision priority stack — what must be decided first</li>
          <li>• Failure mode identification — where it breaks next</li>
          <li>• Enforced next action — not a suggestion</li>
        </ul>
      </div>

      {/* TIME ANCHOR — not money anchor */}
      <div className="mb-6 border-l-2 border-white/10 pl-4">
        <p className="text-sm leading-6 text-white/50">
          One month of drift vs £{price}.
        </p>
        <p className="mt-1 text-xs leading-5 text-white/30" style={{ ...mono, letterSpacing: "0.08em" }}>
          Used when the decision cannot afford to drift.
        </p>
      </div>

      {/* PRICE — single anchor, no tiers */}
      <div className="mb-6 border border-amber-400/30 bg-amber-400/[0.05] p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-sm font-medium text-white">Executive Reporting</div>
            <div className="mt-1 text-xs text-white/40">One-time analysis. No subscription. From your evidence.</div>
          </div>
          <div className="text-3xl font-semibold text-white">£{price}</div>
        </div>
      </div>

      {/* TRUTH FILTER */}
      <div className="mb-6 border-l-2 border-white/[0.06] pl-4">
        <p className="text-sm leading-7 text-white/40" style={{ fontStyle: "italic" }}>
          Most people do not buy this. Not because it is expensive. Because they already know what it will say.
        </p>
      </div>

      {/* EMAIL */}
      <input
        type="email"
        placeholder="Your email"
        className="mb-4 min-h-[44px] w-full border border-white/16 bg-black p-3 text-white"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("aol_exec_checkout_email", e.target.value);
          }
        }}
      />

      {/* ═══ MICRO-COMMITMENT CHECKPOINT ═══ */}
      {!committed ? (
        <div className="mb-4 border border-white/10 bg-white/[0.02] p-5">
          <p className="text-sm font-medium text-white mb-3">
            Are you prepared to act on what this will show?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCommitted(true);
                track("er_commitment_accepted");
              }}
              className="flex-1 border border-amber-400/40 bg-amber-400/[0.08] py-3 text-sm font-medium text-white"
            >
              Yes — continue
            </button>
            <button
              onClick={() => {
                track("er_commitment_declined");
                setMessage("Then do not proceed. This only works if the decision matters.");
              }}
              className="flex-1 border border-white/10 py-3 text-sm text-white/50"
            >
              Not yet
            </button>
          </div>
        </div>
      ) : (
        /* CTA — only visible after commitment */
        <div>
          <p className="mb-2 text-sm text-white/45">
            You are about to make the cost of this decision visible. Once seen, it cannot be unseen.
          </p>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="min-h-[44px] w-full bg-white py-3 font-medium text-black disabled:opacity-60"
          >
            {loading ? "Preparing decision session..." : primaryCtaLabel}
          </button>
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm text-white/56">{message}</p>
      )}
    </div>
  );
}
