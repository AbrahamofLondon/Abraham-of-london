"use client";

import { useEffect, useRef, useState } from "react";
import { readConstitutionalThread } from "@/lib/diagnostics/session-thread";
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
  primaryCtaLabel = "Move to Executive Reporting",
}: ExecutiveReportingPaywallProps) {
  const tiers = [
    {
      label: "Standard",
      productCode: checkoutPriceCode,
      price,
      description: "Consequence pricing, contradiction hierarchy, and governed priority stack.",
    },
    {
      label: "Advanced — deeper consequence modelling",
      productCode: "executive_reporting_priority",
      price: getProductAmountGbp("executive_reporting_priority"),
      description: "Adds deeper predictive consequence modelling and escalation-readiness pressure.",
    },
  ];
  const [selectedTier, setSelectedTier] = useState(tiers[0]!);
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
      price_code: selectedTier.productCode,
      has_email: Boolean(email.trim()),
      hesitation_ms,
    });

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productCode: selectedTier.productCode,
        email,
      }),
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
        : reason === "STRIPE_CHECKOUT_CREATE_FAILED"
        ? "Decision pricing could not be resolved. Please try again."
        : "Decision session could not be prepared. Please try again or return to diagnostics.";
      setMessage(errorMessage);
      track("checkout_failed", {
        price_code: selectedTier.productCode,
        reason,
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
      {/* DIAGNOSIS PRESSURE */}
      <div className="mb-5 text-sm leading-6 text-white/58">
        Your diagnostic result is usable. This layer exists when consequence and decision order must be made explicit.
      </div>

      <h1 className="mb-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">
        Move to Executive Reporting
      </h1>

      <p className="mb-6 text-sm leading-6 text-white/68">
        This is the layer that prices consequence, orders the decision stack, and prepares execution.
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
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {tiers.map((tier) => {
            const active = tier.productCode === selectedTier.productCode;
            return (
              <button
                key={tier.productCode}
                type="button"
                onClick={() => setSelectedTier(tier)}
                className={`border p-4 text-left ${active ? "border-amber-400/45 bg-amber-400/[0.07]" : "border-white/10 bg-white/[0.02]"}`}
              >
                <div className="text-sm font-medium text-white">{tier.label}</div>
                <div className="mt-1 text-2xl font-semibold">£{tier.price}</div>
                <div className="mt-2 text-xs leading-5 text-white/50">{tier.description}</div>
              </button>
            );
          })}
        </div>
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
        This is the point where the condition is translated into consequence, exposure, and ordered decisions.
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
