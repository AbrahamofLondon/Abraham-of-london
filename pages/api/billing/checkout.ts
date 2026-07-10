// pages/api/billing/checkout.ts — CANONICAL CHECKOUT ROUTE
// All products resolve from lib/commercial/catalog.ts SSOT.
// Stripe Price IDs are embedded in catalog, not env vars.

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import {
  checkCheckoutEligibility,
  resolveEntitlementSlugs,
  getProduct,
} from "@/lib/commercial/catalog";
import { resolveProductIdentity } from "@/lib/commercial/product-identity";
import { getGovernanceState } from "@/lib/commercial/commercial-governance";
import { resolveCommercialAction } from "@/lib/commercial/commercial-action-resolver";
import { resolveCommercialAccessPolicy } from "@/lib/commercial/commercial-access-policy";
import { evaluateCommercialPrerequisite } from "@/lib/commercial/prerequisite-evaluators";
import { mapPrerequisiteFailureToCheckoutCode, buildCheckoutFailureResponse } from "@/lib/commercial/checkout-failure-code";
import { hubspotSync } from "@/lib/hubspot/sync";
import { evaluateERAdmission } from "@/lib/diagnostics/executive-reporting/admission";
import { trackServerLaunch } from "@/lib/analytics/server-launch-event";
import { prisma } from "@/lib/prisma.server";
import { GMI_EDITION_REGISTRY } from "@/lib/commercial/gmi/gmi-edition-registry";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any })
  : null;

function siteUrl(req: NextApiRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`
  ).replace(/\/$/, "");
}

function stripeErrorDetails(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { message: String(error || "Unknown Stripe checkout error") };
  }
  const e = error as Stripe.errors.StripeError & { requestId?: string; statusCode?: number };
  return {
    type: e.type,
    code: e.code,
    declineCode: e.decline_code,
    message: e.message,
    requestId: e.requestId,
    statusCode: e.statusCode,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (!stripe) {
    const failure = buildCheckoutFailureResponse("STRIPE_NOT_CONFIGURED");
    return res.status(500).json({
      ok: false,
      code: failure.code,
      message: failure.publicMessage,
      supportEmail: failure.helpEmail,
    });
  }

  const { email, priceCode, productCode, entitlementSlug, contentId, originPath, contractId, organisationId, caseRef, handoffId, proofToken } = req.body || {};

  // ── Proof mode: server-applied discount for controlled proof runs ──────────
  // proofToken must match STRIPE_PROOF_TOKEN (never exposed in response).
  // If token provided but invalid → hard reject (fail closed, not silent fallback).
  // If valid → apply STRIPE_PROOF_PROMOTION_CODE_ID server-side.
  // Normal checkout path is unaffected.
  const proofPromoId = process.env.STRIPE_PROOF_PROMOTION_CODE_ID;
  const proofTokenSecret = process.env.STRIPE_PROOF_TOKEN;
  const proofTokenProvided = typeof proofToken === "string" && proofToken.length > 0;

  if (proofTokenProvided && (!proofTokenSecret || proofToken !== proofTokenSecret)) {
    const failure = buildCheckoutFailureResponse("INVALID_PROOF_TOKEN");
    return res.status(403).json({
      ok: false,
      code: failure.code,
      message: failure.publicMessage,
      supportEmail: failure.helpEmail,
    });
  }
  if (proofTokenProvided && proofTokenSecret && proofToken === proofTokenSecret && !proofPromoId) {
    return res.status(503).json({ ok: false, reason: "PROOF_PROMOTION_CODE_NOT_CONFIGURED" });
  }
  const isProofMode = proofTokenProvided && !!proofTokenSecret && proofToken === proofTokenSecret && !!proofPromoId;
  const rawCode = String(productCode || entitlementSlug || contentId || priceCode || "").trim();

  // Resolve canonical product code — accepts catalog key OR content ID OR entitlement slug
  const identity = resolveProductIdentity(rawCode);
  if (!identity) {
    const failure = buildCheckoutFailureResponse("INVALID_PRODUCT_IDENTIFIER");
    return res.status(400).json({
      ok: false,
      code: failure.code,
      message: failure.publicMessage,
      recoveryPath: failure.recoveryPath,
    });
  }

  const code = identity.productCode;

  // ── Resolve product from catalog SSOT with guardrails ──
  if (!email) {
    const failure = buildCheckoutFailureResponse("EMAIL_REQUIRED", code);
    return res.status(400).json({
      ok: false,
      code: failure.code,
      message: failure.publicMessage,
      supportEmail: failure.helpEmail,
    });
  }

  // ── Policy-routed prerequisite evaluation ──
  // Each product has an explicit commercial access policy that determines
  // what (if any) prerequisite must pass before checkout. No universal gate.
  const emailStr = String(email).trim().toLowerCase();
  const commercialPolicy = resolveCommercialAccessPolicy(code);
  if (!commercialPolicy) {
    const failure = buildCheckoutFailureResponse("PRODUCT_NOT_CONFIGURED", code);
    return res.status(404).json({
      ok: false,
      code: failure.code,
      message: failure.publicMessage,
      supportEmail: failure.helpEmail,
    });
  }

  // ── Acquisition-mode guard ──
  // Self-serve checkout is only valid for FREE / SELF_SERVE / EVIDENCE_GATED /
  // ADMISSION_GATED products. CONTRACT and MANUAL_BILLING require enquiry; the
  // whole GMI archive and any inactive/retired product is not purchasable here.
  // (The commercial-governance gate below is the second, independent authority.)
  const SELF_SERVE_MODES = new Set([
    "FREE",
    "SELF_SERVE_CHECKOUT",
    "EVIDENCE_GATED_CHECKOUT",
    "ADMISSION_GATED_CHECKOUT",
  ]);
  if (!SELF_SERVE_MODES.has(commercialPolicy.acquisitionMode)) {
    const notSelfServeCode =
      commercialPolicy.acquisitionMode === "ARCHIVE_ONLY"
        ? "CHECKOUT_BLOCKED_BY_GOVERNANCE"
        : "CHECKOUT_INELIGIBLE";
    const failure = buildCheckoutFailureResponse(notSelfServeCode, code);
    return res.status(409).json({
      ok: false,
      code: failure.code,
      message: failure.publicMessage,
      recoveryPath: failure.recoveryPath,
      supportEmail: failure.helpEmail,
      acquisitionMode: commercialPolicy.acquisitionMode,
    });
  }

  const prerequisiteResult = await evaluateCommercialPrerequisite(
    commercialPolicy.prerequisitePolicy,
    {
      email: emailStr,
      productCode: code,
    }
  );

  if (!prerequisiteResult.allowed) {
    const failureCode = mapPrerequisiteFailureToCheckoutCode(
      commercialPolicy.prerequisitePolicy,
      prerequisiteResult.reason
    );
    const failureResponse = buildCheckoutFailureResponse(failureCode, code);
    return res.status(403).json({
      ok: false,
      code: failureCode,
      message: failureResponse.publicMessage,
      recoveryPath: failureResponse.recoveryPath,
      supportEmail: failureResponse.helpEmail,
    });
  }

  // ── Server-side admission enforcement for Executive Reporting ──
  // Cross-validates client evidence against server-side diagnostic journey.
  // Payment must not override evidence requirements.
  if (code === "executive_reporting") {
    const erAdmission = await evaluateERAdmission({
      email: emailStr,
      intakeMode: (req.body.intakeMode as string) || "ladder",
      sponsoredDirect: Boolean(req.body.sponsoredDirect),
      sponsorNameOrSeat: req.body.sponsorNameOrSeat || null,
      monitoringAccountId: req.body.monitoringAccountId || null,
      monitoringContext: Boolean(req.body.monitoringContext),
      clientEvidenceSummary: req.body.clientEvidenceSummary || null,
    });

    if (erAdmission.status === "RESTRICTED") {
      return res.status(403).json({
        ok: false,
        reason: "ADMISSION_RESTRICTED",
        admission: {
          status: erAdmission.status,
          reasons: erAdmission.reasons,
          missingEvidence: erAdmission.missingEvidence,
          repairActions: erAdmission.repairActions,
          returnPath: erAdmission.returnPath,
        },
      });
    }
  }

  // ── Governance gate (authoritative): checkout-ready data is not permission ──
  // A product may carry valid Stripe IDs and still be governance-blocked. The
  // commercial action resolver is the single authority — only `purchasable`
  // (state === "checkout") may proceed to a Stripe session.
  {
    const govProduct = getProduct(code);
    if (govProduct) {
      const action = resolveCommercialAction(govProduct, getGovernanceState(code));
      if (!action.purchasable) {
        return res.status(403).json({
          ok: false,
          reason: "CHECKOUT_BLOCKED_BY_GOVERNANCE",
          state: action.state,
          detail: action.reason,
          code,
        });
      }
    }
  }

  const eligibility = checkCheckoutEligibility(code);
  if (!eligibility.eligible) {
    return res.status(400).json({ ok: false, reason: eligibility.reason, code });
  }

  const product = eligibility.product;
  const gmiEdition = GMI_EDITION_REGISTRY.find((entry) => entry.productCode === code) ?? null;
  const gmiReceipt = gmiEdition
    ? await import("@/lib/intelligence/gmi-release-store.server")
        .then((mod) => mod.getDurableReceipt(gmiEdition.editionId))
        .catch(() => null)
    : null;
  if (gmiEdition && !gmiReceipt) {
    return res.status(409).json({ ok: false, reason: "GMI_RELEASE_RECEIPT_MISSING", editionId: gmiEdition.editionId });
  }

  // ── Paths ──
  const origin = typeof originPath === "string" && originPath.startsWith("/") ? originPath : "";
  const successPath = code === "boardroom_brief" ? "/boardroom-brief/confirmation" : product.successPath || origin || "/dashboard";
  const cancelPath = origin || product.cancelPath || "/dashboard";
  const baseUrl = siteUrl(req);

  let boardroomBridgeMetadata: Record<string, string> = {};
  const safeHandoffId = typeof handoffId === "string" && /^bh_[a-f0-9]{32}$/i.test(handoffId.trim())
    ? handoffId.trim()
    : "";

  if (code === "boardroom_brief" && safeHandoffId) {
    try {
      const handoff = await prisma.$queryRaw<Array<{
        id: string;
        user_id: string;
        diagnostic_id: string | null;
        risk_level: string | null;
        recommended_route: string;
        expires_at: Date;
        used_at: Date | null;
      }>>`
        SELECT id, user_id, diagnostic_id, risk_level, recommended_route, expires_at, used_at
        FROM boardroom_bridge_handoffs
        WHERE id = ${safeHandoffId}
        LIMIT 1
      `;

      const row = handoff[0];
      if (row && row.recommended_route === "boardroom-brief" && !row.used_at && row.expires_at > new Date()) {
        boardroomBridgeMetadata = {
          source: "inner_circle",
          handoffId: row.id,
          userId: row.user_id,
          ...(row.diagnostic_id ? { diagnosticId: row.diagnostic_id } : {}),
          ...(row.risk_level ? { riskLevel: row.risk_level } : {}),
        };
      }
    } catch (error) {
      console.warn("[BILLING_CHECKOUT_HANDOFF_LOOKUP_FAILED]", error);
    }
  }

  // ── Metadata (attached to Stripe session, used by webhooks) ──
  const entitlementSlugs = resolveEntitlementSlugs(code);
  const metadata: Record<string, string> = {
    productCode: product.entitlementSlug,
    priceCode: code,
    tier: product.tier,
    email: emailStr,
    originPath: origin,
    ...boardroomBridgeMetadata,
    ...(gmiEdition ? {
      productFamily: "gmi-quarterly",
      editionId: gmiEdition.editionId,
      releaseReceiptRef: gmiReceipt?.id ?? "",
      reportContentHash: gmiReceipt?.reportContentHash ?? "",
      pdfHash: gmiReceipt?.pdfHash ?? "",
    } : {}),
    ...(typeof contractId === "string" && contractId.trim() ? { contractId: contractId.trim() } : {}),
    ...(typeof organisationId === "string" && organisationId.trim() ? { organisationId: organisationId.trim() } : {}),
    ...(typeof caseRef === "string" && caseRef.trim() ? { caseRef: caseRef.trim().slice(0, 120) } : {}),
    // For bundles, include the full list of entitlement slugs
    ...(entitlementSlugs.length > 1
      ? { bundleEntitlements: entitlementSlugs.join(",") }
      : {}),
  };

  // ── Create Stripe checkout session ──
  let session: Stripe.Checkout.Session;
  try {
    const mode = product.accessType === "subscription" ? "subscription" : "payment";

    // Proof mode injects a server-applied discount; cannot combine with allow_promotion_codes.
    // Normal mode enables allow_promotion_codes for customer-applied codes.
    const discountConfig: Record<string, unknown> = isProofMode
      ? { discounts: [{ promotion_code: proofPromoId }] }
      : { allow_promotion_codes: true };

    const proofMetadata: Record<string, string> = isProofMode
      ? { proofMode: "true", discountSource: "server_applied_promotion_code", source: "controlled_boardroom_proof" }
      : {};

    session = await stripe.checkout.sessions.create({
      mode,
      customer_email: emailStr,
      line_items: [
        product.stripePriceId
          ? { price: product.stripePriceId, quantity: 1 }
          : {
              price_data: {
                currency: "gbp",
                unit_amount: product.amount,
                ...(mode === "subscription" ? { recurring: { interval: "month" as const } } : {}),
                product_data: {
                  name: product.displayName,
                  metadata: {
                    productCode: product.code,
                    entitlementSlug: product.entitlementSlug,
                  },
                },
              },
              quantity: 1,
            },
      ],
      success_url: `${baseUrl}${successPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelPath}?checkout=cancelled`,
      ...discountConfig,
      metadata: { ...metadata, ...proofMetadata },
      ...(mode === "subscription" ? { subscription_data: { metadata } } : {}),
    } as Parameters<typeof stripe.checkout.sessions.create>[0]);
  } catch (error) {
    const details = stripeErrorDetails(error);
    console.error("[BILLING_CHECKOUT_ERROR]", { priceCode: code, ...details });
    return res.status(502).json({
      ok: false,
      reason: "STRIPE_CHECKOUT_CREATE_FAILED",
      code: typeof details.code === "string" ? details.code : undefined,
    });
  }

  // ── Launch analytics (fire and forget) ──
  trackServerLaunch("checkout_session_created", `/api/billing/checkout`, {
    productCode: code,
    route: successPath,
  });

  // ── HubSpot sync (fire and forget) ──
  hubspotSync({
    event: code === "strategy_room"
      ? "strategy_room_checkout"
      : code === "boardroom_brief"
        ? "boardroom_brief_checkout"
        : "executive_reporting_checkout",
    email: String(email || ""),
    data: { amount: product.amount / 100, productCode: code },
  }).catch(() => {});

  return res.json({ ok: true, url: session.url });
}
