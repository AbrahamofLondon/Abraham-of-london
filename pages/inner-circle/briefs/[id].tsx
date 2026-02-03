/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetServerSideProps, NextPage } from "next";
import IntelligenceBrief from "@/components/IntelligenceBrief";
import { getSecureDocument } from "@/lib/content/server"; // Our unified decryptor
import { BriefEntry } from "@/lib/briefs/registry";

interface Props {
  brief: BriefEntry;
  content: string;
  isLocked: boolean;
}

const BriefPage: NextPage<Props> = ({ brief, content, isLocked }) => {
  return (
    <IntelligenceBrief
      metadata={brief}
      title={brief.title}
      abstract={brief.abstract}
      content={
        <div className="prose prose-invert max-w-none">
          {isLocked ? (
            <div className="p-8 border border-rose-500/20 bg-rose-500/5 rounded-xl text-rose-500 font-mono text-sm">
              {content}
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

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.id as string;
  
  // Use our new Secure Engine to fetch and decrypt
  const secureDoc = await getSecureDocument(slug);

  if (!secureDoc) {
    return { notFound: true };
  }

  return {
    props: {
      brief: {
        id: secureDoc.slug,
        title: secureDoc.title,
        abstract: secureDoc.description || "Classified intelligence brief.",
        classification: secureDoc.classification,
        // map other fields from registry if needed
      },
      content: secureDoc.content, // This is now either decrypted text or a "Locked" warning
      isLocked: secureDoc.isLocked,
    },
  };
};

export default BriefPage;