/* pages/inner-circle/briefs/[id].tsx — PRODUCTION HARDENED RENDERER */
import { GetStaticProps, GetStaticPaths, NextPage } from "next";
import { useRouter } from "next/router";
import IntelligenceBrief from "@/components/IntelligenceBrief";
import { BRIEF_REGISTRY, getBriefById, BriefEntry } from "@/lib/briefs/registry";
import { RefreshCw } from "lucide-react";

interface Props {
  brief: BriefEntry;
}

const BriefPage: NextPage<Props> = ({ brief }) => {
  const router = useRouter();

  // Handle fallback state for production safety
  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <IntelligenceBrief
      metadata={brief}
      title={brief.title}
      abstract={brief.abstract}
      content={
        <div className="space-y-6">
          <p className="dropcap">
            The current landscape of institutional design requires a fundamental 
            re-evaluation of how we perceive "stability." In this dispatch, we 
            outline the first principles of the **Resilience Framework**.
          </p>
          <h2 className="text-white text-xl font-serif italic mt-12">I. The Fragility Trap</h2>
          <p>
            Most organizations build for efficiency at the cost of redundancy. 
            When operating within frontier markets, this efficiency becomes a 
            liability. We must instead look toward **Modular Governance**.
          </p>
          {/* Content can be further expanded via MDX or a CMS in production */}
        </div>
      }
    />
  );
};

/**
 * PRODUCTION SAFETY: PRE-RENDER ALL KNOWN BRIEFS
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const paths = BRIEF_REGISTRY.map((brief) => ({
    params: { id: brief.id },
  }));

  return { paths, fallback: true }; // Allow for on-demand generation if brief count grows
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const brief = getBriefById(params?.id as string);

  if (!brief) {
    return { notFound: true };
  }

  return {
    props: { brief },
    revalidate: 3600, // Revalidate every hour for content updates
  };
};

export default BriefPage;