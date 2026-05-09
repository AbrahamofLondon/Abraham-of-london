import HomepageHero from "@/components/homepage/HomepageHero";
import MarketDefectBlock from "@/components/homepage/MarketDefectBlock";
import RefusalDemo from "@/components/homepage/RefusalDemo";
import OutputArtifactPreview from "@/components/homepage/OutputArtifactPreview";
import MemoryContinuityPreview from "@/components/homepage/MemoryContinuityPreview";
import EarnedProgressionBlock from "@/components/homepage/EarnedProgressionBlock";
import TrustArchitectureBlock from "@/components/homepage/TrustArchitectureBlock";
import HomepageFinalCTA from "@/components/homepage/HomepageFinalCTA";

export default function CategoryFrontDoor() {
  return (
    <>
      <HomepageHero />
      <MarketDefectBlock />
      <RefusalDemo />
      <OutputArtifactPreview />
      <MemoryContinuityPreview />
      <EarnedProgressionBlock />
      <TrustArchitectureBlock />
      <HomepageFinalCTA />
    </>
  );
}
