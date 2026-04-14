// lib/contentlayer-helper.server.ts — server alias (Pages Router safe)
//
// Previously: `export * from "@/lib/content"`. That wildcard re-export was
// a dispatch hub into the heavy Contentlayer graph — anything importing
// from this file would drag the entire content facade into its chunk.
//
// The file is retained because codemod scripts (scripts/*-contentlayer-*.js)
// list its path in their allow-list. Nothing in pages/components/app
// imports from it, so the wildcard re-export is removed without replacement.
// If any runtime path turns out to need this alias, add a specific named
// lazy getter here rather than restoring `export *`.

export {};
