/**
 * Canon Glossary — canonically defined terms with intellectual lineage.
 *
 * Every term: definition + intellectual lineage.
 * This instantly upgrades perceived legitimacy.
 */

export type GlossaryEntry = {
  term: string;
  definition: string;
  lineage: string[];
};

export const CANON_GLOSSARY: GlossaryEntry[] = [
  { term: "Alignment", definition: "The structural harmony between identity, purpose, values, behaviour, and systems.", lineage: ["Weber — institutional rationality", "Durkheim — social cohesion", "Biblical covenant theology"] },
  { term: "Architecture", definition: "The invisible design that organises and directs human outcomes.", lineage: ["Aristotle — formal causation", "Aquinas — natural order", "Systems theory"] },
  { term: "Agency", definition: "The divinely given capacity to act; misused when detached from responsibility.", lineage: ["Genesis — stewardship mandate", "Frankl — meaning through responsibility", "Existential philosophy"] },
  { term: "Boundary", definition: "A moral and structural limit that protects identity and enables civilisation.", lineage: ["Deuteronomy — covenantal boundaries", "Douglas — social classification", "Burke — institutional limits"] },
  { term: "Calling", definition: "A divine assignment requiring human obedience and character.", lineage: ["Guinness — The Call", "Luther — vocation theology", "Proverbs — wisdom literature"] },
  { term: "Civilisation", definition: "A moral order expressed through institutions, culture, and long memory.", lineage: ["Toynbee — Study of History", "Ibn Khaldun — Muqaddimah", "Augustine — City of God"] },
  { term: "Convergence", definition: "The merging of ideology, technology, economy, and belief into a new power structure.", lineage: ["Postman — Technopoly", "Hayek — spontaneous order", "Rieff — therapeutic culture"] },
  { term: "Culture", definition: "A people's emotional, moral, and aesthetic imagination.", lineage: ["Rieff — sacred order", "Durkheim — collective consciousness", "Guinness — cultural analysis"] },
  { term: "Destiny", definition: "The intersection of divine design and disciplined human agency.", lineage: ["Proverbs 16:9 — divine sovereignty", "Frankl — meaning and choice", "Calvinist vocation"] },
  { term: "Discipline", definition: "The internal infrastructure of ordered behaviour enabling long-term stability and execution.", lineage: ["Aristotle — virtue ethics", "Stoic philosophy — self-governance", "Biblical wisdom literature (Proverbs)"] },
  { term: "Dominion", definition: "Rightful stewardship grounded in righteousness, not exploitation.", lineage: ["Genesis 1:28 — creation mandate", "Aquinas — just governance", "Reformed theology"] },
  { term: "Drift", definition: "Incremental deviation from mission leading to decay.", lineage: ["Weber — routinisation of charisma", "Institutional entropy theory", "Hebrews 2:1 — warning against drift"] },
  { term: "Duty", definition: "Obligation rooted in honour, identity, and covenant responsibility.", lineage: ["Burke — intergenerational duty", "Kant — categorical imperative", "Military honour tradition"] },
  { term: "Eden", definition: "The archetype of governance, identity, work, and relationship.", lineage: ["Genesis 2–3 — creation narrative", "Augustine — prelapsarian order", "Theological anthropology"] },
  { term: "Identity", definition: "A stable core from which purpose flows; corrupted by confusion.", lineage: ["Erikson — identity formation", "Taylor — sources of the self", "Biblical imago Dei"] },
  { term: "Institution", definition: "A structured system preserving identity, values, and order across time.", lineage: ["Durkheim — social structure", "Weber — institutional authority", "Burke — tradition and continuity"] },
  { term: "Legacy", definition: "The impact that outlives an individual; the measure of alignment.", lineage: ["Proverbs 13:22 — inheritance", "Toynbee — creative minority", "Burke — partnership of generations"] },
  { term: "Nation", definition: "A people bound by shared identity, memory, and purpose.", lineage: ["Acts 17:26 — divinely appointed boundaries", "Herder — Volksgeist", "Smith — national identity theory"] },
  { term: "Order", definition: "The alignment of parts into a coherent whole; the opposite of chaos.", lineage: ["Genesis 1 — creation from chaos", "Aquinas — natural law", "Oakeshott — civil association"] },
  { term: "Purpose", definition: "The reason for existence established by God before creation.", lineage: ["Jeremiah 1:5 — before you were born", "Frankl — logotherapy", "Guinness — calling and purpose"] },
];

export function getGlossaryEntry(term: string): GlossaryEntry | undefined {
  return CANON_GLOSSARY.find((e) => e.term.toLowerCase() === term.toLowerCase());
}
