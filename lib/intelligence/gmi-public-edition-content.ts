import type { GmiBoardConsequence, GmiFalsificationSummary, GmiHeadlineSignal, GmiMethodologySummary, GmiThesisCard } from "./gmi-public-edition-contract";

export type GmiPublicEditionContentRecord = {
  editionId: string;
  hero: {
    eyebrow: string;
    headline: string;
    deck: string;
    primaryBuyer: string;
  };
  executiveSummary: string;
  marketRegime: { label: string; summary: string };
  headlineSignals: GmiHeadlineSignal[];
  boardConsequences: GmiBoardConsequence[];
  thesisCards: GmiThesisCard[];
  falsificationSummary: GmiFalsificationSummary;
  methodology: Omit<GmiMethodologySummary, "version">;
  sourceCount: number;
  coverageState: string;
  pdfPath: string | null;
};

export const GMI_PUBLIC_EDITION_CONTENT: readonly GmiPublicEditionContentRecord[] = [
  {
    editionId: "GMI-Q1-2026",
    hero: {
      eyebrow: "Global Market Intelligence · Q1 2026",
      headline: "Structural pressure replaced cyclical comfort.",
      deck: "Q1 established the transition record: markets began pricing resilience, policy credibility and strategic positioning rather than assuming a clean return to pre-fragmentation conditions.",
      primaryBuyer: "Boards and operators reviewing the accountability record behind the current GMI line.",
    },
    executiveSummary: "Q1 2026 is retained as a public accountability edition. Its calls, assumptions and learning record remain accessible so the current edition can be judged against a visible prior record.",
    marketRegime: {
      label: "Transition into structural pressure",
      summary: "Capital selectivity, policy credibility and resilience moved toward the centre of market judgement.",
    },
    headlineSignals: [
      {
        signal: "Resilience premium emerging",
        observedEvidence: "Q1 public brief identified repricing around resilience and policy credibility.",
        interpretation: "Markets were beginning to discriminate between durable positioning and narrative dependence.",
        businessConsequence: "Boards needed to test whether growth assumptions depended on a benign policy environment.",
        confidence: "MEDIUM",
        falsificationTrigger: "Broad re-synchronisation of policy, trade and capital flows without resilience premium.",
      },
    ],
    boardConsequences: [
      { area: "Capital allocation", consequence: "Review exposures dependent on cheap capital and policy continuity.", timing: "Q2 review window" },
      { area: "Risk governance", consequence: "Make resilience assumptions explicit in board papers.", timing: "Immediate" },
    ],
    thesisCards: [
      {
        thesis: "Structural pressure is replacing cyclical volatility.",
        evidence: "Q1 public record and subsequent Q2 call review.",
        implication: "The archive remains part of the trust architecture, not a retired sales page.",
        reviewTrigger: "Q2 call review and successor edition supersession.",
      },
    ],
    falsificationSummary: {
      currentBelief: "Q1 was an early structural-pressure call, now superseded by Q2.",
      evidenceBasis: "Public Q1 brief plus Q2 prior-call review.",
      wouldChangeIf: "Q2 review had invalidated the core structural-pressure interpretation.",
      reviewCadence: "Reviewed in the successor edition and retained for accountability.",
    },
    methodology: {
      callReview: "Q1 calls are reviewed in Q2, including weak and too-early calls.",
      falsification: "Historical calls remain visible so successor editions can be challenged.",
      boundary: "Reference intelligence only. Not investment advice and not the current purchasable edition.",
    },
    sourceCount: 0,
    coverageState: "Historical public reference; successor review available in Q2.",
    pdfPath: null,
  },
  {
    editionId: "GMI-Q2-2026",
    hero: {
      eyebrow: "Global Market Intelligence · Q2 2026",
      headline: "Fragmentation under shock: the current board intelligence edition.",
      deck: "Q2 tracks the collision of structural trade fragmentation and cyclical stagflation pressure. It is built for leaders who need accountable judgement under conflicting signals, not more market noise.",
      primaryBuyer: "Boards, CEOs, strategy leaders and operators managing capital allocation, supply-chain exposure and risk governance under uncertainty.",
    },
    executiveSummary: "Q2 2026 is a regime-change call, not a recession call. Forecast dispersion, tariff persistence, selective capital flows and liquidity defensiveness point to an operating environment where assumptions about frictionless global trade have become dangerous.",
    marketRegime: {
      label: "Managed fragmentation under cyclical shock",
      summary: "A durable structural regime is running alongside a cyclical inflation/growth shock. The edition separates where to position from how defensively to operate.",
    },
    headlineSignals: [
      {
        signal: "Forecast dispersion is the signal",
        observedEvidence: "World Bank 2.5%, OECD 2.8%, Goldman Sachs 2.8%, IMF July 3.0% at lock.",
        interpretation: "The outlook is sensitive to regime assumptions rather than converging around a single recovery path.",
        businessConsequence: "Board cases should test fragmentation persistence instead of assuming temporary disruption.",
        confidence: "MEDIUM",
        falsificationTrigger: "Durable convergence in institutional forecasts under tariff rollback and normalised capital flows.",
      },
      {
        signal: "Tariff persistence remains structural",
        observedEvidence: "No durable rollback below structural thresholds at the Q2 lock.",
        interpretation: "Supply-chain optionality remains a strategic requirement, not a temporary hedge.",
        businessConsequence: "COO and CFO decisions should price redundancy and bloc exposure explicitly.",
        confidence: "HIGH",
        falsificationTrigger: "Sustained bilateral effective-rate rollback below 50% with trade-flow re-synchronisation.",
      },
      {
        signal: "USD stress is monitored, not overcalled",
        observedEvidence: "Episodic weakness in risk-off windows, partial safe-haven recovery and June DXY recovery.",
        interpretation: "The reserve-credibility thesis remains a watch signal, not a concluded regime break.",
        businessConsequence: "Treasury policy should monitor composite stress rather than force a directional currency call.",
        confidence: "MEDIUM",
        falsificationTrigger: "Sustained safe-haven recovery across DXY, treasury volatility and reserve-diversification commentary.",
      },
    ],
    boardConsequences: [
      { area: "Capital allocation", consequence: "Move from scenario decoration to board-approved fragmentation base case.", timing: "31 July 2026" },
      { area: "Market entry", consequence: "Treat bloc exposure and policy credibility as entry criteria, not footnotes.", timing: "Q3 planning cycle" },
      { area: "Pricing", consequence: "Model tariff pass-through with longer lags and margin-defence triggers.", timing: "August 2026" },
      { area: "Supply chain", consequence: "Build dual or multi-node optionality where China-dependent exposure is material.", timing: "30 September 2026" },
      { area: "Risk governance", consequence: "Make geopolitical risk a financial reporting input for exposure segmentation.", timing: "15 August 2026" },
      { area: "Liquidity", consequence: "Maintain defensive buffers while credit tightening remains sector-specific but live.", timing: "Ongoing" },
    ],
    thesisCards: [
      {
        thesis: "Two regimes now operate at once.",
        evidence: "Structural fragmentation indicators plus cyclical inflation/growth dispersion at lock.",
        implication: "Operators must separate positioning choices from defensive operating posture.",
        reviewTrigger: "Q3 call review and release-lock evidence update.",
      },
      {
        thesis: "Managed fragmentation remains the base case.",
        evidence: "Tariff persistence, forecast dispersion and selective capital allocation.",
        implication: "Continuity assumptions should be treated as risks requiring evidence, not defaults.",
        reviewTrigger: "Tariff rollback, credit spread shock or capital-flow re-synchronisation.",
      },
    ],
    falsificationSummary: {
      currentBelief: "Managed fragmentation is the base case under elevated friction, with confidence-shock risk monitored.",
      evidenceBasis: "Release-locked institutional forecasts, tariff tracker evidence, CPI/yield ranges, capital-flow signals and prior-call review.",
      wouldChangeIf: "Tariff rollback, forecast convergence and normalised capital flows jointly invalidate the fragmentation premise.",
      reviewCadence: "Quarterly successor review with call scoring and falsification register updates.",
    },
    methodology: {
      callReview: "Prior Q1 calls are scored with deductions and too-early calls carried forward rather than rewritten.",
      falsification: "High-conviction theses carry observable triggers that would force qualification, update or thesis change.",
      boundary: "Strategic decision-support intelligence. Not investment advice, trading advice or a financial recommendation.",
    },
    sourceCount: 8,
    coverageState: "Release-critical sources covered at lock; unresolved release blockers recorded as zero.",
    pdfPath: "/api/downloads/global-market-intelligence-report-q2-2026",
  },
] as const;

export function getGmiPublicEditionContent(editionId: string): GmiPublicEditionContentRecord | null {
  return GMI_PUBLIC_EDITION_CONTENT.find((record) => record.editionId === editionId) ?? null;
}