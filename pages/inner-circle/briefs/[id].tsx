/* pages/inner-circle/briefs/[id].tsx — INSTITUTIONAL BRIEFING RENDERER */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetServerSideProps, NextPage } from "next";
// Corrected export member based on your schema
import { allBriefs, type Brief } from "contentlayer/generated";
import IntelligenceBrief from "@/components/IntelligenceBrief";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";

interface Props {
  brief: {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    classification: string;
    series: string;
    volume: number; // Strictly a number to match IntelligenceBriefProps
    readingTime: string;
    tags: string[];
  };
  content: string;
  isLocked: boolean;
}

const BriefPage: NextPage<Props> = ({ brief, content, isLocked }) => {
  return (
    <IntelligenceBrief
      metadata={brief}
      title={brief.title}
      abstract={brief.description}
      content={
        <div className="prose prose-invert max-w-none">
          {isLocked ? (
            <div className="p-10 border border-rose-500/20 bg-rose-500/5 rounded-2xl text-rose-500 font-mono text-xs text-center space-y-4">
              <div className="flex justify-center mb-2">
                <span className="animate-pulse">⚠️ SECURITY CLEARANCE REQUIRED</span>
              </div>
              <p className="leading-relaxed">
                {content}
              </p>
              <div className="pt-4 border-t border-rose-500/10 text-[10px] uppercase tracking-[0.2em] text-rose-500/40">
                Institutional Audit Log: IP Address & Session Hash Recorded
              </div>
            </div>
          ) : (
            <div 
              className="dropcap text-zinc-300 leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ __html: content }} 
            />
          )}
        </div>
      }
    />
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;

  // Resolved: Typed iterator 'b' as 'Brief' to fix implicit 'any'
  const brief = allBriefs.find((b: Brief) => b._raw.flattenedPath === id);

  if (!brief) {
    return { notFound: true };
  }

  const sessionId = readAccessCookie(context.req as any);
  let isLocked = true;
  let displayContent = "ESTABLISH SECURE SESSION TO VIEW INTEL.";

  try {
    if (sessionId) {
      const ctx = await getSessionContext(sessionId);
      if (ctx.member && tierAtLeast(ctx.tier as any, "inner-circle")) {
        isLocked = false;
        displayContent = brief.body.html; 
      } else {
        displayContent = "INSUFFICIENT CLEARANCE LEVEL FOR THIS MANUSCRIPT.";
      }
    }
  } catch (err) {
    console.error("[VAULT_RENDER_ERROR]:", err);
    displayContent = "SYSTEM ERROR: CRYPTOGRAPHIC VAULT UNAVAILABLE.";
  }

  return {
    props: {
      brief: {
        id: brief._raw.flattenedPath,
        title: brief.title,
        description: brief.excerpt || brief.summary || "Classified intelligence brief.",
        category: brief.category || "Strategic Briefing",
        date: brief.date || "2026",
        classification: brief.classification || "RESTRICTED",
        series: (brief as any).series || "Standard",
        // Resolved: Type incompatibility fix (String -> Number)
        volume: Number((brief as any).volume) || 1, 
        readingTime: brief.readingTime?.text || "10m",
        tags: (brief as any).tags || [],
      },
      content: displayContent,
      isLocked: isLocked,
    },
  };
};

export default BriefPage;