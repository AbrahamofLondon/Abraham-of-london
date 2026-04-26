/**
 * Canon Reference Codes — cross-referencing system for academic,
 * theological, and civilisational coherence.
 *
 * Each major idea or framework gets a reference code.
 * Codes appear in page footers and indexes.
 */

export type CanonReferenceType = "theological" | "analytical" | "institutional" | "political" | "historical" | "human_systems";

export type CanonReference = {
  code: string;
  name: string;
  type: CanonReferenceType;
  domain: string;
  canonicalClaim: string;
  derivedFrom: string[];
  academicAnchors: string[];
  operationalApplication: string[];
};

export const CANON_REFERENCES: CanonReference[] = [
  {
    code: "EG-01",
    name: "Edenic Governance Blueprint",
    type: "theological",
    domain: "Authority, Work, Order",
    canonicalClaim: "Governance originates as ordered stewardship under authority, not autonomous power accumulation.",
    derivedFrom: ["Biblical creation framework", "Classical natural law", "Early Christian political theology"],
    academicAnchors: ["Genesis 1–3 (Hebrew Bible)", "Augustine — City of God", "Aquinas — Summa Theologica"],
    operationalApplication: ["Strategy Room authority gating", "Mandate Clarity classification logic"],
  },
  {
    code: "AI-02",
    name: "Alignment Index Instrument",
    type: "analytical",
    domain: "Organisational coherence",
    canonicalClaim: "System failure occurs when identity, incentives, and behaviour diverge structurally.",
    derivedFrom: ["Institutional sociology", "Diagnostic assessment theory", "Behavioural economics"],
    academicAnchors: ["Max Weber — institutional rationality", "Émile Durkheim — cohesion vs anomie", "Peter Drucker — management effectiveness"],
    operationalApplication: ["Decision Exposure Instrument", "Executive Reporting structural analysis", "Purpose Alignment Assessment"],
  },
  {
    code: "FD-07",
    name: "Family Governance Design",
    type: "theological",
    domain: "Formation, Transmission, Legacy",
    canonicalClaim: "The family is the primary institution for identity formation and value transmission.",
    derivedFrom: ["Biblical family theology", "Sociological kinship theory", "Conservative institutional theory"],
    academicAnchors: ["Deuteronomy 6 — transmission mandate", "Durkheim — primary socialisation", "Burke — intergenerational contract"],
    operationalApplication: ["Purpose Alignment legacy domain", "Mandate Clarity delegation block"],
  },
  {
    code: "ND-14",
    name: "National Destiny Model",
    type: "political",
    domain: "Nationhood, Sovereignty, Purpose",
    canonicalClaim: "Nations exist as moral entities with distinct purposes, not merely as administrative boundaries.",
    derivedFrom: ["Biblical theology of nations", "Classical political philosophy", "Conservative nationalism"],
    academicAnchors: ["Acts 17:26 — appointed boundaries", "Tocqueville — Democracy in America", "Fukuyama — Political Order and Political Decay"],
    operationalApplication: ["GMI geopolitical framing", "Strategy Room sovereignty analysis"],
  },
  {
    code: "CX-20",
    name: "Civilisation Cycle Diagram",
    type: "historical",
    domain: "Civilisational stability",
    canonicalClaim: "Civilisations follow repeatable cycles of formation, expansion, drift, and decay.",
    derivedFrom: ["Cyclical history", "Decline theory", "Institutional entropy"],
    academicAnchors: ["Ibn Khaldun — Muqaddimah", "Arnold Toynbee — Study of History", "Oswald Spengler — Decline of the West"],
    operationalApplication: ["Global Market Intelligence narrative framing", "Strategy Room long-cycle risk analysis"],
  },
  {
    code: "PD-31",
    name: "Post-Liberal State Model",
    type: "political",
    domain: "Governance systems",
    canonicalClaim: "Political systems collapse when institutional order detaches from moral and cultural foundations.",
    derivedFrom: ["Conservative political philosophy", "Post-liberal critique", "Institutional decay analysis"],
    academicAnchors: ["Edmund Burke — Reflections on the Revolution in France", "Michael Oakeshott — Rationalism in Politics", "Francis Fukuyama — Political Order and Political Decay"],
    operationalApplication: ["Executive Reporting governance diagnostics", "GMI geopolitical interpretation"],
  },
  {
    code: "DX-40",
    name: "Destiny Architecture Grid",
    type: "human_systems",
    domain: "Purpose and agency",
    canonicalClaim: "Human outcomes are determined by alignment between calling, discipline, and structured action.",
    derivedFrom: ["Vocation theology", "Meaning-making psychology", "Wisdom literature"],
    academicAnchors: ["Viktor Frankl — Man's Search for Meaning", "Proverbs — wisdom tradition", "Os Guinness — The Call"],
    operationalApplication: ["Strategy Room execution logic", "Identity-based decision modelling", "Purpose Alignment Assessment"],
  },
];

export function getReference(code: string): CanonReference | undefined {
  return CANON_REFERENCES.find((r) => r.code === code);
}

export function getReferencesByType(type: CanonReferenceType): CanonReference[] {
  return CANON_REFERENCES.filter((r) => r.type === type);
}
