/**
 * lib/kernel/adversarial-preview.ts — Adversarial Preview Selection
 *
 * Selects ONE adversarial challenge for the Free Signal output.
 * Rules:
 * - Choose highest-severity challenge
 * - Prefer specific challenge over generic
 * - If no meaningful challenge exists, omit
 * - Low-stakes cases should usually omit
 * - Never fabricate a challenge
 */

import type { KernelContradiction, LivingDecisionCase } from '../intelligence/types'

export interface AdversarialPreview {
  label: string
  challenge: string
  challengedBy?: 'board' | 'investor' | 'regulator' | 'legal' | 'customer' | 'competitor' | 'journalist' | 'operator'
  whyItMatters: string
}

/**
 * Challenge ID to human-readable label and "challenged by" mapping.
 */
const CHALLENGE_META: Record<string, { label: string; challengedBy: AdversarialPreview['challengedBy']; plainLanguage: string; whyItMatters: string }> = {
  'board-pressure-vs-reservations': {
    label: 'Board governance challenge',
    challengedBy: 'board',
    plainLanguage: 'The board is being asked to decide while material reservations from directors remain undocumented. A dissenting director or later reviewer would attack the decision record first — not the decision itself, but whether proper process was followed before the vote.',
    whyItMatters: 'A decision reached without documented dissent is vulnerable to challenge regardless of its merits. The process is the first thing attacked, not the outcome.',
  },
  'executive-vs-governance': {
    label: 'Management pre-decision risk',
    challengedBy: 'board',
    plainLanguage: 'Management appears to have pre-decided the outcome and is seeking board approval as ratification rather than genuine governance. A reviewer would attack whether the board was asked to approve, ratify, or merely receive information.',
    whyItMatters: 'The distinction between approval and ratification changes the legal and governance exposure. If management has already committed, the board\'s role shifts from decision-maker to post-hoc validator.',
  },
  'urgency-vs-legal-concern': {
    label: 'Legal risk vs urgency conflict',
    challengedBy: 'legal',
    plainLanguage: 'There is pressure to commit or sign quickly, but legal concerns have been raised and are not yet resolved. A counterparty or regulator would attack the decision to proceed while known legal risks were outstanding.',
    whyItMatters: 'Proceeding with unresolved legal concerns creates liability that cannot be retrospectively managed. The urgency is likely external pressure, not an obligation.',
  },
  'strategic-commitment-vs-capability': {
    label: 'Irrevocable commitment risk',
    challengedBy: 'operator',
    plainLanguage: 'The proposed commitment would permanently restrict or eliminate a current capability — through IP transfer, exclusivity, or absence of exit rights. A future operator would attack the decision to accept permanent constraint without documenting the optionality lost.',
    whyItMatters: 'Irrevocable commitments cannot be undone. The decision to accept permanent constraint must be conscious and documented, not obscured in contract language.',
  },
  'reputational-threat-vs-response-gap': {
    label: 'Reputational response gap',
    challengedBy: 'journalist',
    plainLanguage: 'A reputational threat is active but no reviewed, legally-cleared response plan exists. A journalist or regulator would attack any premature or unauthorised statement before facts and legal exposure have been assessed.',
    whyItMatters: 'A premature statement cannot be withdrawn. The cost of a wrong statement exceeds the cost of delay.',
  },
  'pr-vs-legal-conflict': {
    label: 'PR vs legal conflict',
    challengedBy: 'legal',
    plainLanguage: 'The PR team and legal team have conflicting recommendations on public response. Any statement made while this conflict is unresolved may prejudice potential proceedings.',
    whyItMatters: 'Legal clearance is not a procedural step — it is protection. A statement made without it creates liability that cannot be retracted.',
  },
  'obligation-vs-resources': {
    label: 'Obligation vs resource constraint',
    challengedBy: 'regulator',
    plainLanguage: 'A legal or regulatory obligation exists but the resources to meet it are constrained. A regulator would attack inaction as the default — not as a neutral position, but as the highest-risk option.',
    whyItMatters: 'Statutory obligations compound with delay. Inaction is not a safe default.',
  },
  'deadline-vs-cash': {
    label: 'Deadline vs cash constraint',
    challengedBy: 'regulator',
    plainLanguage: 'A fixed deadline exists but cash is insufficient to meet it through the normal professional route. A regulator would attack the assumption that delay or imperfect filing is preferable to proactive communication.',
    whyItMatters: 'Missing a statutory deadline is rarely the better option. Proactive contact with the authority typically produces better outcomes than non-filing.',
  },
  'claim-vs-evidence': {
    label: 'Unsupported claim risk',
    challengedBy: 'investor',
    plainLanguage: 'A claim is being made — about market position, growth, or customer adoption — but the supporting evidence is absent or weak. An investor, buyer, or competitor would attack the claim first, not the product.',
    whyItMatters: 'A claim that cannot be substantiated is a liability. In a pitch, the first question is always about the evidence behind the claim.',
  },
  'launch-vs-readiness': {
    label: 'Launch readiness conflict',
    challengedBy: 'operator',
    plainLanguage: 'There is pressure to launch or release, but known readiness issues have not been resolved. An operator or customer would attack the decision to proceed before known defects or security concerns were addressed.',
    whyItMatters: 'Launching with unresolved issues creates customer impact, support burden, and reputational damage that exceeds the cost of delay.',
  },
  'revenue-vs-readiness': {
    label: 'Revenue pressure vs readiness',
    challengedBy: 'operator',
    plainLanguage: 'Revenue or deadline pressure to proceed conflicts with known readiness gaps. The incentive to launch early may be distorting the risk assessment.',
    whyItMatters: 'Revenue pressure creates a known decision bias. The incentive to proceed may be overriding legitimate readiness concerns.',
  },
  'supply-failure-vs-customer-obligation': {
    label: 'Supply chain vs customer obligation',
    challengedBy: 'customer',
    plainLanguage: 'A supply interruption makes it impossible to meet customer obligations, with penalty exposure. A customer or counterparty would attack the failure to communicate or plan for continuity.',
    whyItMatters: 'Supply interruption combined with customer penalty exposure creates compound risk that must be addressed proactively.',
  },
  'ownership-vs-accountability': {
    label: 'Ownership accountability gap',
    challengedBy: 'operator',
    plainLanguage: 'Operational ownership is disputed — each party attributes responsibility elsewhere. An operator or reviewer would attack the absence of clear ownership as the primary failure mode.',
    whyItMatters: 'Without clear ownership, no recovery action can be assigned and the failure will recur.',
  },
  'commercial-claim-vs-evidence-gap': {
    label: 'Commercial proof gap',
    challengedBy: 'investor',
    plainLanguage: 'Commercial claims lack supporting evidence and would not survive buyer, regulator, or competitor challenge. An investor would attack the gap between the claim and the proof.',
    whyItMatters: 'Unsupported commercial claims create legal, regulatory, and reputational exposure.',
  },
  'investor-claim-vs-evidence': {
    label: 'Investor claim proof gap',
    challengedBy: 'investor',
    plainLanguage: 'Claims in the investor narrative would not survive due diligence. An investor would separate committed revenue from projected revenue within the first meeting.',
    whyItMatters: 'Presenting projected revenue as committed is a known due diligence failure point.',
  },
  'existential-threat-vs-resources': {
    label: 'Existential risk vs resource gap',
    challengedBy: 'regulator',
    plainLanguage: 'An existential threat — strike-off, dissolution, or insolvency — has been identified but resources to address it are constrained. A regulator would attack delay as the highest-risk option.',
    whyItMatters: 'Existential threats do not resolve with time. Every day of inaction compounds the risk.',
  },
}

/**
 * Select the best adversarial challenge for the Free Signal preview.
 * Returns null if no meaningful challenge exists.
 */
export function selectAdversarialPreview(livingCase: LivingDecisionCase): AdversarialPreview | null {
  // Low-stakes: no adversarial preview
  if (livingCase.classification?.primaryClass === 'LOW_STAKES_PREFERENCE') {
    return null
  }

  const challenges = livingCase.adversarialChallenge
  if (!challenges || challenges.length === 0) {
    return null
  }

  // Sort by severity (CRITICAL first, then HIGH, then MEDIUM, then LOW)
  const severityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
  const sorted = [...challenges].sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0))

  // Try to find the best matching challenge
  for (const challenge of sorted) {
    const meta = CHALLENGE_META[challenge.id]
    if (meta) {
      return {
        label: meta.label,
        challenge: meta.plainLanguage,
        challengedBy: meta.challengedBy,
        whyItMatters: meta.whyItMatters,
      }
    }
  }

  // Fallback: if no meta found but challenges exist, create a generic one
  // Only use the highest-severity challenge
  const top = sorted[0]
  return {
    label: 'Adversarial risk identified',
    challenge: top.contradiction,
    whyItMatters: 'This contradiction must be resolved or consciously accepted before the decision can proceed safely.',
  }
}
