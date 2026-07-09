import { useEffect } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import EvidenceLimitedOfferPage, {
  type EvidenceLimitedOffer,
} from "@/components/commercial/EvidenceLimitedOfferPage";
import type { ProductReleaseGovernance } from "@/lib/product/product-release-governance";
import { useProductReleaseGovernance } from "@/hooks/useProductReleaseGovernance";

const PRODUCT_CODE = "gmi_q2_2026";
const CANONICAL_GMI_Q2_ROUTE = "/intelligence/global-market-intelligence-q2-2026";

const LEGACY_REDIRECT_OFFER: EvidenceLimitedOffer = {
  code: PRODUCT_CODE,
  slug: "global-market-intelligence-q2",
  title: "Global Market Intelligence — Q2 2026",
  eyebrow: "Governed current-edition redirect",
  heroPromise:
    "This legacy offer route resolves release governance before sending readers to the canonical GMI Intelligence Ledger page.",
  summary:
    "Global Market Intelligence Q2 2026 is purchased and fulfilled through the canonical current-edition Intelligence Ledger route, not this compatibility URL.",
  variant: "decision_support",
  buyer: [
    "Boards, founders, and operators evaluating the current Global Market Intelligence edition.",
  ],
  receives: [
    "A governed redirect to the current-edition product surface.",
    "Commerce and checkout eligibility derived from the product-release governance contract.",
  ],
  cannotClaim: [
    "This compatibility route is not an independent product page.",
    "It does not create separate checkout authority outside the canonical GMI edition resolver.",
  ],
  price: "Resolved on the canonical current-edition page",
  timeline: "Immediate redirect to the canonical Intelligence Ledger route.",
  manualFulfilmentNote:
    "Fulfilment binds to the exact released GMI edition, release receipt, and catalogue price authority on the canonical route.",
  ctas: [
    {
      label: "Open current edition",
      href: CANONICAL_GMI_Q2_ROUTE,
      kind: "primary",
      icon: "file",
    },
  ],
  faq: [
    {
      question: "Why does this page redirect?",
      answer:
        "GMI is now edition-factory driven. Legacy offer URLs resolve to the canonical current-edition Intelligence Ledger surface.",
    },
  ],
};

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: CANONICAL_GMI_Q2_ROUTE,
    permanent: false,
  },
});

export default function LegacyGmiQ2OfferRedirect() {
  const router = useRouter();
  const governance: ProductReleaseGovernance | null = useProductReleaseGovernance(PRODUCT_CODE);

  useEffect(() => {
    void router.replace(CANONICAL_GMI_Q2_ROUTE);
  }, [router]);

  return <EvidenceLimitedOfferPage offer={LEGACY_REDIRECT_OFFER} governance={governance} />;
}