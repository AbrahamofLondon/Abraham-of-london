"use client";

import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useMDXComponent } from "next-contentlayer/hooks"; 
import { allBriefs } from "contentlayer/generated";
import Layout from "@/components/layout/Layout";
import { ShieldCheck, Lock } from "lucide-react";

// Types for the Brief
interface BriefProps {
  brief: any;
  isAuthorized: boolean;
}

export default function BriefPage({ brief, isAuthorized }: BriefProps) {
  // Hook up the MDX component safely
  const MDXContent = useMDXComponent(brief?.body?.code || "");

  if (!brief) return null;

  return (
    <Layout title={`${brief.title} | Abraham of London`}>
      <article className="max-w-4xl mx-auto px-6 py-20">
        <header className="mb-12 border-b border-gray-100 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} /> Institutional Intelligence
            </span>
            <span className="text-gray-300 text-[10px] font-mono uppercase tracking-widest">
              Ref: {brief._id.slice(0, 8)}
            </span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-900 tracking-tighter mb-4 italic">
            {brief.title}
          </h1>
          {brief.subtitle && (
            <p className="text-xl text-gray-500 font-light italic">{brief.subtitle}</p>
          )}
        </header>

        <div className="prose prose-blue max-w-none prose-headings:font-serif prose-headings:italic prose-p:text-gray-600 prose-p:leading-relaxed">
          <MDXContent />
        </div>

        <footer className="mt-20 pt-10 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              End of Manuscript
            </div>
            <Lock className="text-gray-200" size={20} />
          </div>
        </footer>
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allBriefs.map((brief) => ({
    params: { slug: brief.slug || brief._raw.flattenedPath },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const brief = allBriefs.find(
    (b) => (b.slug || b._raw.flattenedPath) === params?.slug
  );

  if (!brief) {
    return { notFound: true };
  }

  return {
    props: {
      brief,
      isAuthorized: true, // Authorization logic handled via Middleware/Wrappers
    },
  };
};