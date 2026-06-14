import EvidenceLimitedOfferPage, {
  type EvidenceLimitedOffer,
} from "@/components/commercial/EvidenceLimitedOfferPage";

const OFFER: EvidenceLimitedOffer = {
  code: "enterprise_assessment_advisory_review",
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
  price: "GBP 450 to GBP 950 depending on scope",
  timeline: "Initial review within 2 business days after intake. Written advisory note normally delivered within 5 business days after boundary acceptance and payment confirmation.",
  manualFulfilmentNote:
    "This offer uses assisted billing. An operator confirms scope, sends the intake pack, records boundary acceptance, issues a manual invoice or payment link, and completes delivery through the fulfilment checklist.",
  ctas: [
    {
      label: "Buy now",
      href: "mailto:info@abrahamoflondon.org?subject=Buy%20Enterprise%20Assessment%20Advisory%20Review&body=I%20want%20to%20purchase%20Enterprise%20Assessment%20Advisory%20Review.%20Please%20confirm%20scope%20and%20send%20manual%20payment%20instructions.",
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
      question: "Why is the price a range?",
      answer:
        "The price depends on the amount of material submitted, whether human review is required, and whether the output is a short advisory note or a broader review memo.",
    },
    {
      question: "Can this lead to deeper work?",
      answer:
        "Yes. The review can identify whether deeper work is worth considering, but it does not itself approve a product authority state or imply wider estate readiness.",
    },
  ],
};

export default function EnterpriseAssessmentAdvisoryReviewOffer() {
  return <EvidenceLimitedOfferPage offer={OFFER} />;
}
