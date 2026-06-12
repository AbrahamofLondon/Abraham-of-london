import {
  type ProductValueContract,
  type ValueDimension,
  getProductValueContract,
} from "@/lib/product/product-value-contracts";

export type InspectedContentSource =
  | "generated_artifact"
  | "report_body"
  | "pdf_source"
  | "web_preview"
  | "case_record"
  | "diagnostic_result";

export interface ArtefactContentInspectionResult {
  productCode: string;
  artifactId?: string;
  inspectedContentSource: InspectedContentSource;
  isMetadataOnly: boolean;
  isPlaceholderOnly: boolean;
  isGeneric: boolean;
  hasSufficientInputBasis: boolean;
  missingCriticalSections: string[];
  valueScore: number;
  approvalAllowed: boolean;
  deliveryAllowed: boolean;
  blockingReasons: string[];
}

export interface ArtefactContentInspectionInput {
  productCode: string;
  artifactId?: string;
  inspectedContentSource: InspectedContentSource;
  content: string | Buffer | object | null | undefined;
  hasInputSnapshot?: boolean;
  evidenceRefCount?: number;
  contract?: ProductValueContract | null;
}

const PLACEHOLDER_PATTERN = /\b(lorem ipsum|placeholder|todo|tbd|coming soon|stub|dummy|sample only|insert|replace me|not implemented|n\/a)\b/i;
const GENERIC_PATTERN = /\b(in today's fast[- ]moving|it is important to|best practices|leverage|robust solution|tailored solutions|unlock value|drive success|holistic|stakeholders should consider|further analysis is recommended)\b/i;

const METADATA_KEYS = new Set([
  "id",
  "artifactid",
  "productcode",
  "status",
  "deliverystatus",
  "createdat",
  "updatedat",
  "hash",
  "artifacthash",
  "inputsnapshot",
  "inputsnapshothash",
  "metadata",
  "route",
  "url",
  "adminpreviewurl",
  "customeraccessurl",
]);

const DIMENSION_PATTERNS: Record<ValueDimension, RegExp[]> = {
  input_basis: [/\b(input|evidence|basis|source|data|provided|customer said|from the intake)\b/i],
  problem_definition: [/\b(problem|issue|decision|question|constraint|fracture|mandate)\b/i],
  context_specificity: [/\b(customer|organisation|team|board|case|deadline|stakeholder|constraint|context)\b/i],
  diagnosis: [/\b(diagnosis|diagnose|root cause|what is happening|underlying|pattern|failure mode)\b/i],
  evidence_interpretation: [/\b(evidence means|interpret|signal|indicates|suggests|because|therefore)\b/i],
  commercial_consequence: [/\b(consequence|cost|risk|exposure|delay|commercial|financial|strategic stake|value at risk)\b/i],
  decision_options: [/\b(option|path|choice|alternative|scenario|trade[- ]off)\b/i],
  recommended_next_move: [/\b(recommend|next move|should|must|priority|admissible move)\b/i],
  falsification_or_challenge: [/\b(falsif|challenge|objection|could be wrong|would change|counter[- ]evidence|red team)\b/i],
  risk_and_dependency_map: [/\b(risk|dependency|blocker|assumption|condition|constraint|owner)\b/i],
  execution_sequence: [/\b(sequence|step|72[- ]hour|7[- ]day|30[- ]day|action|owner|checkpoint)\b/i],
  customer_specificity: [/\b(your|customer|client|organisation|team|case|intake|provided)\b/i],
  commercial_value_claim: [/\b(value|worth|protect|save|avoid|economic|commercial value|decision value)\b/i],
};

function normaliseContent(content: ArtefactContentInspectionInput["content"]): string {
  if (Buffer.isBuffer(content)) return content.toString("utf-8");
  if (typeof content === "string") return content;
  if (!content) return "";
  return JSON.stringify(content, null, 2);
}

function tryParseJsonObject(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function hasNarrativeValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().split(/\s+/).length >= 40;
  if (Array.isArray(value)) return value.some(hasNarrativeValue);
  if (value && typeof value === "object") return Object.values(value).some(hasNarrativeValue);
  return false;
}

function isMetadataOnlyContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  const parsed = tryParseJsonObject(trimmed);
  if (!parsed) {
    return trimmed.split(/\s+/).length < 35 && /\b(id|status|hash|route|url|productCode)\b/i.test(trimmed);
  }

  const keys = Object.keys(parsed).map((key) => key.toLowerCase());
  const metadataKeyCount = keys.filter((key) => METADATA_KEYS.has(key)).length;
  return metadataKeyCount >= Math.max(2, Math.ceil(keys.length * 0.7)) && !hasNarrativeValue(parsed);
}

function scoreDimension(content: string, dimension: ValueDimension): number {
  const patterns = DIMENSION_PATTERNS[dimension] ?? [];
  if (patterns.some((pattern) => pattern.test(content))) return 6;
  return 0;
}

export function inspectArtefactContent(input: ArtefactContentInspectionInput): ArtefactContentInspectionResult {
  const contract = input.contract ?? getProductValueContract(input.productCode);
  const content = normaliseContent(input.content);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isMetadataOnly = isMetadataOnlyContent(content);
  const isPlaceholderOnly = wordCount < 80 && PLACEHOLDER_PATTERN.test(content);
  const genericHits = (content.match(new RegExp(GENERIC_PATTERN.source, "gi")) ?? []).length;
  const isGeneric = wordCount < 180 || genericHits >= 2;
  const hasSufficientInputBasis = Boolean(input.hasInputSnapshot || (input.evidenceRefCount ?? 0) > 0 || /\b(input|intake|evidence|provided|customer|case)\b/i.test(content));

  const requiredSections = contract?.requiredOutputSections.filter((section) => section.required) ?? [];
  const missingCriticalSections = requiredSections
    .filter((section) => {
      switch (section.key) {
        case "input_basis": return !DIMENSION_PATTERNS.input_basis.some((pattern) => pattern.test(content));
        case "interpretation": return !DIMENSION_PATTERNS.evidence_interpretation.some((pattern) => pattern.test(content));
        case "diagnosis": return !DIMENSION_PATTERNS.diagnosis.some((pattern) => pattern.test(content));
        case "consequence": return !DIMENSION_PATTERNS.commercial_consequence.some((pattern) => pattern.test(content));
        case "options": return !DIMENSION_PATTERNS.decision_options.some((pattern) => pattern.test(content));
        case "recommendation": return !DIMENSION_PATTERNS.recommended_next_move.some((pattern) => pattern.test(content));
        case "execution_next_step": return !DIMENSION_PATTERNS.execution_sequence.some((pattern) => pattern.test(content));
        case "continuity_value": return !/\b(continuity|cycle|ongoing|return brief|case memory|monthly|subscription)\b/i.test(content);
        case "child_artifact_value": return !/\b(child|included|bundle|instrument|each artifact|component)\b/i.test(content);
        case "usage_context": return !/\b(use this|usage|context|decision use|apply|not for)\b/i.test(content);
        case "archive_warning": return !/\b(archive|dated|as of|not live|historical|superseded)\b/i.test(content);
        default: return false;
      }
    })
    .map((section) => section.key);

  const dimensions = contract?.requiredValueDimensions ?? [];
  const dimensionScore = dimensions.reduce((sum, dimension) => sum + scoreDimension(content, dimension), 0);
  const lengthScore = Math.min(12, Math.floor(wordCount / 80) * 3);
  let valueScore = Math.min(100, dimensionScore + lengthScore);

  if (hasSufficientInputBasis) valueScore += 5;
  if (isMetadataOnly) valueScore = Math.min(valueScore, 10);
  if (isPlaceholderOnly) valueScore = Math.min(valueScore, 15);
  if (isGeneric) valueScore = Math.min(valueScore, 45);
  if (missingCriticalSections.length > 0) valueScore = Math.min(valueScore, 60);

  const blockingReasons: string[] = [];
  if (isMetadataOnly && contract?.allowsMetadataOnlyOutput === false) blockingReasons.push("metadata-only artefact");
  if (isPlaceholderOnly) blockingReasons.push("placeholder/stub-only artefact");
  if (isGeneric && contract?.allowsGenericOutput === false) blockingReasons.push("generic or insufficiently specific output");
  if (!hasSufficientInputBasis) blockingReasons.push("missing customer input basis");
  for (const section of missingCriticalSections) blockingReasons.push(`missing critical section: ${section}`);
  if (contract && valueScore < contract.minimumValueScore) {
    blockingReasons.push(`value score ${valueScore} below minimum ${contract.minimumValueScore}`);
  }

  const approvalAllowed = !(contract?.approvalBlockedBelowScore && blockingReasons.length > 0);
  const deliveryAllowed = !(contract?.deliveryBlockedBelowScore && blockingReasons.length > 0);

  return {
    productCode: input.productCode,
    artifactId: input.artifactId,
    inspectedContentSource: input.inspectedContentSource,
    isMetadataOnly,
    isPlaceholderOnly,
    isGeneric,
    hasSufficientInputBasis,
    missingCriticalSections,
    valueScore,
    approvalAllowed,
    deliveryAllowed,
    blockingReasons,
  };
}
