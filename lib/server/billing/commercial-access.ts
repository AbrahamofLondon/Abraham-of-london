import crypto from "crypto";
import type { GetServerSidePropsContext } from "next";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma.server";

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
    cancelPath: "/diagnostics/executive-reporting",
    cookieName: "aol_paid_strategy_room",
  },
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

function signingSecret(): string {
  return (
    process.env.COMMERCIAL_ACCESS_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    "aol-local-commercial-access"
  );
}

function sign(value: string): string {
  return crypto.createHmac("sha256", signingSecret()).update(value).digest("hex");
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

  const entitlement = await prisma.clientEntitlement.findFirst({
    where: {
      externalRef: sessionId,
      productCode: expected.productCode,
      status: "active",
    },
  });
  if (entitlement) return true;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return false;

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any });
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return (
    session.payment_status === "paid" &&
    session.metadata?.priceCode === expected.priceCode &&
    session.metadata?.productCode === expected.productCode
  );
}
