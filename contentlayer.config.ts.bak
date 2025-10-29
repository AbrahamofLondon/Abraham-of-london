import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import remarkGfm from "remark-gfm";
import { visit } from 'unist-util-visit';

// --- Plugin to Convert Relative Paths to Absolute Alias (@) ---
function remarkFixMdxRelativeImports() {
    return (tree) => {
        visit(tree, 'mdxjsEsm', (node) => {
            if (node.value.includes('/components/')) {
                // Regex to find and replace relative path to components with '@/components'
                node.value = node.value.replace(/(\.{2,}\/)+components\//g, '@/components/');
            }
        });
    };
}

// --- REMOVED: DANGEROUS Plugin to Fix Acorn Parsing Errors in Blockquotes ---
// The original logic could lead to data loss. Remove this function.
// function remarkFixAcornBlockquotes() { ... }

// ------------------------------------------------

// All fields common to most content types.
const commonMeta = {
    slug: { type: "string" },
    author: { type: "string" },
    date: { type: "date" },
    excerpt: { type: "string" },
    readTime: { type: "string" },
    category: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    coverImage: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
    description: { type: "string" },
    ogTitle: { type: "string" },
    ogDescription: { type: "string" },
    draft: { type: "boolean" },
    socialCaption: { type: "string" },
};

// ----------------------------------------------------

export const Post = defineDocumentType(() => ({
    name: "Post",
    filePathPattern: "blog/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));

export const Book = defineDocumentType(() => ({
    name: "Book",
    filePathPattern: "books/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));

export const Resource = defineDocumentType(() => ({
    name: "Resource",
    filePathPattern: "resources/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));
export const Strategy = defineDocumentType(() => ({
    name: "Strategy",
    filePathPattern: "strategy/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));
export const Template = defineDocumentType(() => ({
    name: "Template",
    filePathPattern: "templates/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));
export const Guide = defineDocumentType(() => ({
    name: "Guide",
    filePathPattern: "guides/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));
export const Pack = defineDocumentType(() => ({
    name: "Pack",
    filePathPattern: "packs/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));
export const Checklist = defineDocumentType(() => ({
    name: "Checklist",
    filePathPattern: "checklists/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));
export const Brief = defineDocumentType(() => ({
    name: "Brief",
    filePathPattern: "briefs/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));
export const Plan = defineDocumentType(() => ({
    name: "Plan",
    filePathPattern: "plans/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));

export const Download = defineDocumentType(() => ({
    name: "Download",
    filePathPattern: "downloads/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        slug: { type: "string" },
        subtitle: { type: "string" },
        pdfPath: { type: "string" },
        kind: { type: "string" },
        ...commonMeta,
    },
}));

export const Event = defineDocumentType(() => ({
    name: "Event",
    filePathPattern: "events/**/*.mdx",
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        slug: { type: "string" },
        time: { type: "string" },
        summary: { type: "string" },
        heroImage: { type: "string" },
        chatham: { type: "boolean" },
        resources: { type: "json" }, // nested objects/arrays
        location: { type: "string" },
        ...commonMeta,
    },
}));

export const Registry = defineDocumentType(() => ({
    name: "Registry",
    filePathPattern: "_downloads-registry.md",
    contentType: "markdown",
    fields: {
        // No required fields
    },
}));

/**
 * 🆕 ADDED: Definition for the Print document type.
 * This resolves the Contentlayer error when building print-related pages.
 */
export const Print = defineDocumentType(() => ({
    name: "Print",
    filePathPattern: "print/**/*.mdx", // Assuming your print content is in content/print
    contentType: "mdx",
    fields: {
        title: { type: "string" },
        ...commonMeta,
    },
}));

// --- FINAL makeSource CONFIGURATION ---
export default makeSource({
    contentDirPath: "content",
    documentTypes: [
        Post, Book, Resource, Strategy, Download, Event,
        Template, Guide, Pack, Checklist, Brief, Plan, Registry,
        Print // 🥳 INCLUDED THE NEW PRINT DOCUMENT TYPE
    ],
    mdx: {
        // REMARKFIXACORNBLOCKQUOTES REMOVED FROM THIS ARRAY
        remarkPlugins: [remarkGfm, remarkFixMdxRelativeImports],
        rehypePlugins: [],
        esbuildOptions: (opts) => {
            // Broadly exclude all project components/utilities via the alias to prevent bundling issues
            opts.external = [
                ...(opts.external ?? []),
                "next-contentlayer", // Ensure next-contentlayer itself is externally excluded
                "next-contentlayer/*",
                "@/components/*",
                "@/lib/*",
                "@/utils/*",
            ];
            return opts;
        },
        // CORRECTLY PLACED OPTION
        disableImportAliasWarning: true,
    },
});