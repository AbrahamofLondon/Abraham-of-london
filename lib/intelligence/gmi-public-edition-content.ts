import type {
  GmiBoardConsequence,
  GmiBriefCitation,
  GmiConsequenceMatrixRow,
  GmiCrossEditionDelta,
  GmiFalsificationSummary,
  GmiHeadlineSignal,
  GmiMethodologySummary,
  GmiQuarterDelta,
  GmiRegimeFingerprintAxis,
  GmiThesisCard,
} from "./gmi-public-edition-contract";

export type GmiPublicEditionContentRecord = {
  editionId: string;
  hero: { eyebrow: string; headline: string; deck: string; primaryBuyer: string };
  executiveSummary: string;
  quarterInOneSentence: string;
  quarterDelta: GmiQuarterDelta;
  regimeFingerprint: GmiRegimeFingerprintAxis[];
  marketRegime: { label: string; summary: string };
  headlineSignals: GmiHeadlineSignal[];
  boardConsequences: GmiBoardConsequence[];
  consequenceMatrix: GmiConsequenceMatrixRow[];
  crossEditionDeltas: GmiCrossEditionDelta[];
  supportingBriefs: GmiBriefCitation[];
  thesisCards: GmiThesisCard[];
  falsificationSummary: GmiFalsificationSummary;
  methodology: Omit<GmiMethodologySummary, "version">;
  sourceCount: number;
  coverageState: string;
  pdfPath: string | null;
};

const q1Fingerprint: GmiRegimeFingerprintAxis[] = [
  { axis: "Growth dispersion", value: 58, previousValue: null, direction: "RISING", confidence: "MEDIUM", definition: "Divergence between institutional growth expectations and operating assumptions." },
  { axis: "Inflation pressure", value: 54, previousValue: null, direction: "STABLE", confidence: "MEDIUM", definition: "Persistence of price pressure relevant to board planning." },
  { axis: "Trade friction", value: 62, previousValue: null, direction: "RISING", confidence: "MEDIUM", definition: "Evidence that trade constraints affect strategic optionality." },
  { axis: "Capital selectivity", value: 66, previousValue: null, direction: "RISING", confidence: "MEDIUM", definition: "Degree to which capital favours resilient positioning over broad beta." },
  { axis: "Policy divergence", value: 60, previousValue: null, direction: "RISING", confidence: "MEDIUM", definition: "Difference in policy credibility and path dependency across markets." },
];

const q2Fingerprint: GmiRegimeFingerprintAxis[] = [
  { axis: "Growth dispersion", value: 74, previousValue: 58, direction: "RISING", confidence: "MEDIUM", definition: "Divergence between institutional forecasts and board operating cases." },
  { axis: "Inflation pressure", value: 68, previousValue: 54, direction: "RISING", confidence: "MEDIUM", definition: "Persistence of price pressure and yield sensitivity at the release lock." },
  { axis: "Trade friction", value: 82, previousValue: 62, direction: "RISING", confidence: "HIGH", definition: "Durability of tariff and supply-chain constraints in strategic decisions." },
  { axis: "Capital selectivity", value: 76, previousValue: 66, direction: "RISING", confidence: "HIGH", definition: "Evidence that capital rewards resilience and optionality over broad exposure." },
  { axis: "Policy divergence", value: 70, previousValue: 60, direction: "RISING", confidence: "MEDIUM", definition: "Board-relevant divergence in policy credibility and market operating conditions." },
];

const q2Briefs: GmiBriefCitation[] = [
  { ref: "BRIEF-GMI-042", title: "Tariff Persistence and Operating Optionality", relationship: "Supports the trade-friction and supply-chain calls.", publicationState: "LICENSED", href: null },
  { ref: "BRIEF-GMI-057", title: "Forecast Dispersion as a Board Signal", relationship: "Supports the dispersion regime thesis.", publicationState: "LICENSED", href: null },
  { ref: "BRIEF-GMI-063", title: "Capital Selectivity Under Fragmentation", relationship: "Supports the capital-allocation consequence layer.", publicationState: "LICENSED", href: null },
];

const q2Matrix: GmiConsequenceMatrixRow[] = [
  { decisionDomain: "CAPITAL ALLOCATION", publicDiagnostic: "Capital conditions are becoming more selective across markets.", publicImplication: "Headline flow direction is less useful than dispersion and persistence.", operatorImplication: "Re-rank allocations by resilience exposure and policy-friction tolerance.", actionVector: "Move fragmentation from sensitivity case into the board base-case review.", timeHorizon: "3-12 months", monitoringSignal: "Forecast dispersion and capital-flow persistence", trigger: "Sustained convergence in forecasts plus tariff rollback", riskOfInaction: "Capital is committed against a regime assumption that has not been evidenced.", confidence: "HIGH", reviewHorizon: "Q3 2026", evidenceRefs: ["GMI-Q2-SRC-FORECAST", "GMI-Q2-SRC-CAPITAL"], briefRefs: ["BRIEF-GMI-057", "BRIEF-GMI-063"], accessLevel: "LICENSED" },
  { decisionDomain: "SUPPLY CHAIN", publicDiagnostic: "Trade friction remains structural enough to affect operating design.", publicImplication: "Optionality has moved from resilience rhetoric to planning input.", operatorImplication: "Prioritise dual-node exposure where China dependency is material.", actionVector: "Set a board threshold for redundancy cost versus tariff and policy exposure.", timeHorizon: "By 30 September 2026", monitoringSignal: "Effective tariff rollback and trade-flow re-synchronisation", trigger: "Sustained rollback below structural thresholds", riskOfInaction: "Cost bases are optimised for a frictionless world that no longer has authority.", confidence: "HIGH", reviewHorizon: "Q3 2026", evidenceRefs: ["GMI-Q2-SRC-TARIFF"], briefRefs: ["BRIEF-GMI-042"], accessLevel: "LICENSED" },
  { decisionDomain: "TREASURY AND RISK", publicDiagnostic: "USD stress is a monitored watch signal, not a concluded break.", publicImplication: "Treasury policy should avoid forcing a single-direction currency story.", operatorImplication: "Use composite stress triggers rather than narrative-led hedging.", actionVector: "Define trigger thresholds across DXY, treasury volatility and reserve commentary.", timeHorizon: "Ongoing", monitoringSignal: "DXY recovery, treasury volatility, reserve-diversification commentary", trigger: "Sustained safe-haven recovery or confirmed reserve credibility deterioration", riskOfInaction: "Hedges respond to commentary rather than governed evidence.", confidence: "MEDIUM", reviewHorizon: "Q3 2026", evidenceRefs: ["GMI-Q2-SRC-USD"], briefRefs: [], accessLevel: "LICENSED" },
];

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
    quarterInOneSentence: "Q1 established the accountability baseline: resilience, policy credibility and selective capital began to matter more than a clean cyclical recovery story.",
    quarterDelta: {
      whatChanged: "The market conversation moved from recovery timing to resilience quality.",
      whatHeld: "Policy credibility and capital discipline remained central to the GMI line.",
      whatSurprisedUs: "The speed at which resilience language entered public market commentary.",
      whatNowMatters: "How Q2 judged which Q1 calls held, weakened or required qualification.",
    },
    regimeFingerprint: q1Fingerprint,
    marketRegime: { label: "Transition into structural pressure", summary: "Capital selectivity, policy credibility and resilience moved toward the centre of market judgement." },
    headlineSignals: [
      { signal: "Resilience premium emerging", observedEvidence: "Q1 public brief identified repricing around resilience and policy credibility.", interpretation: "Markets were beginning to discriminate between durable positioning and narrative dependence.", businessConsequence: "Boards needed to test whether growth assumptions depended on a benign policy environment.", confidence: "MEDIUM", falsificationTrigger: "Broad re-synchronisation of policy, trade and capital flows without resilience premium." },
    ],
    boardConsequences: [
      { area: "Capital allocation", consequence: "Review exposures dependent on cheap capital and policy continuity.", timing: "Q2 review window" },
      { area: "Risk governance", consequence: "Make resilience assumptions explicit in board papers.", timing: "Immediate" },
    ],
    consequenceMatrix: [
      { decisionDomain: "CAPITAL ALLOCATION", publicDiagnostic: "Resilience became a board-level allocation criterion.", publicImplication: "Capital assumptions should be tested against policy and liquidity stress.", operatorImplication: "Reviewed in Q2 successor edition.", actionVector: "Refer to Q2 current edition for current action vector.", timeHorizon: "Historical", monitoringSignal: "Successor edition review", trigger: "Q2 supersession", riskOfInaction: "Historical reference used as current guidance.", confidence: "MEDIUM", reviewHorizon: "Q2 2026", evidenceRefs: ["GMI-Q1-PUBLIC"], briefRefs: [], accessLevel: "PUBLIC" },
    ],
    crossEditionDeltas: [
      { priorPosition: "Structural pressure is replacing cyclical volatility.", priorConfidence: "MEDIUM", priorTrigger: "Policy/trade re-synchronisation would weaken the thesis.", whatHappened: "Q2 strengthened the fragmentation interpretation rather than invalidating it.", currentPosition: "Managed fragmentation is now the current base case.", currentConfidence: "MEDIUM", movement: "STRENGTHENED", reason: "Q2 evidence showed persistence in forecast dispersion, tariff friction and capital selectivity." },
    ],
    supportingBriefs: [],
    thesisCards: [{ thesis: "Structural pressure is replacing cyclical volatility.", evidence: "Q1 public record and subsequent Q2 call review.", implication: "The archive remains part of the trust architecture, not a retired sales page.", reviewTrigger: "Q2 call review and successor edition supersession." }],
    falsificationSummary: { currentBelief: "Q1 was an early structural-pressure call, now superseded by Q2.", evidenceBasis: "Public Q1 brief plus Q2 prior-call review.", wouldChangeIf: "Q2 review had invalidated the core structural-pressure interpretation.", reviewCadence: "Reviewed in the successor edition and retained for accountability." },
    methodology: { callReview: "Q1 calls are reviewed in Q2, including weak and too-early calls.", falsification: "Historical calls remain visible so successor editions can be challenged.", boundary: "Reference intelligence only. Not investment advice and not the current purchasable edition." },
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
    quarterInOneSentence: "Q2 argues that dispersion itself is now the signal: structural fragmentation and cyclical shock must be governed as separate but simultaneous realities.",
    quarterDelta: { whatChanged: "Q1's structural-pressure thesis strengthened into a managed-fragmentation base case.", whatHeld: "Resilience, policy credibility and capital selectivity remained the operating spine.", whatSurprisedUs: "Forecast dispersion stayed useful rather than resolving into a single recovery narrative.", whatNowMatters: "Boards need explicit triggers for when fragmentation is invalidated rather than vague confidence language." },
    regimeFingerprint: q2Fingerprint,
    marketRegime: { label: "Managed fragmentation under cyclical shock", summary: "A durable structural regime is running alongside a cyclical inflation/growth shock. The edition separates where to position from how defensively to operate." },
    headlineSignals: [
      { signal: "Forecast dispersion is the signal", observedEvidence: "World Bank 2.5%, OECD 2.8%, Goldman Sachs 2.8%, IMF July 3.0% at lock.", interpretation: "The outlook is sensitive to regime assumptions rather than converging around a single recovery path.", businessConsequence: "Board cases should test fragmentation persistence instead of assuming temporary disruption.", confidence: "MEDIUM", falsificationTrigger: "Durable convergence in institutional forecasts under tariff rollback and normalised capital flows." },
      { signal: "Tariff persistence remains structural", observedEvidence: "No durable rollback below structural thresholds at the Q2 lock.", interpretation: "Supply-chain optionality remains a strategic requirement, not a temporary hedge.", businessConsequence: "COO and CFO decisions should price redundancy and bloc exposure explicitly.", confidence: "HIGH", falsificationTrigger: "Sustained bilateral effective-rate rollback below 50% with trade-flow re-synchronisation." },
      { signal: "USD stress is monitored, not overcalled", observedEvidence: "Episodic weakness in risk-off windows, partial safe-haven recovery and June DXY recovery.", interpretation: "The reserve-credibility thesis remains a watch signal, not a concluded regime break.", businessConsequence: "Treasury policy should monitor composite stress rather than force a directional currency call.", confidence: "MEDIUM", falsificationTrigger: "Sustained safe-haven recovery across DXY, treasury volatility and reserve-diversification commentary." },
    ],
    boardConsequences: [
      { area: "Capital allocation", consequence: "Move from scenario decoration to board-approved fragmentation base case.", timing: "31 July 2026" },
      { area: "Market entry", consequence: "Treat bloc exposure and policy credibility as entry criteria, not footnotes.", timing: "Q3 planning cycle" },
      { area: "Pricing", consequence: "Model tariff pass-through with longer lags and margin-defence triggers.", timing: "August 2026" },
      { area: "Supply chain", consequence: "Build dual or multi-node optionality where China-dependent exposure is material.", timing: "30 September 2026" },
      { area: "Risk governance", consequence: "Make geopolitical risk a financial reporting input for exposure segmentation.", timing: "15 August 2026" },
      { area: "Liquidity", consequence: "Maintain defensive buffers while credit tightening remains sector-specific but live.", timing: "Ongoing" },
    ],
    consequenceMatrix: q2Matrix,
    crossEditionDeltas: [
      { priorPosition: "Structural pressure is replacing cyclical volatility.", priorConfidence: "MEDIUM", priorTrigger: "Policy/trade re-synchronisation would weaken the thesis.", whatHappened: "Forecast dispersion and tariff persistence strengthened rather than invalidated the line.", currentPosition: "Managed fragmentation is the current base case.", currentConfidence: "MEDIUM", movement: "STRENGTHENED", reason: "The Q2 evidence package increased confidence in fragmentation while keeping USD stress qualified." },
      { priorPosition: "Resilience premium emerging.", priorConfidence: "MEDIUM", priorTrigger: "Broad capital re-synchronisation would weaken the call.", whatHappened: "Capital remained selective and liquidity defensiveness persisted.", currentPosition: "Capital selectivity is now an operational planning input.", currentConfidence: "HIGH", movement: "STRENGTHENED", reason: "The Q2 lock supported persistence, not reversion." },
    ],
    supportingBriefs: q2Briefs,
    thesisCards: [
      { thesis: "Two regimes now operate at once.", evidence: "Structural fragmentation indicators plus cyclical inflation/growth dispersion at lock.", implication: "Operators must separate positioning choices from defensive operating posture.", reviewTrigger: "Q3 call review and release-lock evidence update." },
      { thesis: "Managed fragmentation remains the base case.", evidence: "Tariff persistence, forecast dispersion and selective capital allocation.", implication: "Continuity assumptions should be treated as risks requiring evidence, not defaults.", reviewTrigger: "Tariff rollback, credit spread shock or capital-flow re-synchronisation." },
    ],
    falsificationSummary: { currentBelief: "Managed fragmentation is the base case under elevated friction, with confidence-shock risk monitored.", evidenceBasis: "Release-locked institutional forecasts, tariff tracker evidence, CPI/yield ranges, capital-flow signals and prior-call review.", wouldChangeIf: "Tariff rollback, forecast convergence and normalised capital flows jointly invalidate the fragmentation premise.", reviewCadence: "Quarterly successor review with call scoring and falsification register updates." },
    methodology: { callReview: "Prior Q1 calls are scored with deductions and too-early calls carried forward rather than rewritten.", falsification: "High-conviction theses carry observable triggers that would force qualification, update or thesis change.", boundary: "Strategic decision-support intelligence. Not investment advice, trading advice or a financial recommendation." },
    sourceCount: 8,
    coverageState: "Release-critical sources covered at lock; unresolved release blockers recorded as zero.",
    pdfPath: "/api/downloads/global-market-intelligence-report-q2-2026",
  },
] as const;

export function getGmiPublicEditionContent(editionId: string): GmiPublicEditionContentRecord | null {
  return GMI_PUBLIC_EDITION_CONTENT.find((record) => record.editionId === editionId) ?? null;
}