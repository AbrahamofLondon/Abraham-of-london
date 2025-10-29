import fs from 'fs';
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import path from "path";
import matter from "gray-matter"; // 🔑 ADDED: Import gray-matter for frontmatter parsing
import { serialize } from "next-mdx-remote/serialize"; // 🔑 ADDED: Import serialize for MDX processing

// 💡 UPGRADE: Use specific types for MDX serialization result
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";

// 🚨 REMOVED: Dependency on custom utility logic
// import { listSlugs, loadMdxBySlug } from "@/lib/mdx-file";

// 🔑 FIX: Import the centralized, correct MDX component map
import { MDXComponents } from "@/components/mdx-components";
// 🚨 REMOVED: Ambiguous import
// import { mdxComponents } from "@/lib/mdx-components";

import BrandFrame from "@/components/print/BrandFrame";

const EVENTS_DIR = path.join(process.cwd(), "content", "print", "event");

// --- [ GetStaticPaths ] ---

export const getStaticPaths: GetStaticPaths = async () => {
    try {
        // 🔑 FIX: Direct file system read for robust path generation
        const files = fs.readdirSync(EVENTS_DIR);
        const paths = files
            .filter(filename => filename.endsWith('.mdx'))
            .map((filename) => ({
                params: { slug: filename.replace('.mdx', '') }
            }));

        return { paths, fallback: false };
    } catch (error) {
        console.warn("Could not read print events directory for paths. Returning empty paths.");
        return { paths: [], fallback: false };
    }
};

// --- [ GetStaticProps ] ---

// 💡 UPGRADE: Explicitly define the Props type for safety
type PrintEventProps = {
    slug: string;
    frontmatter: Record<string, any>;
    mdxSource: MDXRemoteSerializeResult;
};

export const getStaticProps: GetStaticProps<PrintEventProps> = async ({ params }) => {
    const slug = String(params?.slug);

    try {
        // 🔑 FIX: Direct file system read to replace loadMdxBySlug
        const filePath = path.join(EVENTS_DIR, slug + '.mdx');
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(markdownWithMeta);

        // 💡 UPGRADE: Ensure date objects are serialized before passing to props
        const serializedFrontmatter = Object.fromEntries(
            Object.entries(frontmatter).map(([key, value]) => [
                key,
                value instanceof Date ? value.toISOString() : value
            ])
        );

        // Serialize the content, allowing for custom components
        const mdxSource = await serialize(content, { scope: serializedFrontmatter });

        return {
            props: {
                slug,
                frontmatter: serializedFrontmatter,
                mdxSource
            },
            revalidate: 60,
        };
    } catch (error) {
        console.error(`Error fetching print event for slug: ${slug}`, error);
        return { notFound: true };
    }
};

// --- [ Component Rendering ] ---

type Props = { slug: string; frontmatter: any; mdxSource: any };

export default function PrintEvent({ slug, frontmatter, mdxSource }: Props) {
    if (!mdxSource) {
        return <h1>Error: Content data is missing.</h1>;
    }

    return (
        <>
            <Head>
                <title>{frontmatter?.title ? `${frontmatter.title} | Print` : `Print Event | ${slug}`}</title>
            </Head>
            <BrandFrame>
                <article className="prose lg:prose-lg dark:prose-invert mx-auto">
                    <MDXRemote
                        {...mdxSource}
                        // 🔑 FIX: Pass the centralized, correct MDXComponents map
                        components={MDXComponents}
                    />
                </article>
            </BrandFrame>
        </>
    );
}