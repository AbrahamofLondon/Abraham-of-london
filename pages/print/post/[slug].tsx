// pages/print/post/[slug].tsx

import * as React from "react";
import fs from 'fs'; // Retained, though not used in the final logic, helpful for context
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import path from "path";

// 💡 UPGRADE: Use the specific type for MDX serialization result
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote"; 

// 🔑 CRITICAL: The required data loading logic
import { listSlugs, loadMdxBySlug } from "@/lib/mdx-file";

// 🚨 CRITICAL FIX: Replace the ambiguous map with the central, fixed MDXComponents map
import { MDXComponents } from '@/components/mdx-components'; 

import BrandFrame from "@/components/print/BrandFrame";

// 💡 UPGRADE: Remove unused import 'allResources' and 'mdxComponents'
// import { allResources } from 'contentlayer/generated'; 
// import { mdxComponents } from "@/lib/mdx-components"; 

const DIR = path.join(process.cwd(), "content", "print", "post");

// --- [ GetStaticPaths ] ---

export const getStaticPaths: GetStaticPaths = async () => {
    // 💡 UPGRADE: Pass the DIR constant directly to listSlugs if it expects the absolute path
    const slugs = listSlugs(DIR); 
    const paths = slugs.map((slug) => ({ params: { slug } }));
    
    return { paths, fallback: false };
};

// --- [ GetStaticProps ] ---

// 💡 UPGRADE: Explicitly define the Props type for safety
type PrintPostProps = { 
    slug: string; 
    frontmatter: Record<string, any>; 
    mdxSource: MDXRemoteSerializeResult; 
};

export const getStaticProps: GetStaticProps<PrintPostProps> = async ({ params }) => {
    // 💡 UPGRADE: Safely check and cast slug
    const slug = String(params?.slug);
    
    // CRITICAL: Ensure loadMdxBySlug can handle both directory and slug arguments correctly
    const data = await loadMdxBySlug(DIR, slug);
    
    if (!data || !data.mdxSource) {
         return { notFound: true };
    }
    
    // 💡 UPGRADE: Ensure date objects are serialized before passing to props (Best Practice)
    const serializedFrontmatter = Object.fromEntries(
        Object.entries(data.frontmatter).map(([key, value]) => [
            key, 
            value instanceof Date ? value.toISOString() : value
        ])
    );

    return { 
        props: { 
            slug, 
            frontmatter: serializedFrontmatter, 
            mdxSource: data.mdxSource 
        },
        revalidate: 60, // Added revalidate for production consistency
    };
};

// --- [ Component Rendering ] ---

const PrintPost: NextPage<PrintPostProps> = ({ slug, frontmatter, mdxSource }) => {
    
    if (!mdxSource) {
        return <h1>Error: Content data is missing.</h1>;
    }

    return (
        <>
            <Head>
                {/* 💡 UPGRADE: Cleaned up title construction using template literals */}
                <title>{`${frontmatter?.title ? frontmatter.title : 'Print Post'} | Print`}</title>
            </Head>
            <BrandFrame>
                <article className="prose lg:prose-lg dark:prose-invert mx-auto">
                    {/* 🔑 CRITICAL FIX: Pass the centralized, fixed MDXComponents map */}
                    <MDXRemote 
                        {...mdxSource} 
                        components={MDXComponents} 
                    />
                </article>
            </BrandFrame>
        </>
    );
}

export default PrintPost;