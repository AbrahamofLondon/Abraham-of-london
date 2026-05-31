/**
 * tests/product/scenarios.ts — 12 Mandatory Test Scenarios
 *
 * Each scenario tests a specific decision class and asserts expected kernel behaviour.
 * These are the canonical test fixtures for the Decision Intelligence Kernel.
 */

export interface TestScenario {
  name: string
  input: string
  expected: {
    vocabularyState?: 1 | 2 | 3 | 4 | 5
    primaryClass: string
    requiresHumanReview?: boolean
    regulatedBoundaryHit?: boolean
    forbiddenActions?: string[]
    authorityMapEmpty?: boolean
    constraintCount?: number
    defaultTier?: string
  }
}

export const TEST_SCENARIOS: Record<string, TestScenario> = {
  hmrc_filing_rescue: {
    name: 'HMRC/Company Accounts Filing Rescue with No Funds',
    input: `We have a company accounts filing due at Companies House in 14 days. The accountant has resigned. The director is unwell. There are no funds to pay for an emergency filing. The company is solvent but cash-poor. If we miss the filing, the company will be struck off. The director's other directorates may also be affected.`,
    expected: {
      vocabularyState: 2,
      primaryClass: 'COMPLIANCE_AND_FILING',
      requiresHumanReview: true,
      regulatedBoundaryHit: true,
      forbiddenActions: ['Do not ignore the filing deadline'],
    },
  },

  board_decision_political_pressure: {
    name: 'Board Decision Under Political Pressure',
    input: `The board is being asked to approve a major acquisition. Two non-executive directors have expressed serious reservations about the strategic fit. The CEO is pushing for approval before the year-end. One NED has threatened to resign if the acquisition proceeds without a full due diligence period. The AGM is in three months.`,
    expected: {
      vocabularyState: 3,
      primaryClass: 'GOVERNANCE_AND_BOARD',
      requiresHumanReview: true,
      regulatedBoundaryHit: true,
    },
  },

  market_claim_strong_copy_weak_proof: {
    name: 'Market Claim with Strong Copy but Weak Proof',
    input: `We are launching a new product and the marketing team has prepared claims about market leadership and customer adoption. The actual customer data shows only 12 beta users, none of whom have completed the onboarding. The CEO wants to launch with the strong claims anyway. The product is not generating revenue yet.`,
    expected: {
      vocabularyState: 2,
      primaryClass: 'OPERATIONAL_AND_EXECUTION',
      requiresHumanReview: false,
      forbiddenActions: ['Do not make unsupported market claims'],
    },
  },

  product_launch_revenue_pressure: {
    name: 'Product Launch Under Revenue Pressure',
    input: `We need to launch this product in Q2 or we miss our revenue target. The engineering team says it is not ready — there are three known critical bugs and the security review is incomplete. Sales has already pre-sold £500k based on the Q2 launch date. The board does not know about the security issue.`,
    expected: {
      vocabularyState: 3,
      primaryClass: 'OPERATIONAL_AND_EXECUTION',
      requiresHumanReview: true,
      forbiddenActions: ['Do not launch with unresolved critical bugs', 'Do not withhold security issues from the board'],
    },
  },

  procurement_supplier_risk: {
    name: 'Procurement Supplier Risk',
    input: `Our sole supplier for a critical component has issued a force majeure notice. They cannot guarantee delivery for 12 weeks. We have 4 weeks of inventory. Our customers have firm orders. Switching supplier requires 8 weeks of qualification. The CFO says we cannot absorb the penalty for late delivery.`,
    expected: {
      vocabularyState: 2,
      primaryClass: 'TECHNOLOGY_AND_DEPENDENCY',
      constraintCount: 3,
    },
  },

  investor_pitch_unsupported_traction: {
    name: 'Investor Pitch with Unsupported Traction',
    input: `We are raising a Series A. The pitch deck claims 300% year-on-year growth. The actual growth is 40% if you exclude the founder's previous company customers that were migrated. The lead investor has asked for board references. The founder is reluctant to share them. The round closes in 6 weeks.`,
    expected: {
      vocabularyState: 2,
      primaryClass: 'COMMERCIAL_AND_MARKET',
      requiresHumanReview: true,
      regulatedBoundaryHit: true,
    },
  },

  operational_failure_unclear_owner: {
    name: 'Operational Failure with Unclear Owner',
    input: `A critical system went down for 6 hours. No one knows who is responsible for fixing it. The operations team says it is engineering. Engineering says it is infrastructure. Infrastructure says it is a vendor issue. The vendor says it is a configuration problem. The CEO wants someone held accountable.`,
    expected: {
      vocabularyState: 1,
      primaryClass: 'TECHNOLOGY_AND_DEPENDENCY',
      authorityMapEmpty: true,
    },
  },

  legal_admin_family_deadline: {
    name: 'Legal/Admin/Family Deadline',
    input: `I need to respond to a letter before claim from a former business partner. The deadline is 21 days. I cannot afford a solicitor. The claim is about an oral agreement from 2019. I do not have any documentation. The other party has a solicitor. I am considering representing myself.`,
    expected: {
      vocabularyState: 2,
      primaryClass: 'LEGAL_AND_CONTRACTUAL',
      requiresHumanReview: true,
      regulatedBoundaryHit: true,
      forbiddenActions: ['Do not represent yourself without understanding the risks'],
    },
  },

  cash_constrained_survival: {
    name: 'Cash-Constrained Survival',
    input: `We have 6 weeks of cash runway. We have cut all non-essential costs. We are in late-stage discussions with two investors but neither has committed. A major customer has delayed payment by 60 days. The CEO is considering using personal credit cards to meet payroll. The company has no debt facility.`,
    expected: {
      vocabularyState: 3,
      primaryClass: 'FINANCIAL_AND_CAPITAL',
      requiresHumanReview: true,
      regulatedBoundaryHit: true,
      forbiddenActions: ['Do not use personal credit cards for payroll without legal advice'],
    },
  },

  strategic_asymmetric_partnership: {
    name: 'Strategic Asymmetric Partnership',
    input: `A much larger company has offered a strategic partnership. They want exclusive access to our technology in exchange for distribution. Our board is excited. The legal team says the contract has no exit clause and grants them IP rights to derivative works. The CEO wants to sign quickly before they change their mind.`,
    expected: {
      vocabularyState: 3,
      primaryClass: 'STRATEGIC_AND_POSITIONING',
      requiresHumanReview: true,
      forbiddenActions: ['Do not sign without an exit clause', 'Do not grant IP rights without restriction'],
    },
  },

  executive_reputational_exposure: {
    name: 'Executive Reputational Exposure',
    input: `A newspaper has contacted us about allegations regarding the CEO's conduct at a previous company. The allegations are unproven but damaging. The CEO says they are false. The PR firm recommends a full denial. The legal team says any public statement could prejudice potential proceedings. The board meets tomorrow.`,
    expected: {
      vocabularyState: 3,
      primaryClass: 'REPUTATIONAL_AND_EXPOSURE',
      requiresHumanReview: true,
      regulatedBoundaryHit: true,
    },
  },

  low_stakes_preference: {
    name: 'Low-Stakes Preference',
    input: `I am trying to decide which project management software to use for my small team. We have used Asana before but some team members prefer Notion. There is no deadline. No budget constraint. No customer impact. It is purely a team preference decision.`,
    expected: {
      vocabularyState: 1,
      primaryClass: 'LOW_STAKES_PREFERENCE',
      requiresHumanReview: false,
      regulatedBoundaryHit: false,
      defaultTier: 'free_signal',
    },
  },
}
