// pages/print/post/[slug].tsx (Apply to all print/[slug] files)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import mdxComponents from '@/components/mdx-components'; // The correct component map
import { getAllContent, getContentBySlug } from "@/lib/mdx"; // The core data functions
import BrandFrame from "@/components/print/BrandFrame"; // Assuming this is correct

const CONTENT_TYPE = "blog"; // Change this for post/resource/book accordingly

interface PrintPageProps {
  source: MDXRemoteSerializeResult;
  frontmatter: any;
}

export default function PrintPage({ source, frontmatter }: PrintPageProps) {
  // CRITICAL: The page component MUST NOT use Contentlayer hooks, only standard React and MDXRemote.
  
  return (
    <BrandFrame
      title={frontmatter.title}
      subtitle={frontmatter.subtitle || frontmatter.excerpt}
      pageSize="A4" 
    >
      <div className="prose max-w-none print:text-black">
        {/* CRITICAL FIX: Using standard MDXRemote rendering */}
        <MDXRemote {...source} components={mdxComponents} />
      </div>
    </BrandFrame>
  );
}
