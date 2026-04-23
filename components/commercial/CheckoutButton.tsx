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
  email,
  originPath,
  className,
  style,
  disabled,
  onCheckoutStart,
}: Props) {
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    if (loading || disabled) return;

    const resolvedEmail =
      email?.trim() ||
      (typeof window !== "undefined"
        ? window.prompt("Enter the email address for access.")?.trim() || ""
        : "");

    if (!resolvedEmail) {
      console.error("Checkout failed", { error: "EMAIL_REQUIRED" });
      return;
    }

    setLoading(true);
    onCheckoutStart?.();

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        console.error("Checkout failed", data);
      }
    } catch (error) {
      setLoading(false);
      console.error("Checkout failed", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className}
      style={style}
    >
      {loading ? "Preparing checkout..." : children}
    </button>
  );
}
