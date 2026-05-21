import HomepageHero from "@/components/homepage/HomepageHero";
import WhatYouCanUseTodaySection from "@/components/homepage/WhatYouCanUseTodaySection";
import MarketDefectBlock from "@/components/homepage/MarketDefectBlock";
import OutputArtifactPreview from "@/components/homepage/OutputArtifactPreview";
import TrustArchitectureBlock from "@/components/homepage/TrustArchitectureBlock";
import PlainEnglishDecisionLayer from "@/components/trust/PlainEnglishDecisionLayer";
import VerificationSpineBlock from "@/components/homepage/VerificationSpineBlock";
import SectionCTAStrip from "@/components/homepage/SectionCTAStrip";
import ProfessionalContinuitySection from "@/components/homepage/ProfessionalContinuitySection";
import ExecutiveReportingSection from "@/components/homepage/ExecutiveReportingSection";
import StrategyRoomSection from "@/components/homepage/StrategyRoomSection";
import RetainedOversightSection from "@/components/homepage/RetainedOversightSection";
import ProvenanceThesisSection from "@/components/homepage/ProvenanceThesisSection";
import EarnedProgressionBlock from "@/components/homepage/EarnedProgressionBlock";
import RefusalDemo from "@/components/homepage/RefusalDemo";
import MemoryContinuityPreview from "@/components/homepage/MemoryContinuityPreview";
import DecisionDelayExposureCTASection from "@/components/homepage/DecisionDelayExposureCTASection";
import OperatorPilotBlock from "@/components/homepage/OperatorPilotBlock";
import VenturesSection from "@/components/homepage/VenturesSection";
import HomepageFinalCTA from "@/components/homepage/HomepageFinalCTA";

// Repeated CTA configurations — restrained, never duplicating the primary in
// the same visual cluster. First strip sits at the entry/product-ladder
// boundary; second sits after the earned-but-gated Strategy Room.
const ENTRY_CTAS = [
  { label: "Run the Fast Diagnostic", href: "/diagnostics/fast", primary: true },
  { label: "Estimate decision delay exposure", href: "/tools/decision-delay-exposure" },
];

const MID_CTAS = [
  { label: "Run the Fast Diagnostic", href: "/diagnostics/fast", primary: true },
  { label: "Explore executive reporting", href: "/diagnostics/executive-reporting" },
  { label: "View provenance sample", href: "/provenance/sample-export" },
  { label: "Explore Library", href: "/library" },
];

export default function CategoryFrontDoor() {
  return (
    <>
      <HomepageHero />
      <WhatYouCanUseTodaySection />
      <MarketDefectBlock />
      <OutputArtifactPreview />
      <TrustArchitectureBlock />
      <PlainEnglishDecisionLayer variant="homepage" id="plain-english-homepage" />
      <VerificationSpineBlock />
      <SectionCTAStrip ctas={ENTRY_CTAS} />
      <ProfessionalContinuitySection />
      <ExecutiveReportingSection />
      <StrategyRoomSection />
      <SectionCTAStrip ctas={MID_CTAS} />
      <RetainedOversightSection />
      <ProvenanceThesisSection />
      <EarnedProgressionBlock />
      <RefusalDemo />
      <MemoryContinuityPreview />
      <DecisionDelayExposureCTASection />
      <OperatorPilotBlock />
      <section
        aria-label="Venture ecosystem"
        className="border-y border-white/[0.05] bg-black px-6 py-20 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <VenturesSection />
        </div>
      </section>
      <HomepageFinalCTA />
    </>
  );
}
