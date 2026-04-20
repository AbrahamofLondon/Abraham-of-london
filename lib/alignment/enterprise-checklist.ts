// lib/alignment/enterprise-checklist.ts

import type { EnterpriseQuestion } from "./enterprise-types";

export const ENTERPRISE_ALIGNMENT_QUESTIONS: EnterpriseQuestion[] = [
  {
    id: "mc_1",
    domain: "mandate_clarity",
    statement:
      "We can clearly say what this organisation is here to do — and there is no confusion about it.",
  },
  {
    id: "mc_2",
    domain: "mandate_clarity",
    statement:
      "Our priorities come from what actually matters — not from whatever is loudest this week.",
  },
  {
    id: "mc_3",
    domain: "mandate_clarity",
    statement:
      "Teams broadly understand what matters most right now.",
  },
  {
    id: "di_1",
    domain: "decision_integrity",
    statement:
      "Major decisions are consistent with stated values and direction.",
  },
  {
    id: "di_2",
    domain: "decision_integrity",
    statement:
      "We do not routinely make reactive decisions under pressure.",
  },
  {
    id: "di_3",
    domain: "decision_integrity",
    statement:
      "We can explain why we made a decision — and the reason is not just 'it was urgent.'",
  },
  {
    id: "ec_1",
    domain: "environmental_coherence",
    statement:
      "Internal relationships reinforce direction rather than dilute it.",
  },
  {
    id: "ec_2",
    domain: "environmental_coherence",
    statement:
      "We are not tolerating structures that repeatedly generate confusion.",
  },
  {
    id: "ec_3",
    domain: "environmental_coherence",
    statement:
      "Information flow supports clarity more than noise.",
  },
  {
    id: "od_1",
    domain: "operational_discipline",
    statement:
      "How we run the week — meetings, check-ins, reporting — actually moves us toward what matters long-term.",
  },
  {
    id: "od_2",
    domain: "operational_discipline",
    statement:
      "Calendars and meetings reflect actual priorities.",
  },
  {
    id: "od_3",
    domain: "operational_discipline",
    statement:
      "Outputs matter more than visible busyness.",
  },
  {
    id: "eco_1",
    domain: "emotional_cultural_order",
    statement:
      "When things get hard, leadership stays steady.",
  },
  {
    id: "eco_2",
    domain: "emotional_cultural_order",
    statement:
      "People can disagree openly without it damaging the team.",
  },
  {
    id: "eco_3",
    domain: "emotional_cultural_order",
    statement:
      "Emotional reactions do not stop us from getting things done.",
  },
  {
    id: "lco_1",
    domain: "legacy_continuity_orientation",
    statement:
      "We are building beyond short-term comfort and pressure.",
  },
  {
    id: "lco_2",
    domain: "legacy_continuity_orientation",
    statement:
      "Succession and continuity are being actively considered.",
  },
  {
    id: "lco_3",
    domain: "legacy_continuity_orientation",
    statement:
      "What we are building will hold together even if the current leaders leave.",
  },
];