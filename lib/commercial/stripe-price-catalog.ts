// lib/commercial/stripe-price-catalog.ts

export const STRIPE_PRICE_CATALOG = {
  executive_reporting: "price_1TOLggQFpelVFMXJKSSxZvKv",
  strategy_room: "price_1TOLsPQFpelVFMXJ5ieJsFas",
  "decision-exposure-instrument": "price_1TP1XIQFpelVFMXJ35YurntT2",
  "mandate-clarity-framework": "price_1TP1ZaQFpelVFMXJovfynFoS",
  "intervention-path-selector": "price_1TP1dRQFpelVFMXJvVlFQjWH",
  "operator-decision-pack": "price_1TP1idQFpelVFMXJG77Vj5bE",
  "case-dossier-tariff-shock": "price_1TP1lhQFpelVFMXJN4xf1yxW",
  "case-dossier-team-alignment": "price_1TP1nMQFpelVFMXJukt9E22Z",
  "case-dossier-escalation-denied": "price_1TP1omQFpelVFMXJtUTNXdkc",
  "global-market-intelligence-report-q1-2026": "price_1TP1rRQFpelVFMXJWaFMOpJQ",
  diagnostic_report_basic: "price_1TP1ufQFpelVFMXJ4NqwIXjv",
  diagnostic_report_pro: "price_1TP1w5QFpelVFMXJvIQUVqgz",
  inner_circle: "price_1TP20xQFpelVFMXJwBO0Kz1h",
  executive_reporting_priority: "price_1TP22XQFpelVFMXJ4IWRIaqb",
  strategy_room_extended: "price_1TP26NQFpelVFMXJgMpsREew",
} as const;

export type StripePriceCode = keyof typeof STRIPE_PRICE_CATALOG;
export type StripePriceId = (typeof STRIPE_PRICE_CATALOG)[StripePriceCode];

const STRIPE_PRICE_ALIASES = {
  STRIPE_EXECUTIVE_REPORTING_PRICE_ID: "executive_reporting",
  STRIPE_STRATEGY_ROOM_PRICE_ID: "strategy_room",
  decision_exposure_instrument: "decision-exposure-instrument",
  mandate_clarity_framework: "mandate-clarity-framework",
  intervention_path_selector: "intervention-path-selector",
  operator_decision_pack: "operator-decision-pack",
  case_dossier_tariff_shock: "case-dossier-tariff-shock",
  case_dossier_team_alignment: "case-dossier-team-alignment",
  case_dossier_escalation_denied: "case-dossier-escalation-denied",
  gmi_q1_2026: "global-market-intelligence-report-q1-2026",
} as const satisfies Record<string, StripePriceCode>;

export type StripePriceAlias = keyof typeof STRIPE_PRICE_ALIASES;

export function isStripePriceCode(value: string): value is StripePriceCode {
  return Object.prototype.hasOwnProperty.call(STRIPE_PRICE_CATALOG, value);
}

export function resolveStripePriceCode(value: string): StripePriceCode | null {
  if (isStripePriceCode(value)) return value;
  return STRIPE_PRICE_ALIASES[value as StripePriceAlias] ?? null;
}

export function getStripePriceId(value: string): StripePriceId | null {
  const priceCode = resolveStripePriceCode(value);
  return priceCode ? STRIPE_PRICE_CATALOG[priceCode] : null;
}
