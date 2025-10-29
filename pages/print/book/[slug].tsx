import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import path from "path";
import fs from 'fs';
import matter from "gray-matter"; // 🔑 ADDED: Import gray-matter for frontmatter parsing
import { serialize } from "next-mdx-remote/serialize"; // 🔑 ADDED: Import serialize for MDX processing
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { useMDXComponent } from 'next-contentlayer/hooks'; // 🚨 FIX: useMDXComponent is likely from next-contentlayer, replacing it with MDXRemote/useMDXComponent from next-mdx-remote is needed. Assuming you use next-mdx-remote for this fix.
import { MDXComponents } from '@/components/mdx-components'; // 🔑 ADDED: Import your component map

// Define the content directory for book print pages
const BOOKS_DIR = path.join(process.cwd(), "content", "print", "book");

// --- [ GetStaticPaths ] ---

export const getStaticPaths: GetStaticPaths = async () => {
    try {
        // 🔑 FIX: Direct file system read to find all book slugs
        const files = fs.readdirSync(BOOKS_DIR);
        const paths = files
            .filter(filename => filename.endsWith('.mdx'))
            .map((filename) => ({
                params: { slug: filename.replace('.mdx', '') }
            }));
        
        // This file was using fallback: "blocking", keeping that for dynamic rendering
        return { paths, fallback: 'blocking' }; 
    } catch (error) {
        console.warn("Could not read print books directory for paths. Returning empty paths.");
        return { paths: [], fallback: 'blocking' };
    }
};

// --- [ GetStaticProps ] ---

// Explicitly define the Props type
type PrintBookProps = {
    slug: string;
    frontmatter: Record<string, any>;
    mdxSource: MDXRemoteSerializeResult;
};

export const getStaticProps: GetStaticProps<PrintBookProps> = async ({ params }) => {
    const slug = String(params?.slug);

    try {
        // 🔑 FIX: Direct file system read to fetch content
        const filePath = path.join(BOOKS_DIR, slug + '.mdx');
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(markdownWithMeta);
        
        // Ensure date objects are serialized before passing to props
        const serializedFrontmatter = Object.fromEntries(
            Object.entries(frontmatter).map(([key, value]) => [
                key,
                value instanceof Date ? value.toISOString() : value
            ])
        );

        // Serialize the content for MDXRemote rendering
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
        console.error(`Error fetching print book for slug: ${slug}`, error);
        return { notFound: true };
    }
};

// --- [ Component Rendering ] ---

type Props = { doc: any } & PrintBookProps; // Combine original doc type for safety

export default function BookPrintPage({ frontmatter, mdxSource }: Props) {
    if (!mdxSource) {
        return <h1>Error: Content data is missing.</h1>;
    }

    // NOTE: If you are using 'useMDXComponent', you must ensure it's imported from 
    // next-mdx-remote or remove the need for it entirely by using MDXRemote.
    // The previous implementation was likely an old Contentlayer pattern.

    return (
        <>
            <Head>
                <title>{`${frontmatter?.title ? frontmatter.title : 'Print Book'}`}</title>
            </Head>
            <div className="print-page print-book">
                <h1>{frontmatter?.title ?? "Untitled"}</h1>
                {frontmatter?.summary ? <p>{frontmatter.summary}</p> : null}
                
                <MDXRemote 
                    {...mdxSource}
                    components={MDXComponents} // Use the centralized component map
                />
            </div>
        </>
    );
}