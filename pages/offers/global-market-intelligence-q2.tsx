import React, { useMemo } from 'react';
import Head from 'next/head';
import EvidenceLimitedOfferPage, {
  type EvidenceLimitedOffer,
} from '@/components/commercial/EvidenceLimitedOfferPage';
import {
  type ProductReleaseGovernance,
} from '@/lib/product/product-release-governance';
import { useProductReleaseGovernance } from '@/hooks/useProductReleaseGovernance';

const PRODUCT_CODE = 'gmi_q2_2026';

const DEFAULT_OFFER: EvidenceLimitedOffer = {
  code: PRODUCT_CODE,
  slug: 'global-market-intelligence-q2',
  title: 'Global Market Intelligence — Q2 2026',
  eyebrow: 'Quarterly decision intelligence',
  heroPromise:
    'Quarterly decision intelligence for leaders operating under structural uncertainty — the market report that scores its own prior-quarter calls before it issues new ones.',
  summary:
    'Global Market Intelligence is quarterly decision intelligence for leaders governing under structural uncertainty. The difference is not more news — it is accountable judgement: every issue reviews and scores the previous quarter’s material calls against outcomes before making new ones.',
  variant: 'decision_support',
  buyer: [
    'Boards and executives who must act under uncertainty, not wait for clarity',
    'Strategy and planning teams needing quarterly market calibration',
    'Risk, finance, and investment functions pricing structural (not just cyclical) risk',
    'Operators who value a report that publishes its own scorecard',
  ],
  receives: [
    'Quarterly PDF report: full analysis, scored prior-quarter call review, and scenario framework',
    'Web-accessible edition with the protected report artifact and full source appendix',
    'Prior-quarter call scorecard and falsification review inside the report',
    'Falsification register: prior-quarter calls scored openly against outcomes',
    'Methodology and governance documentation with confidence classes',
    'Access to the current issue and the verified archive for the quarter',
  ],
  cannotClaim: [
    'It cannot claim investment advice or trading recommendations.',
    'It cannot claim guaranteed forecasts or prediction certainty.',
    'It cannot claim AI-powered or algorithmic market prediction.',
    'It cannot claim certified or externally validated market analysis.',
    'It cannot provide price targets or outcome guarantees.',
    'It cannot claim exclusive market authority or privileged signals.',
  ],
  price: '£59 single-issue access',
  timeline:
    'Q2 2026 is structurally market-ready for the 8 July 2026 publication transition, pending the final post-8-July data lock and owner release authority. Until then, Q1 remains the current published edition.',
  manualFulfilmentNote:
    'No self-serve checkout, manual billing fulfilment, or Stripe binding is enabled for this release candidate. Not investment advice.',
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
      question: 'What makes this different from other market reports?',
      answer:
        'It scores itself. Every quarter, GMI reviews its prior material calls against what actually happened and publishes the verdicts — including the misses — before issuing new ones. The difference is not more news. It is accountable judgement.',
    },
    {
      question: 'Is this investment advice?',
      answer:
        'No. GMI is strategic decision-support for governing under uncertainty. It is not investment, trading, or financial advice; all decisions remain the responsibility of your organisation and its qualified professional advisers.',
    },
    {
      question: 'What is the methodology boundary?',
      answer:
        'GMI is built on published sources and market-implied data, not proprietary algorithms or insider signals. Claims are governed by source class, confidence class, and falsification review so the judgement remains accountable.',
    },
    {
      question: 'How is access governed?',
      answer:
        'Editions follow a publication lifecycle: Q2 becomes current only after final data lock and owner release authority. Until then, Q1 remains current and Q2 access fails closed.',
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
        <title>Global Market Intelligence — Quarterly Decision Intelligence</title>
        <meta
          name="description"
          content="Quarterly decision intelligence for leaders governing under structural uncertainty. The report that scores its own prior-quarter calls before issuing new ones. Not investment advice."
        />
      </Head>
      <EvidenceLimitedOfferPage
        offer={offer}
        governance={governance}
      />
    </>
  );
}
