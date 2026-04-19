"use client";

import { useEffect, useState } from "react";
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
    track("executive_reporting_checkout_clicked", {
      price_code: checkoutPriceCode,
      has_email: Boolean(email.trim()),
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
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      {/* DIAGNOSIS PRESSURE */}
      <div className="mb-8 text-sm text-gray-500">
        Your diagnostic signal is not inconclusive. It is incomplete.
      </div>

      <h1 className="text-3xl font-semibold mb-4">
        Continue to Executive Interpretation
      </h1>

      <p className="text-gray-400 mb-6">
        You have reached the point where scoring is no longer sufficient.
        Interpretation is required.
      </p>

      {checkoutCancelled && (
        <div className="bg-amber-950/20 border border-amber-700/30 p-4 mb-6 text-sm text-amber-100/75">
          Checkout cancelled. No payment was taken. Your progress has been preserved where possible.
        </div>
      )}

      {/* SIGNAL SUMMARY */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 mb-8">
        <div className="font-medium mb-3">Your current signal</div>
        <ul className="space-y-2 text-sm text-gray-300">
          {currentSignal.slice(0, 3).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      {/* STAGE DIFFERENCE */}
      <div className="bg-neutral-950 border border-neutral-800 p-6 mb-8 text-sm">
        <div className="font-medium mb-3">What changes in Stage 4</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-neutral-800 p-4">
            <div className="text-gray-500 mb-1">Stages 1-3</div>
            <div className="text-gray-300">Detect condition.</div>
          </div>
          <div className="border border-amber-700/30 bg-amber-950/10 p-4">
            <div className="text-amber-200/70 mb-1">Stage 4</div>
            <div className="text-gray-200">Interpret consequence, financial exposure, and priority decisions.</div>
          </div>
        </div>
      </div>

      {/* OUTPUT SPECIFICITY */}
      <div className="mb-8">
        <h3 className="font-medium mb-3">You will receive:</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Structural diagnosis (not a score)</li>
          <li>• Financial exposure estimate</li>
          <li>• Decision priority stack</li>
          <li>• Failure mode analysis</li>
          <li>• Governed recommendations</li>
        </ul>
      </div>

      {/* PREVIEW */}
      <div className="bg-neutral-950 border border-neutral-800 p-6 mb-8 text-sm">
        <div className="font-medium mb-2">
          Example Output
        </div>
        <div className="text-gray-400">
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
      <div className="text-sm text-gray-500 mb-8">
        <div className="font-medium text-gray-300 mb-2">What happens if this remains unresolved</div>
        <br />• execution variance will increase
        <br />• decision latency will compound
        <br />• cost will not remain static
      </div>

      {/* PRICE */}
      <div className="mb-6">
        <div className="text-2xl font-semibold">£{price}</div>
        <div className="text-sm text-gray-500">
          One-time analysis • No subscription
        </div>
      </div>

      {/* EMAIL */}
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
        One-time analysis • No subscription • Output generated from your actual submission
      </p>
      <input
        type="email"
        placeholder="Enter your email"
        className="w-full p-3 mb-4 bg-black border border-neutral-700"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("aol_exec_checkout_email", e.target.value);
          }
        }}
      />

      {/* CTA */}
      <p className="text-sm text-gray-500 mb-2">
        This is where the system stops scoring and starts interpreting.
      </p>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-white text-black py-3 font-medium"
      >
        {loading ? "Preparing Executive Reporting checkout..." : primaryCtaLabel}
      </button>
      {message && (
        <p className="mt-3 text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}
