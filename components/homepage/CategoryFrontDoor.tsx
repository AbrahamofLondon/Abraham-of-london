import HomepageHero from "@/components/homepage/HomepageHero";
import FoundryEntrySection from "@/components/homepage/FoundryEntrySection";
import WhatYouCanUseTodaySection from "@/components/homepage/WhatYouCanUseTodaySection";
import MarketDefectBlock from "@/components/homepage/MarketDefectBlock";
import TrustArchitectureBlock from "@/components/homepage/TrustArchitectureBlock";
import PlainEnglishDecisionLayer from "@/components/trust/PlainEnglishDecisionLayer";
import SectionCTAStrip from "@/components/homepage/SectionCTAStrip";
import ProfessionalContinuitySection from "@/components/homepage/ProfessionalContinuitySection";
import RefusalDemo from "@/components/homepage/RefusalDemo";
import EditorialIntelligenceBand from "@/components/homepage/EditorialIntelligenceBand";
import HomepageFinalCTA from "@/components/homepage/HomepageFinalCTA";
import type { HomepageEditorialViewModel } from "@/lib/content/homepage-editorial-series";

const ENTRY_CTAS = [
  { label: "Test your decision", href: "/test-your-decision", primary: true },
  { label: "Explore products", href: "/products" },
  { label: "View the decision pathway", href: "/decision-pathway" },
  { label: "Run the Fast Diagnostic", href: "/diagnostics/fast" },
  { label: "Run an organisational scan", href: "/enterprise-decision-scan" },
];

type Props = {
  editorialViewModel: HomepageEditorialViewModel;
};

export default function CategoryFrontDoor({ editorialViewModel }: Props) {
  return (
    <>
      <HomepageHero />
      <FoundryEntrySection />
      <WhatYouCanUseTodaySection />
      <MarketDefectBlock />
      <TrustArchitectureBlock />
      <PlainEnglishDecisionLayer variant="homepage" id="plain-english-homepage" />
      <SectionCTAStrip ctas={ENTRY_CTAS} />
      <ProfessionalContinuitySection />
      <RefusalDemo />
      <EditorialIntelligenceBand editorialViewModel={editorialViewModel} />
      <HomepageFinalCTA />
    </>
  );
}
