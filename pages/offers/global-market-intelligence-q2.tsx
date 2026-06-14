import React, { useMemo } from 'react';
import Head from 'next/head';
import EvidenceLimitedOfferPage, {
  type EvidenceLimitedOffer,
} from '@/components/commercial/EvidenceLimitedOfferPage';
import {
  type ProductReleaseGovernance,
} from '@/lib/product/product-release-governance';
import { useProductReleaseGovernance } from '@/hooks/useProductReleaseGovernance';

const PRODUCT_CODE = 'gmi_quarterly';

const DEFAULT_OFFER: EvidenceLimitedOffer = {
  code: PRODUCT_CODE,
  slug: 'global-market-intelligence-q2',
  title: 'Global Market Intelligence — Q2 2026',
  eyebrow: 'Evidence-limited market intelligence',
  heroPromise:
    'Quarterly market intelligence that reviews prior-quarter material calls before issuing the next report.',
  summary:
    'Evidence-limited quarterly market analysis designed for board and executive decision-support. Compounds understanding through quarterly verification, not just publication.',
  variant: 'advisory_review',
  buyer: [
    'Board and executive decision-makers requiring structured market perspective',
    'Strategic planning teams needing quarterly market calibration',
    'Organizational intelligence teams monitoring market evidence',
    'Professional research contexts requiring decision-support material',
  ],
  receives: [
    'Quarterly PDF report with complete analysis and evidence-based scenarios',
    'Web-accessible intelligence dashboard with interactive market data',
    'Board presentation deck (30–45 minutes) with prior-quarter verification',
    'Falsification register showing Q1 calls vs. actual outcomes',
    'Methodology boundary documentation and evidence sources',
    'Quarterly access until 2026-09-30',
  ],
  cannotClaim: [
    'It cannot claim investment advice or trading recommendations.',
    'It cannot claim guaranteed forecasts or prediction certainty.',
    'It cannot claim AI-powered or algorithmic market prediction.',
    'It cannot claim certified or externally validated market analysis.',
    'It cannot provide price targets or outcome guarantees.',
    'It cannot claim exclusive market authority or privileged signals.',
  ],
  price: 'GBP 15,000 – 25,000 per quarter',
  timeline:
    'Delivery within 5 business days of request approval. Prior-quarter review requirement verified before shipment.',
  manualFulfilmentNote:
    'All Q2 Intelligence purchases are handled through manual fulfillment to ensure prior-quarter review verification, boundary acceptance, and human review completion before delivery. No automated checkout.',
  ctas: [
    {
      label: 'Request Access',
      href: '/offers/global-market-intelligence-q2#request',
      kind: 'primary',
      icon: 'mail',
    },
  ],
  faq: [
    {
      question: 'Is this the same as restored GMI authority?',
      answer:
        'No. This is evidence-limited market intelligence for decision-support. It does not restore authority and does not claim external validation or market proof.',
    },
    {
      question: 'Why is prior-quarter review required?',
      answer:
        'Prior-quarter review prevents moving-goalpost language, maintains accountability through documented calls vs. outcomes, and compounds understanding through verified evidence.',
    },
    {
      question: 'What does "evidence-limited" mean?',
      answer:
        'Evidence-limited means the intelligence is based on published sources and market data, not proprietary algorithms or insider signals. All claims are bounded by available evidence.',
    },
    {
      question: 'Why manual fulfillment?',
      answer:
        'Manual fulfillment ensures human verification of prior-quarter review status, boundary acceptance, and content compliance before delivery.',
    },
  ],
};

export default function GlobalMarketIntelligenceQ2Offer() {
  const governance = useProductReleaseGovernance(PRODUCT_CODE);

  const offer = useMemo(() => {
    if (!governance) {
      return DEFAULT_OFFER;
    }

    return {
      ...DEFAULT_OFFER,
      ctas: governance.manualFulfilmentAllowed
        ? [
            {
              label: 'Request Access' as const,
              href: '/offers/global-market-intelligence-q2#request',
              kind: 'primary' as const,
              icon: 'mail' as const,
            },
          ]
        : [],
    } as EvidenceLimitedOffer;
  }, [governance]);

  return (
    <>
      <Head>
        <title>Global Market Intelligence Q2 — Evidence-Limited Market Intelligence</title>
        <meta
          name="description"
          content="Quarterly market intelligence reviewing prior-quarter calls before issuing the next report."
        />
      </Head>
      <EvidenceLimitedOfferPage
        offer={offer}
        governance={governance}
      />
    </>
  );
}
