// pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  allCanons,
} from "@/lib/contentlayer-helper";
import { siteConfig } from "@/lib/siteConfig";

type HealthStatus = "healthy" | "degraded";

type HealthResponse = {
  ok: boolean;
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
  environment: "development" | "production" | "test" | string;
  siteUrl: string;
  contentCounts: {
    posts: number;
    books: number;
    downloads: number;
    events: number;
    prints: number;
    strategies: number;
    resources: number;
    canons: number;
  };
};

const startedAt = Date.now();

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  // Allow only GET / HEAD
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  const now = Date.now();

  try {
    // Contentlayer helper already guarantees [] if not loaded
    const counts = {
      posts: allPosts.length,
      books: allBooks.length,
      downloads: allDownloads.length,
      events: allEvents.length,
      prints: allPrints.length,
      strategies: allStrategies.length,
      resources: allResources.length,
      canons: allCanons.length,
    };

    const hasCoreContent =
      counts.posts > 0 ||
      counts.books > 0 ||
      counts.canons > 0 ||
      counts.resources > 0;

    const status: HealthStatus = hasCoreContent ? "healthy" : "degraded";

    const payload: HealthResponse = {
      ok: true,
      status,
      timestamp: new Date(now).toISOString(),
      uptimeSeconds: Math.floor((now - startedAt) / 1000),
      environment: process.env.NODE_ENV || "development",
      siteUrl: siteConfig.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "",
      contentCounts: counts,
    };

    // HEAD: just headers, no body
    if (req.method === "HEAD") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).end();
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (error) {
    // Fail safe: degraded, zero counts, ok=false but still typed
    const fallback: HealthResponse = {
      ok: false,
      status: "degraded",
      timestamp: new Date(now).toISOString(),
      uptimeSeconds: Math.floor((now - startedAt) / 1000),
      environment: process.env.NODE_ENV || "development",
      siteUrl: siteConfig.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "",
      contentCounts: {
        posts: 0,
        books: 0,
        downloads: 0,
        events: 0,
        prints: 0,
        strategies: 0,
        resources: 0,
        canons: 0,
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json(fallback);
  }
}