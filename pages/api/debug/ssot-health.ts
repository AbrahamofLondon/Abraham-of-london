// pages/api/debug/ssot-health.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAllContentlayerDocs,
  getAllPosts,
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllShorts,
  getAllStrategies,
  getAllLexicons,
  getPublishedDocuments,
} from "@/lib/content/server";

function sample(list: any[], n = 3) {
  return (list || []).slice(0, n).map((d: any) => ({
    slug: d?.slug ?? d?._raw?.flattenedPath ?? null,
    title: d?.title ?? null,
    type: d?.type ?? d?.kind ?? null,
  }));
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const all = getAllContentlayerDocs() || [];
    const posts = getAllPosts() || [];
    const books = getAllBooks() || [];
    const canons = getAllCanons() || [];
    const downloads = getAllDownloads() || [];
    const events = getAllEvents() || [];
    const prints = getAllPrints() || [];
    const resources = getAllResources() || [];
    const shorts = getAllShorts() || [];
    const strategies = getAllStrategies() || [];
    const lexicons = getAllLexicons() || [];
    const combined = getPublishedDocuments() || [];

    return res.status(200).json({
      ok: true,
      counts: {
        all: all.length,
        combined: combined.length,
        posts: posts.length,
        books: books.length,
        canons: canons.length,
        downloads: downloads.length,
        events: events.length,
        prints: prints.length,
        resources: resources.length,
        shorts: shorts.length,
        strategies: strategies.length,
        lexicons: lexicons.length,
      },
      sample: {
        posts: sample(posts),
        books: sample(books),
        canons: sample(canons),
        downloads: sample(downloads),
        resources: sample(resources),
        shorts: sample(shorts),
        strategies: sample(strategies),
        lexicons: sample(lexicons),
      },
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}