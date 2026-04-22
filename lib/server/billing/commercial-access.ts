import crypto from "crypto";
import type { GetServerSidePropsContext } from "next";
import Stripe from "stripe";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";

export type CommercialProduct = "executive_reporting" | "strategy_room";

export const COMMERCIAL_PRODUCTS: Record<
  CommercialProduct,
  {
    priceCode: CommercialProduct;
    productCode: "assessment.executive_reporting" | "strategy-room.entry";
    tier: string;
    amount: number;
    name: string;
    successPath: string;
    cancelPath: string;
    cookieName: string;
  }
> = {
  executive_reporting: {
    priceCode: "executive_reporting",
    productCode: "assessment.executive_reporting",
    tier: "one-time-executive-reporting",
    amount: 9500,
    name: "Executive Reporting",
    successPath: "/diagnostics/executive-reporting/run",
    cancelPath: "/diagnostics/executive-reporting",
    cookieName: "aol_paid_executive_reporting",
  },
  strategy_room: {
    priceCode: "strategy_room",
    productCode: "strategy-room.entry",
    tier: "one-time-strategy-room",
    amount: 39500,
    name: "Strategy Room",
    successPath: "/strategy-room",
    cancelPath: "/strategy-room",
    cookieName: "aol_paid_strategy_room",
  },
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export function getCommercialCookieSecret(): string {
  const dedicated =
    process.env.COMMERCIAL_COOKIE_SECRET ||
    process.env.COMMERCIAL_ACCESS_SECRET;

  if (dedicated?.trim()) return dedicated.trim();

  if (process.env.NODE_ENV === "production") {
    throw new Error("COMMERCIAL_COOKIE_SECRET is required in production.");
  }

  const fallback =
    process.env.NEXTAUTH_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    "aol-local-commercial-access";

  console.warn(
    "[COMMERCIAL_COOKIE_SECRET_MISSING] Using development-only commercial cookie fallback.",
  );
  return fallback;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getCommercialCookieSecret()).update(value).digest("hex");
}

function cookieValue(product: CommercialProduct, sessionId: string): string {
  const payload = `${product}:${sessionId}`;
  return `${payload}.${sign(payload)}`;
}

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const pair = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!pair) return null;
  return decodeURIComponent(pair.slice(name.length + 1));
}

export function hasCommercialAccessCookie(
  cookieHeader: string | undefined,
  product: CommercialProduct,
): boolean {
  const config = COMMERCIAL_PRODUCTS[product];
  const raw = readCookie(cookieHeader, config.cookieName);
  if (!raw) return false;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot < 1) return false;
  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);
  if (!payload.startsWith(`${product}:`)) return false;

  const expected = sign(payload);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function setCommercialAccessCookie(
  ctx: GetServerSidePropsContext,
  product: CommercialProduct,
  sessionId: string,
): void {
  const config = COMMERCIAL_PRODUCTS[product];
  const value = encodeURIComponent(cookieValue(product, sessionId));
  ctx.res.setHeader(
    "Set-Cookie",
    `${config.cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
  );
}

export async function verifyCheckoutSessionForProduct(
  sessionId: string | string[] | undefined,
  product: CommercialProduct,
): Promise<boolean> {
  if (!sessionId || Array.isArray(sessionId)) return false;
  const expected = COMMERCIAL_PRODUCTS[product];

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return false;

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const email =
    String(session.metadata?.email || session.customer_details?.email || "")
      .trim()
      .toLowerCase() || null;

  const existing = await resolveCanonicalEntitlement({
    email,
    slug: expected.productCode,
  });
  if (existing.granted && existing.verified) return true;

  const paid =
    session.payment_status === "paid" &&
    session.metadata?.priceCode === expected.priceCode &&
    session.metadata?.productCode === expected.productCode;

  if (!paid) return false;

  const verified = await ensureEntitlementAfterPayment({
    checkoutSessionId: sessionId,
    slug: expected.productCode,
    email,
  });

  return verified.ok && Boolean(verified.entitlement?.granted);
}
