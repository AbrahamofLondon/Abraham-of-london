// Temporary: emit the commercial resolver truth table for owner review.
import {
  parseCatalogProduct, getGovernanceState, resolveCommercialAction,
} from "./_commercial-mirror.mjs";

const PRODUCTS = [
  "boardroom_brief", "executive_reporting", "strategy_room", "professional", "inner_circle",
  "gmi_quarterly", "gmi_q2_2026", "reporting_monthly", "reporting_custom", "fast_diagnostic", "enterprise_assessment",
];

// gmi_q2_2026 is built dynamically by the GMI factory (manual_billing, no Stripe).
const DYNAMIC = {
  gmi_q2_2026: {
    code: "gmi_q2_2026", commercialStatus: "manual_billing", requiresCheckout: false,
    amount: 5900, stripeProductId: null, stripePriceId: null, active: true,
    successPath: "/intelligence/global-market-intelligence-report-q2-2026", cancelPath: "/intelligence",
    primaryCta: "Enquire", hiddenFromPricing: false,
  },
};

function ctaFor(action) {
  switch (action.state) {
    case "checkout": return "Buy / checkout";
    case "view_free_surface": return "Start free";
    case "manual_fulfilment": return "Request access (enquiry)";
    case "request_access": return "Request access";
    case "contact_sales": return "Contact / enquire";
    case "review_gated": return "Request review";
    case "evidence_gated": return "Evidence-gated";
    case "blocked": return "Not available (no CTA)";
    case "unavailable": return "Unavailable";
    case "archive_reference_only": return "Archive reference";
    default: return "—";
  }
}

const rows = [];
for (const code of PRODUCTS) {
  const product = parseCatalogProduct(code) || DYNAMIC[code];
  const g = getGovernanceState(code);
  if (!product) { rows.push({ code, missing: true }); continue; }
  const action = resolveCommercialAction(product, g);
  const stripe = Boolean(product.stripeProductId && product.stripePriceId);
  const publicVisible = action.state !== "blocked" || true; // blocked still renders as "not available" where listed
  rows.push({
    code,
    readinessStatus: g.readinessStatus ?? "—",
    releaseLane: g.releaseLane ?? "—",
    releaseMode: g.releaseMode ?? "—",
    checkoutSafe: g.checkoutSafe,
    commercialSafe: g.commercialSafe,
    commercialStatus: product.commercialStatus ?? "—",
    stripe,
    action: action.state,
    purchasable: action.purchasable,
    cta: ctaFor(action),
  });
}

// Markdown table
const H = ["product", "readiness", "lane", "mode", "checkoutSafe", "commercialSafe", "commercialStatus", "stripe?", "resolver", "checkout?", "serverCheckout?", "pricing/products CTA"];
console.log("| " + H.join(" | ") + " |");
console.log("|" + H.map(() => "---").join("|") + "|");
for (const r of rows) {
  if (r.missing) { console.log(`| ${r.code} | (not in catalog) |`); continue; }
  console.log("| " + [
    r.code, r.readinessStatus, r.releaseLane, r.releaseMode,
    String(r.checkoutSafe), String(r.commercialSafe), r.commercialStatus,
    r.stripe ? "yes" : "no", r.action,
    r.purchasable ? "YES" : "NO", r.purchasable ? "YES" : "NO", r.cta,
  ].join(" | ") + " |");
}
