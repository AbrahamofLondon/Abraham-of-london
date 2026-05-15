"use client";

import React, { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics/track";
import { trackLaunch } from "@/lib/analytics/client-launch-events";
import { getProductAmountGbp } from "@/lib/commercial/catalog";

type StrategyRoomConversionBridgeProps = {
  className?: string;
  price?: number;
  checkoutPriceCode?: string;
  originPath?: string;
  ctaHref?: string;
  primaryCtaLabel?: string;
  title?: string;
  description?: string;
  signals?: string[];
};

const DEFAULT_SIGNALS = [
  "The report has identified a material constraint that requires a decision",
  "The next risk is delay, avoidance, or fragmented execution",
  "Intervention logic is now required",
];

export default function StrategyRoomConversionBridge({
  className = "mt-16",
  price = getProductAmountGbp("strategy_room"),
  checkoutPriceCode = "strategy_room",
  originPath = "/strategy-room",
  primaryCtaLabel = "Enter execution environment",
  title = "Action layer",
  description = "A governed execution environment for decisions that cannot remain theoretical.",
  signals = DEFAULT_SIGNALS,
}: StrategyRoomConversionBridgeProps) {
  const tiers = [
    {
      label: "Entry",
      productCode: checkoutPriceCode,
      price,
      description: "One controlled execution environment for the active decision.",
    },
    {
      label: "Active / multi-decision",
      productCode: "strategy_room_extended",
      price: getProductAmountGbp("strategy_room_extended"),
      description: "Execution sequencing across multiple linked decisions.",
    },
  ];
  const [selectedTier, setSelectedTier] = useState(tiers[0]!);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutCancelled, setCheckoutCancelled] = useState(false);
  const bridgeMountTime = React.useRef(Date.now());

  const escalationTone = useMemo(() => {
    const joined = signals.join(" ").toLowerCase();
    if (joined.includes("material") || joined.includes("delay") || joined.includes("constraint")) {
      return "The signal is no longer asking for more interpretation. It is asking for an ordered intervention path.";
    }
    return "The next step is not more diagnosis. It is deciding whether intervention is warranted now.";
  }, [signals]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedEmail = window.sessionStorage.getItem("aol_strategy_room_checkout_email") || "";
    const params = new URLSearchParams(window.location.search);
    if (storedEmail) setEmail(storedEmail);
    if (params.get("checkout") === "cancelled") {
      setCheckoutCancelled(true);
      setMessage("Entry cancelled. No payment was taken. The decision remains unresolved.");
    }
    track("strategy_room_bridge_viewed", {
      checkout_cancelled: params.get("checkout") === "cancelled",
      signal_count: signals.length,
    });
    const startedAt = Date.now();
    const handleUnload = () => {
      if (Date.now() - startedAt > 5000) {
        track("strategy_room_bridge_abandoned", {
          signal_count: signals.length,
        });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [signals.length]);

  async function handleCheckout() {
    setLoading(true);
    setMessage("Preparing execution environment...");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("aol_strategy_room_checkout_email", email);
    }
    trackLaunch("strategy_room_payment_clicked", "strategy_room_conversion_bridge");
    const hesitation_ms = Date.now() - bridgeMountTime.current;
    track("strategy_room_checkout_clicked", {
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
        originPath,
      }),
    });

    const data = await res.json();

    if (data?.url) {
      setMessage("Securing intervention entry...");
      window.location.href = data.url;
    } else {
      setLoading(false);
      const reason = data?.reason || data?.error || "no_url_returned";
      const errorMessage = reason === "EMAIL_REQUIRED"
        ? "A valid email is required before execution can be prepared."
        : reason === "STRIPE_CHECKOUT_CREATE_FAILED"
        ? "Execution pricing could not be resolved. Please try again."
        : reason === "PRODUCT_INACTIVE" || reason === "NOT_FOUND"
        ? "This execution tier is not currently available."
        : "Execution entry could not be prepared. Please try again or return to diagnostics.";
      setMessage(errorMessage);
      track("checkout_failed", {
        price_code: selectedTier.productCode,
        reason,
      });
    }
  }

  return (
    <div className={`${className} border-t border-neutral-800 pt-10`}>
      {checkoutCancelled && (
        <div className="mb-6 border border-amber-700/30 bg-amber-950/20 p-4 text-sm text-amber-100/75">
          Entry cancelled. No payment was taken. The decision remains unresolved.
        </div>
      )}

      <h1 className="mb-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">{title}</h1>
      <p className="mb-6 text-sm leading-6 text-white/68">{description}</p>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="border border-white/10 bg-white/[0.025] p-5">
          <h3 className="font-medium mb-3">Diagnostics stops at position</h3>
          <ul className="space-y-2 text-sm text-white/62">
            <li>• It clarifies the problem</li>
            <li>• It does not execute the intervention</li>
          </ul>
        </div>
        <div className="border border-amber-700/30 bg-amber-950/10 p-5">
          <h3 className="font-medium mb-3">Strategy Room executes</h3>
          <ul className="space-y-2 text-sm text-white/72">
            <li>• decision compression</li>
            <li>• error prevention</li>
            <li>• execution clarity</li>
          </ul>
        </div>
      </div>

      <div className="mb-6 border border-white/10 bg-black p-5">
        <h3 className="font-medium mb-3">If you stop here</h3>
        <ul className="space-y-2 text-sm text-white/62">
          <li>• You understand the problem</li>
          <li>• You have not changed the outcome</li>
          <li>• The gap between diagnosis and intervention is where organisations drift</li>
        </ul>
      </div>

      <div className="mb-6 border border-white/10 bg-white/[0.025] p-5">
        <h3 className="font-medium mb-3">Intervention fragment</h3>
        <div className="space-y-2 text-sm text-white/62">
          <p>Intervention priority: restore decision authority boundary</p>
          <p>Immediate constraint: governance conflict at reporting layer</p>
          <p>First move: collapse duplicate approval path within 14 days</p>
        </div>
      </div>

      <div className="mb-6 text-sm leading-6 text-white/56">
        {escalationTone}
        <div className="mt-3 space-y-1">
          {signals.slice(0, 3).map((signal) => (
            <div key={signal}>• {signal}</div>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
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
      <div className="mb-4 text-sm text-white/50">
        One-time execution entry · No subscription
      </div>

      <input
        type="email"
        placeholder="Enter your email"
        className="mb-4 min-h-[44px] w-full border border-white/16 bg-black p-3 text-white"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("aol_strategy_room_checkout_email", e.target.value);
          }
        }}
      />

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="min-h-[44px] w-full bg-white py-3 font-medium text-black disabled:opacity-60"
      >
        {loading ? "Preparing execution environment..." : primaryCtaLabel}
      </button>
      {message && <p className="mt-3 text-sm text-white/56">{message}</p>}
    </div>
  );
}
