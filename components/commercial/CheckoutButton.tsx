"use client";

import * as React from "react";

type Props = {
  productCode: string;
  children: React.ReactNode;
  email?: string;
  originPath?: string;
  onCheckoutStart?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick">;

export default function CheckoutButton({
  productCode,
  children,
  email: emailProp,
  originPath,
  className,
  style,
  disabled,
  onCheckoutStart,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [email, setEmail] = React.useState(emailProp ?? "");
  const [showEmailInput, setShowEmailInput] = React.useState(false);

  React.useEffect(() => {
    if (emailProp) setEmail(emailProp);
  }, [emailProp]);

  const handleCheckout = async () => {
    if (loading || disabled) return;
    setError("");

    const resolvedEmail = email.trim();
    if (!resolvedEmail || !resolvedEmail.includes("@")) {
      setShowEmailInput(true);
      if (!resolvedEmail) setError("Email required to proceed.");
      else setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    onCheckoutStart?.();

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode,
          priceCode: productCode,
          email: resolvedEmail,
          originPath,
        }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
        const reason = data?.reason || data?.error || "unknown";
        setError(
          reason === "EMAIL_REQUIRED" ? "A valid email is required."
          : reason === "STRIPE_CHECKOUT_CREATE_FAILED" ? "Pricing could not be resolved. Please try again."
          : reason === "PRODUCT_INACTIVE" || reason === "NOT_FOUND" ? "This product is not currently available."
          : reason === "PRODUCT_CONTRACTED" ? "This product is available by agreement only."
          : reason === "MANUAL_BILLING_REQUIRED" ? "This product currently requires assisted billing."
          : reason === "CHECKOUT_NOT_AVAILABLE" ? "Self-serve checkout is not currently available for this product."
          : reason === "STRIPE_PRICE_MISSING" || reason === "INVALID_PRODUCT_STATE" ? "This product is not configured for checkout."
          : "Checkout could not be prepared. Please try again."
        );
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div>
      {showEmailInput && !emailProp && (
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="you@organisation.com"
          style={{
            width: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.80)",
            padding: "8px 12px",
            fontSize: "13px",
            marginBottom: "8px",
            outline: "none",
          }}
          onKeyDown={(e) => { if (e.key === "Enter") handleCheckout(); }}
        />
      )}
      {error && (
        <p style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          color: "rgba(252,165,165,0.60)",
          marginBottom: "6px",
        }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={className}
        style={style}
      >
        {loading ? "Preparing checkout..." : children}
      </button>
    </div>
  );
}
