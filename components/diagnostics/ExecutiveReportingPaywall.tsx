"use client";

import { useEffect, useRef, useState } from "react";
import { readConstitutionalThread } from "@/lib/diagnostics/session-thread";
import { track } from "@/lib/analytics/track";

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
  price = 95,
  checkoutPriceCode = "executive_reporting",
  primaryCtaLabel = "Continue to Executive Interpretation",
}: ExecutiveReportingPaywallProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutCancelled, setCheckoutCancelled] = useState(false);
  const paywallMountTime = useRef(Date.now());
  const [currentSignal, setCurrentSignal] = useState<string[]>([
    "Structural strain has been detected",
    "Interpretation is now required to determine consequence",
    "This stage translates condition into decision impact",
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedEmail = window.sessionStorage.getItem("aol_exec_checkout_email") || "";
    const params = new URLSearchParams(window.location.search);
    const thread = readConstitutionalThread();

    if (storedEmail) setEmail(storedEmail);
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
    });
    const startedAt = Date.now();
    const handleUnload = () => {
      if (Date.now() - startedAt > 5000) {
        track("executive_reporting_paywall_abandoned", {
          has_thread: Boolean(thread),
        });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  async function handleCheckout() {
    setLoading(true);
    setMessage("Preparing Executive Reporting checkout...");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("aol_exec_checkout_email", email);
    }
    const hesitation_ms = Date.now() - paywallMountTime.current;
    track("executive_reporting_checkout_clicked", {
      price_code: checkoutPriceCode,
      has_email: Boolean(email.trim()),
      hesitation_ms,
    });

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceCode: checkoutPriceCode,
        email,
      }),
    });

    const data = await res.json();

    if (data?.url) {
      setMessage("Securing your interpretation session...");
      window.location.href = data.url;
    } else {
      setLoading(false);
      setMessage("Checkout could not be prepared. Check the email field and try again.");
      track("checkout_failed", {
        price_code: checkoutPriceCode,
        reason: data?.error || "no_url_returned",
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
      {/* DIAGNOSIS PRESSURE */}
      <div className="mb-5 text-sm leading-6 text-white/58">
        Your diagnostic signal is not inconclusive. It is incomplete.
      </div>

      <h1 className="mb-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">
        Continue to Executive Interpretation
      </h1>

      <p className="mb-6 text-sm leading-6 text-white/68">
        You have reached the point where scoring is no longer sufficient.
        Interpretation is required.
      </p>

      {checkoutCancelled && (
        <div className="bg-amber-950/20 border border-amber-700/30 p-4 mb-6 text-sm text-amber-100/75">
          Checkout cancelled. No payment was taken. Your progress has been preserved where possible.
        </div>
      )}

      {/* SIGNAL SUMMARY */}
      <div className="mb-6 border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="mb-3 font-medium text-white">Your current signal</div>
        <ul className="space-y-2 text-sm leading-6 text-white/72">
          {currentSignal.slice(0, 3).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      {/* STAGE DIFFERENCE */}
      <div className="mb-6 border border-white/10 bg-black/35 p-5 text-sm sm:p-6">
        <div className="mb-3 font-medium text-white">What changes in Stage 4</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-white/10 p-4">
            <div className="mb-1 text-white/45">Stages 1-3</div>
            <div className="text-white/72">Detect condition.</div>
          </div>
          <div className="border border-amber-700/30 bg-amber-950/10 p-4">
            <div className="text-amber-200/70 mb-1">Stage 4</div>
            <div className="text-gray-200">Interpret consequence, financial exposure, and priority decisions.</div>
          </div>
        </div>
      </div>

      {/* OUTPUT SPECIFICITY */}
      <div className="mb-6">
        <h3 className="mb-3 font-medium text-white">You will receive:</h3>
        <ul className="space-y-2 text-sm leading-6 text-white/72">
          <li>• Structural diagnosis (not a score)</li>
          <li>• Financial exposure estimate</li>
          <li>• Decision priority stack</li>
          <li>• Failure mode analysis</li>
          <li>• Governed recommendations</li>
        </ul>
      </div>

      {/* PREVIEW */}
      <div className="mb-6 border border-white/10 bg-black/35 p-5 text-sm sm:p-6">
        <div className="mb-2 font-medium text-white">
          Example Output
        </div>
        <div className="text-white/66">
          <p className="mb-2">
            “Execution coherence collapsing under governance drift”
          </p>
          <p>Financial exposure: £420,000 (6 months)</p>
          <p className="mt-2">
            Priority:
            <br />1. Restore authority clarity
            <br />2. Collapse redundant reporting lines
            <br />3. Stabilise execution cadence
          </p>
        </div>
      </div>

      {/* CONSEQUENCE */}
      <div className="mb-6 text-sm leading-6 text-white/56">
        <div className="mb-2 font-medium text-white/78">What happens if this remains unresolved</div>
        <br />• execution variance will increase
        <br />• decision latency will compound
        <br />• cost will not remain static
      </div>

      {/* PRICE */}
      <div className="mb-6">
        <div className="text-2xl font-semibold">£{price}</div>
        <div className="text-sm text-white/50">
          One-time analysis • No subscription
        </div>
      </div>

      {/* EMAIL */}
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/48">
        One-time analysis • No subscription • Output generated from your actual submission
      </p>
      <input
        type="email"
        placeholder="Enter your email"
        className="mb-4 min-h-[44px] w-full border border-white/16 bg-black p-3 text-white"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("aol_exec_checkout_email", e.target.value);
          }
        }}
      />

      {/* CTA */}
      <p className="mb-2 text-sm text-white/56">
        This is where the system stops scoring and starts interpreting.
      </p>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="min-h-[44px] w-full bg-white py-3 font-medium text-black disabled:opacity-60"
      >
        {loading ? "Preparing Executive Reporting checkout..." : primaryCtaLabel}
      </button>
      {message && (
        <p className="mt-3 text-sm text-white/56">{message}</p>
      )}
    </div>
  );
}
