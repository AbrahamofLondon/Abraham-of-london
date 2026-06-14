import { useMemo } from "react";
import EvidenceLimitedOfferPage, {
  type EvidenceLimitedOffer,
} from "@/components/commercial/EvidenceLimitedOfferPage";
import {
  type ProductReleaseGovernance,
  getRequiredEvidenceBoundary,
  canReleaseCommercially,
  canUseCheckout,
  canUseManualFulfilment,
} from "@/lib/product/product-release-governance";
import { useProductReleaseGovernance } from "@/hooks/useProductReleaseGovernance";

const PRODUCT_CODE = "fast_diagnostic";

// Fallback offer configuration for initial page load
const DEFAULT_OFFER: EvidenceLimitedOffer = {
  code: PRODUCT_CODE,
  slug: "fast-diagnostic-decision-support",
  title: "Fast Diagnostic Decision Support",
  eyebrow: "Evidence-limited offer",
  heroPromise:
    "A fast, human-reviewed decision-support output for leaders who need to name the pressure, expose the weak evidence point, and leave with one bounded next move.",
  summary:
    "Evidence-limited decision-support material for a single consequential decision. It structures judgement without granting product authority.",
  variant: "decision_support",
  buyer: [
    "A founder, principal, operator, or executive facing one decision that has started to drift.",
    "A buyer who needs a structured outside read before spending more time in meetings.",
    "A team lead who needs a clearer next move without pretending the evidence is complete.",
  ],
  receives: [
    "A concise decision-pressure read based on the submitted intake.",
    "A case-derived diagnosis of the likely decision pattern and evidence gap.",
    "A practical next move and review checkpoint.",
    "A short evidence boundary explaining what the output can and cannot support.",
  ],
  cannotClaim: [
    "It cannot independently verify the buyer's account or source evidence.",
    "It cannot certify that the proposed decision is correct.",
    "It cannot claim restored authority, external proof, or outcome assurance.",
    "It cannot replace legal, financial, medical, or regulated professional advice.",
  ],
  price: "GBP 95 introductory assisted fulfilment",
  timeline: "Intake review within 1 business day. Output usually delivered within 2 business days after boundary acceptance and payment confirmation.",
  manualFulfilmentNote:
    "Purchase intent is handled manually while checkout remains authority-gated. An operator confirms scope, sends intake instructions, issues a manual invoice or payment link, and delivers the bounded output after review.",
  ctas: [
    {
      label: "Buy now",
      href: "mailto:info@abrahamoflondon.org?subject=Buy%20Fast%20Diagnostic%20Decision%20Support&body=I%20want%20to%20purchase%20Fast%20Diagnostic%20Decision%20Support.%20Please%20send%20the%20intake%20and%20manual%20payment%20instructions.",
      kind: "primary",
      icon: "mail",
    },
    {
      label: "Request review",
      href: "/contact?type=strategic-advisory&requested=fast_diagnostic_decision_support",
      kind: "secondary",
      icon: "file",
    },
    {
      label: "Book advisory call",
      href: "/contact?type=strategic-advisory&requested=fast_diagnostic_decision_support_call",
      kind: "quiet",
      icon: "calendar",
    },
  ],
  faq: [
    {
      question: "Is this the same as restored Fast Diagnostic authority?",
      answer:
        "No. This is a sellable evidence-limited support offer. It does not restore authority and does not create independent proof of the product.",
    },
    {
      question: "What do I need to submit?",
      answer:
        "A short description of the decision, stakeholders, deadline, available evidence, constraints, prior attempts, options, and consequence of delay.",
    },
    {
      question: "Why manual fulfilment?",
      answer:
        "Manual fulfilment keeps scope, evidence boundaries, payment, and delivery under operator review while the wider authority estate remains under reconciliation.",
    },
    {
      question: "Can this be used before a larger engagement?",
      answer:
        "Yes. It can help decide whether a deeper review is warranted, but it does not itself approve escalation or claim a verified evidence state.",
    },
  ],
};

export default function FastDiagnosticDecisionSupportOffer() {
  const governance = useProductReleaseGovernance(PRODUCT_CODE);

  // If governance prevents commercial release, do not render the CTA
  const offer = useMemo(() => {
    if (!governance) {
      return DEFAULT_OFFER;
    }

    const commercial = canReleaseCommercially(governance);
    const checkout = canUseCheckout(governance);
    const manualFulfilment = canUseManualFulfilment(governance);

    if (!commercial.allowed) {
      // Product is not commercially releasable according to governance
      return {
        ...DEFAULT_OFFER,
        ctas: [], // No CTAs if governance blocks commercial release
      };
    }

    // Use governance-derived values where applicable
    return {
      ...DEFAULT_OFFER,
      cannotClaim: governance.forbiddenClaims,
      ctas: DEFAULT_OFFER.ctas.filter((cta) => {
        // Filter out "Buy now" CTA if checkout is not allowed
        if (cta.label === "Buy now" && !checkout.allowed) {
          return false;
        }
        return true;
      }),
    };
  }, [governance]);

  return <EvidenceLimitedOfferPage offer={offer} governance={governance} />;
}
