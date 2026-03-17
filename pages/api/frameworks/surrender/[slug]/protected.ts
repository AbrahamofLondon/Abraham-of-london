// pages/api/frameworks/surrender/[slug]/protected.ts
// Protected framework retrieval endpoint using canonical Inner Circle middleware.

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

import { withInnerCircleAccess } from "@/lib/server/with-inner-circle-access";

type ProtectedRequest = NextApiRequest & {
  innerCircleAccess?: {
    hasAccess: boolean;
    tier: string;
    userId: string | null;
    sessionId: string | null;
  };
};

type FrameworkPayload = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  category?: string | null;
  version?: string | null;
  status?: string | null;
  author?: string | null;
  date?: string | null;
  tier?: string | null;
  tags: string[];
  content: string;
  sourcePath: string;
};

type SuccessResponse = {
  success: true;
  framework: FrameworkPayload;
  access: {
    tier: string;
    userId: string | null;
    sessionId: string | null;
  };
  retrievedAt: string;
};

type ErrorResponse = {
  success: false;
  error: string;
  code:
    | "METHOD_NOT_ALLOWED"
    | "INVALID_SLUG"
    | "NOT_FOUND"
    | "READ_FAILED";
};

type ApiResponse = SuccessResponse | ErrorResponse;

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeNullableStr(value: unknown): string | null {
  const s = safeStr(value);
  return s || null;
}

function safeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((x) => x.trim()).filter(Boolean);
}

function firstQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return safeStr(value[0]);
  return safeStr(value);
}

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/i.test(slug) && !slug.includes("..");
}

function abs(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function candidatePaths(slug: string): string[] {
  const normalized = slug.replace(/^\/+|\/+$/g, "");

  return [
    abs(`content/resources/surrender-framework/${normalized}.mdx`),
    abs(`content/resources/surrender-framework/${normalized}.md`),
    abs(`content/frameworks/surrender/${normalized}.mdx`),
    abs(`content/frameworks/surrender/${normalized}.md`),
    abs(`content/surrender/${normalized}.mdx`),
    abs(`content/surrender/${normalized}.md`),
  ];
}

function resolveFrameworkFile(slug: string): string | null {
  for (const filePath of candidatePaths(slug)) {
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

function buildFrameworkPayload(filePath: string, slug: string): FrameworkPayload {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const content = parsed.content.trim();

  return {
    slug,
    title: safeStr(data.title) || slug,
    subtitle: safeNullableStr(data.subtitle),
    description: safeNullableStr(data.description),
    excerpt: safeNullableStr(data.excerpt),
    category: safeNullableStr(data.category),
    version: safeNullableStr(data.version),
    status: safeNullableStr(data.status),
    author: safeNullableStr(data.author),
    date: safeNullableStr(data.date),
    tier: safeNullableStr(data.tier),
    tags: safeTags(data.tags),
    content,
    sourcePath: path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
  };
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const slug = firstQueryValue(req.query.slug);

  if (!slug || !isSafeSlug(slug)) {
    return res.status(400).json({
      success: false,
      error: "A valid framework slug is required",
      code: "INVALID_SLUG",
    });
  }

  const filePath = resolveFrameworkFile(slug);

  if (!filePath) {
    return res.status(404).json({
      success: false,
      error: "Protected framework not found",
      code: "NOT_FOUND",
    });
  }

  try {
    const framework = buildFrameworkPayload(filePath, slug);
    const access = (req as ProtectedRequest).innerCircleAccess;

    return res.status(200).json({
      success: true,
      framework,
      access: {
        tier: access?.tier ?? "public",
        userId: access?.userId ?? null,
        sessionId: access?.sessionId ?? null,
      },
      retrievedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SURRENDER_FRAMEWORK_PROTECTED_READ_ERROR]", error);

    return res.status(500).json({
      success: false,
      error: "Failed to read protected framework",
      code: "READ_FAILED",
    });
  }
}

export default withInnerCircleAccess(handler, {
  requireAuth: true,
  requiredTier: "inner-circle",
});