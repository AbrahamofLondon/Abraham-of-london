import HomepageHero from "@/components/homepage/HomepageHero";
import StartHereStrip from "@/components/homepage/StartHereStrip";
import WhatYouCanUseTodaySection from "@/components/homepage/WhatYouCanUseTodaySection";
import FoundryEntrySection from "@/components/homepage/FoundryEntrySection";
import MarketDefectBlock from "@/components/homepage/MarketDefectBlock";
import TrustArchitectureBlock from "@/components/homepage/TrustArchitectureBlock";
import PlainEnglishDecisionLayer from "@/components/trust/PlainEnglishDecisionLayer";
import SectionCTAStrip from "@/components/homepage/SectionCTAStrip";
import ProfessionalContinuitySection from "@/components/homepage/ProfessionalContinuitySection";
import RefusalDemo from "@/components/homepage/RefusalDemo";
import EditorialIntelligenceBand from "@/components/homepage/EditorialIntelligenceBand";
import HomepageFinalCTA from "@/components/homepage/HomepageFinalCTA";
import type { HomepageEditorialViewModel } from "@/lib/content/homepage-editorial-series";

// Contextual CTAs shown in the corridor preview strip
const CORRIDOR_CTAS = [
  { label: "View decision pathway", href: "/decision-pathway", primary: true },
  { label: "View paid corridor", href: "/products#paid-corridor" },
  { label: "Enterprise pathway", href: "/enterprise" },
];

type Props = {
  editorialViewModel: HomepageEditorialViewModel;
};

export default function CategoryFrontDoor({ editorialViewModel }: Props) {
  return (
    <>
      {/* 1. Hero — updated CTAs: Test decision | Boardroom Brief | Explore products */}
      <HomepageHero />

      {/* 2. Start Here commercial strip — 3 entry cards */}
      <StartHereStrip />

      {/* 3. Product estate preview — 5 pillars: Pressure Signal, Boardroom Brief, GMI, Enterprise, Instruments */}
      <WhatYouCanUseTodaySection />

      {/* 4. Foundry public test surfaces */}
      <FoundryEntrySection />

      {/* 5. What the system tests / market defect */}
      <MarketDefectBlock />

      {/* 6. Trust architecture — what the system tests */}
      <TrustArchitectureBlock />

      {/* 7. Plain English decision layer */}
      <PlainEnglishDecisionLayer variant="homepage" id="plain-english-homepage" />

      {/* 8. Decision pathway corridor preview strip */}
      <SectionCTAStrip ctas={CORRIDOR_CTAS} />

      {/* 9. What the system refuses to fake */}
      <RefusalDemo />

      {/* 10. Enterprise and professional routes */}
      <ProfessionalContinuitySection />

      {/* 11. Editorial intelligence band (GMI editorial) */}
      <EditorialIntelligenceBand editorialViewModel={editorialViewModel} />

      {/* 12. Final CTA — Test decision | Boardroom Brief | Explore products | Pricing */}
      <HomepageFinalCTA />
    </>
  );
}
