import * as React from "react";
import fs from 'fs';
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import path from "path";
import matter from "gray-matter"; // 🔑 ADDED: Import gray-matter
import { serialize } from "next-mdx-remote/serialize"; // 🔑 ADDED: Import serialize

// 💡 UPGRADE: Use the specific type for MDX serialization result
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";

// 🚨 REMOVED: Dependency on custom utility logic that might hide issues
// import { listSlugs, loadMdxBySlug } from "@/lib/mdx-file";

// 🔑 CRITICAL FIX: Replace the ambiguous map with the central, fixed MDXComponents map
import { MDXComponents } from '@/components/mdx-components';

import BrandFrame from "@/components/print/BrandFrame";

// 💡 REMOVED: Unused import 'fs' is now used in logic, keeping path.
// const DIR = path.join(process.cwd(), "content", "print", "post"); // Path is used in logic below

const POSTS_DIR = path.join(process.cwd(), "content", "print", "post");

// --- [ GetStaticPaths ] ---

export const getStaticPaths: GetStaticPaths = async () => {
    try {
        // 🔑 FIX: Direct file system read for robust path generation
        const files = fs.readdirSync(POSTS_DIR);

        const paths = files
            .filter(filename => filename.endsWith('.mdx'))
            .map((filename) => ({
                params: { slug: filename.replace('.mdx', '') }
            }));

        return { paths, fallback: false };
    } catch (error) {
        console.warn("Could not read print posts directory for paths. Returning empty paths.");
        return { paths: [], fallback: false };
    }
};

// --- [ GetStaticProps ] ---

type PrintPostProps = {
    slug: string;
    frontmatter: Record<string, any>;
    mdxSource: MDXRemoteSerializeResult;
};

export const getStaticProps: GetStaticProps<PrintPostProps> = async ({ params }) => {
    const slug = String(params?.slug);

    try {
        // 🔑 FIX: Direct file system read to replace loadMdxBySlug
        const filePath = path.join(POSTS_DIR, slug + '.mdx');
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
        console.error(`Error fetching print post for slug: ${slug}`, error);
        return { notFound: true };
    }
};

// --- [ Component Rendering ] ---

const PrintPost: NextPage<PrintPostProps> = ({ slug, frontmatter, mdxSource }) => {

    if (!mdxSource) {
        return <h1>Error: Content data is missing.</h1>;
    }

    return (
        <>
            <Head>
                <title>{`${frontmatter?.title ? frontmatter.title : 'Print Post'} | Print`}</title>
            </Head>
            <BrandFrame>
                <article className="prose lg:prose-lg dark:prose-invert mx-auto">
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