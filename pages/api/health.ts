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
} from "contentlayer/generated";
import { siteConfig } from "@/lib/siteConfig";

type HealthResponse = {
  ok: boolean;
  status: "healthy" | "degraded";
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
  res: NextApiResponse<HealthResponse>,
) {
  const now = Date.now();

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

  const status: HealthResponse["status"] = hasCoreContent
    ? "healthy"
    : "degraded";

  const payload: HealthResponse = {
    ok: true,
    status,
    timestamp: new Date(now).toISOString(),
    uptimeSeconds: Math.floor((now - startedAt) / 1000),
    environment: process.env.NODE_ENV || "development",
    siteUrl: siteConfig.siteUrl,
    contentCounts: counts,
  };

  res.setHeader("Content-Type", "application/json");
  // IMPORTANT: matches your uptime workflow expectation
  res.setHeader("Cache-Control", "no-store");

  res.status(200).json(payload);
}