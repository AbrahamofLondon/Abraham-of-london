"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics/track";

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
  "You need intervention logic, not another layer of interpretation",
];

export default function StrategyRoomConversionBridge({
  className = "mt-16",
  price = 395,
  checkoutPriceCode = "strategy_room",
  originPath = "/strategy-room",
  primaryCtaLabel = "Enter Strategy Room",
  title = "From Diagnosis to Intervention",
  description = "You now have a diagnosis. Strategy Room exists when the next move requires governed intervention logic.",
  signals = DEFAULT_SIGNALS,
}: StrategyRoomConversionBridgeProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutCancelled, setCheckoutCancelled] = useState(false);

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
      setMessage("Checkout cancelled. No payment was taken. Your progress has been preserved where possible.");
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
    setMessage("Preparing Strategy Room access...");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("aol_strategy_room_checkout_email", email);
    }
    track("strategy_room_checkout_clicked", {
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
        originPath,
      }),
    });

    const data = await res.json();

    if (data?.url) {
      setMessage("Securing intervention entry...");
      window.location.href = data.url;
    } else {
      setLoading(false);
      setMessage("Checkout could not be prepared. Check the email field and try again.");
    }
  }

  return (
    <div className={`${className} border-t border-neutral-800 pt-10`}>
      {checkoutCancelled && (
        <div className="mb-6 border border-amber-700/30 bg-amber-950/20 p-4 text-sm text-amber-100/75">
          Checkout cancelled. No payment was taken. Your progress has been preserved where possible.
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <p className="text-gray-400 mb-6">{description}</p>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="border border-neutral-800 bg-neutral-950 p-5">
          <h3 className="font-medium mb-3">What this report does not do</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• It clarifies the problem</li>
            <li>• It does not execute the intervention</li>
          </ul>
        </div>
        <div className="border border-amber-700/30 bg-amber-950/10 p-5">
          <h3 className="font-medium mb-3">What Strategy Room adds</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• intervention logic</li>
            <li>• governed next moves</li>
            <li>• action under live constraints</li>
          </ul>
        </div>
      </div>

      <div className="border border-neutral-800 bg-black p-5 mb-6">
        <h3 className="font-medium mb-3">If you stop here</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• You understand the problem</li>
          <li>• You have not changed the outcome</li>
          <li>• The gap between diagnosis and intervention is where organisations drift</li>
        </ul>
      </div>

      <div className="border border-neutral-800 bg-neutral-950 p-5 mb-6">
        <h3 className="font-medium mb-3">Sample intervention fragment</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p>Intervention priority: restore decision authority boundary</p>
          <p>Immediate constraint: governance conflict at reporting layer</p>
          <p>First move: collapse duplicate approval path within 14 days</p>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-6">
        {escalationTone}
        <div className="mt-3 space-y-1">
          {signals.slice(0, 3).map((signal) => (
            <div key={signal}>• {signal}</div>
          ))}
        </div>
      </div>

      <div className="text-2xl font-semibold mb-2">£{price}</div>
      <div className="text-sm text-gray-500 mb-4">
        One-time intervention entry • No subscription
      </div>

      <input
        type="email"
        placeholder="Enter your email"
        className="w-full p-3 mb-4 bg-black border border-neutral-700"
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
        className="w-full bg-white text-black py-3 font-medium"
      >
        {loading ? "Preparing Strategy Room access..." : primaryCtaLabel}
      </button>
      {message && <p className="mt-3 text-sm text-gray-500">{message}</p>}
    </div>
  );
}
