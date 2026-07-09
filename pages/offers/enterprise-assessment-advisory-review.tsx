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

const PRODUCT_CODE = "enterprise_assessment";

// Fallback offer configuration for initial page load
const DEFAULT_OFFER: EvidenceLimitedOffer = {
  code: PRODUCT_CODE,
  slug: "enterprise-assessment-advisory-review",
  title: "Enterprise Assessment Advisory Review",
  eyebrow: "Evidence-limited offer",
  heroPromise:
    "A bounded organisational advisory review for leaders who need to understand where strategy, authority, evidence, and execution may be separating.",
  summary:
    "Evidence-limited advisory review for organisational decision pressure. It supports review without granting current product authority.",
  variant: "advisory_review",
  buyer: [
    "A CEO, COO, CFO, founder, partner, or operating lead facing organisational drift.",
    "A leadership team preparing for a consequential decision with incomplete or conflicting evidence.",
    "An operator who needs a clear review structure before commissioning deeper work.",
  ],
  receives: [
    "A structured review of the submitted organisational decision context.",
    "A pattern reading across evidence, ownership, authority, execution, and timing pressure.",
    "A prioritised list of questions to resolve before heavier commitment.",
    "A bounded advisory note that states evidence limits and recommended next evidence action.",
  ],
  cannotClaim: [
    "It cannot independently verify internal documents, stakeholder claims, or financial figures.",
    "It cannot certify organisational readiness or implementation capacity.",
    "It cannot claim restored authority, external proof, or outcome assurance.",
    "It cannot replace formal due diligence, legal advice, audit, or regulated professional review.",
  ],
  price: "Manual scope confirmation",
  timeline: "Initial review within 2 business days after intake. Written advisory note normally delivered within 5 business days after boundary acceptance and payment confirmation.",
  manualFulfilmentNote:
    "This offer uses assisted billing. An operator confirms scope, sends the intake pack, records boundary acceptance, issues a manual invoice or payment link, and completes delivery through the fulfilment checklist.",
  ctas: [
    {
      label: "Request scope",
      href: "mailto:info@abrahamoflondon.org?subject=Enterprise%20Assessment%20Advisory%20Review%20Scope&body=Please%20confirm%20scope%2C%20boundary%2C%20and%20manual%20fulfilment%20steps%20for%20Enterprise%20Assessment%20Advisory%20Review.",
      kind: "primary",
      icon: "mail",
    },
    {
      label: "Request review",
      href: "/contact?type=strategic-advisory&requested=enterprise_assessment_advisory_review",
      kind: "secondary",
      icon: "file",
    },
    {
      label: "Book advisory call",
      href: "/contact?type=strategic-advisory&requested=enterprise_assessment_advisory_review_call",
      kind: "quiet",
      icon: "calendar",
    },
  ],
  faq: [
    {
      question: "Is this a full Enterprise Assessment authority restoration?",
      answer:
        "No. This is a bounded advisory review. It does not restore product authority and does not present the output as independently verified evidence.",
    },
    {
      question: "What material should be prepared?",
      answer:
        "Prepare the decision context, stakeholder map, deadline, available evidence, constraints, prior attempts, options, and known consequence of delay.",
    },
    {
      question: "How is scope confirmed?",
      answer:
        "Scope is confirmed by an operator before any billing or delivery commitment is made.",
    },
    {
      question: "Can this lead to deeper work?",
      answer:
        "Yes. The review can identify whether deeper work is worth considering, but it does not itself approve a product authority state or imply wider estate readiness.",
    },
  ],
};

export default function EnterpriseAssessmentAdvisoryReviewOffer() {
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
        if (cta.label === "Request scope" && !manualFulfilment.allowed) {
          return false;
        }
        return true;
      }),
    };
  }, [governance]);

  return <EvidenceLimitedOfferPage offer={offer} governance={governance} />;
}
