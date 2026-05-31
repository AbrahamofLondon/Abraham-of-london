/**
 * lib/intelligence/regulated-boundary-protocol.ts — Regulated Boundary Protocol
 *
 * The system must never overclaim tax, legal, investment, medical, immigration,
 * or regulated professional advice. But it must still be useful.
 *
 * When a regulated boundary is hit, output:
 * - REGULATED BOUNDARY IDENTIFIED
 * - WHAT THIS MEANS FOR YOUR CASE
 * - WHAT WE CAN STILL MAP
 * - THE PROFESSIONAL BRIEF
 * - WHAT TO DO NEXT
 */

import type {
  LivingDecisionCase,
  RegulatedBoundaryState,
  RegulatedBoundaryOutput,
  DecisionClass,
  DecisionClassDefinition,
} from './types'
import { DecisionClassTaxonomy } from './decision-class-taxonomy'

export class RegulatedBoundaryProtocol {
  /**
   * Check a Living Decision Case for regulated boundary triggers.
   */
  check(livingCase: LivingDecisionCase): RegulatedBoundaryState {
    const triggers = this.identifyTriggers(livingCase)

    if (triggers.length === 0) {
      return { hit: false }
    }

    return {
      hit: true,
      type: triggers[0],
      allTriggers: triggers,
      output: this.generateBoundaryOutput(triggers, livingCase),
    }
  }

  /**
   * Identify which regulated boundaries are triggered.
   */
  private identifyTriggers(livingCase: LivingDecisionCase): string[] {
    const triggers: string[] = []
    const taxonomy = new DecisionClassTaxonomy()
    const definition = taxonomy.getDefinition(livingCase.classification?.primaryClass || 'STRATEGIC_AND_POSITIONING')

    for (const trigger of definition.regulatedBoundaryTriggers) {
      if (this.triggerConditionMet(trigger, livingCase)) {
        triggers.push(trigger)
      }
    }

    return triggers
  }

  /**
   * Check if a specific trigger condition is met.
   */
  private triggerConditionMet(trigger: string, livingCase: LivingDecisionCase): boolean {
    const raw = livingCase.situationModel?.rawContext?.toLowerCase() || ''

    switch (trigger) {
      case 'tax-advice':
        return livingCase.classification?.primaryClass === 'COMPLIANCE_AND_FILING' && raw.includes('tax')
      case 'legal-advice':
        // Fires for legal and governance classes, AND for reputational cases
        // where potential proceedings, allegations involving senior executives,
        // or media + legal risk are present
        return (
          livingCase.classification?.primaryClass === 'LEGAL_AND_CONTRACTUAL' ||
          livingCase.classification?.primaryClass === 'GOVERNANCE_AND_BOARD' ||
          (livingCase.classification?.primaryClass === 'REPUTATIONAL_AND_EXPOSURE' && (
            raw.includes('potential proceedings') ||
            raw.includes('proceedings') ||
            raw.includes('investigation') ||
            raw.includes('litigation') ||
            (raw.includes('allegation') && (raw.includes('legal') || raw.includes('lawyer') || raw.includes('solicitor'))) ||
            (raw.includes('newspaper') && (raw.includes('legal') || raw.includes('proceedings') || raw.includes('prejudice'))) ||
            (raw.includes('media') && raw.includes('legal'))
          ))
        )
      case 'investment-advice':
      case 'investment-promotion':
      case 'financial-promotion':
        return (
          livingCase.classification?.primaryClass === 'FINANCIAL_AND_CAPITAL' ||
          livingCase.classification?.primaryClass === 'COMMERCIAL_AND_MARKET'
        )
      case 'insolvency-advice':
        return raw.includes('insolvent') || raw.includes('bankrupt') || raw.includes('winding up')
      case 'director-duty-advice':
        return (
          livingCase.classification?.primaryClass === 'GOVERNANCE_AND_BOARD' ||
          livingCase.classification?.primaryClass === 'CONTINUITY_AND_TRANSITION'
        )
      case 'employment-advice':
        return (
          livingCase.classification?.primaryClass === 'PEOPLE_AND_AUTHORITY' ||
          livingCase.classification?.primaryClass === 'CONTINUITY_AND_TRANSITION'
        )
      case 'data-protection':
        return raw.includes('data') || raw.includes('gdpr') || raw.includes('personal data')
      case 'litigation-advice':
      case 'settlement-advice':
        return livingCase.classification?.primaryClass === 'LEGAL_AND_CONTRACTUAL'
      case 'competition-law':
        return raw.includes('competition') || raw.includes('antitrust') || raw.includes('monopoly')
      case 'defamation':
        return (
          raw.includes('defamation') || raw.includes('libel') || raw.includes('slander') ||
          // Reputational class with allegations + denial = potential defamation boundary
          (
            livingCase.classification?.primaryClass === 'REPUTATIONAL_AND_EXPOSURE' &&
            raw.includes('allegation') &&
            (raw.includes('false') || raw.includes('denial') || raw.includes('deny'))
          )
        )
      case 'regulatory-disclosure':
      case 'regulatory-compliance':
        return raw.includes('regulatory') || raw.includes('regulator') || raw.includes('commission')
      case 'audit-opinion':
        return raw.includes('audit') || raw.includes('accounts')
      case 'fiduciary-advice':
        return raw.includes('fiduciary') || raw.includes('trustee')
      default:
        return false
    }
  }

  /**
   * Generate the regulated boundary output.
   */
  private generateBoundaryOutput(
    triggers: string[],
    livingCase: LivingDecisionCase,
  ): RegulatedBoundaryOutput {
    return {
      regulatedBoundaryIdentified: true,
      whatThisMeans:
        'The system has identified that this situation touches on regulated professional advice boundaries. The system cannot provide regulated professional advice, but it can help you prepare to engage the right professional.',
      whatWeCanStillMap: [
        'Authority structure and decision mandate',
        'Obligation landscape and constraints',
        'Evidence quality and gaps',
        'Consequence exposure and timing',
        'Adversarial challenge and minimum viable path',
      ],
      professionalBrief: {
        purpose:
          'This brief is designed to help you approach a regulated professional with structure.',
        suggestedProfession: this.suggestProfession(triggers),
        whatToBring: this.whatToBring(triggers, livingCase),
        questionsToAsk: this.questionsToAsk(triggers, livingCase),
      },
      whatToDoNext: [
        'Review the mapped elements above.',
        'Prepare the documentation listed in the professional brief.',
        'Engage a qualified professional for the regulated element.',
        "Return to the system with the professional's input to update the case.",
      ],
    }
  }

  /**
   * Suggest the appropriate regulated professional.
   */
  private suggestProfession(triggers: string[]): string {
    if (triggers.includes('tax-advice')) return 'a qualified tax accountant or tax adviser'
    if (triggers.includes('legal-advice') || triggers.includes('litigation-advice') || triggers.includes('settlement-advice'))
      return 'a qualified solicitor'
    if (triggers.includes('investment-advice') || triggers.includes('financial-promotion'))
      return 'a regulated financial adviser'
    if (triggers.includes('insolvency-advice')) return 'a licensed insolvency practitioner'
    if (triggers.includes('director-duty-advice')) return 'a solicitor specialising in corporate governance'
    if (triggers.includes('employment-advice')) return 'an employment solicitor'
    if (triggers.includes('data-protection')) return 'a data protection specialist'
    if (triggers.includes('competition-law')) return 'a competition law solicitor'
    if (triggers.includes('defamation')) return 'a defamation solicitor'
    if (triggers.includes('fiduciary-advice')) return 'a solicitor specialising in fiduciary law'
    if (triggers.includes('audit-opinion')) return 'a qualified auditor'
    return 'a qualified professional in the relevant regulated field'
  }

  /**
   * Determine what documentation the buyer should bring to the professional.
   */
  private whatToBring(triggers: string[], livingCase: LivingDecisionCase): string[] {
    const items: string[] = ['This Living Decision Case reference and output']
    if (livingCase.authorityMap.length > 0) items.push('Authority documentation and delegation records')
    if (livingCase.obligationMap.length > 0) items.push('Relevant contracts, filings, or regulatory correspondence')
    if (livingCase.constraintGraph.length > 0) items.push('Evidence of constraints (financial statements, timelines, capacity data)')
    if (livingCase.evidenceGraph.length > 0) items.push('Any documentation referenced in the evidence graph')
    return items
  }

  /**
   * Generate questions the buyer should ask the professional.
   */
  private questionsToAsk(triggers: string[], livingCase: LivingDecisionCase): string[] {
    const questions: string[] = []
    if (triggers.includes('tax-advice')) questions.push('What is the filing deadline and what are the penalty exposures?')
    if (triggers.includes('legal-advice')) questions.push('What is the strength of the legal position and what are the limitation periods?')
    if (triggers.includes('investment-advice')) questions.push('What are the regulatory requirements for any financial promotion or investment solicitation?')
    if (triggers.includes('insolvency-advice')) questions.push('What are the director duties and personal liability risks in the current financial position?')
    if (triggers.includes('director-duty-advice')) questions.push('What are the director duties and potential liabilities in this situation?')
    if (triggers.includes('employment-advice')) questions.push('What are the employment law obligations and risks?')
    if (triggers.includes('data-protection')) questions.push('What are the data protection obligations and breach notification requirements?')
    if (questions.length === 0) questions.push('What are the key legal, regulatory, or professional obligations in this situation?')
    return questions
  }
}
