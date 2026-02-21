// lib/og.tsx
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { getAllContentlayerDocs, getDocBySlug } from "@/lib/content/server";
import { getDocKind } from "@/lib/content/shared";

export const runtime = "edge";

type OgOptions = {
  title?: string;
  description?: string;
  type?: string;
};

function normalizeOgText(input: unknown, fallback = ""): string {
  if (typeof input !== "string") return fallback;
  const t = input.trim();
  return t.length ? t : fallback;
}

function OgFrame(props: { title: string; description?: string; footer?: string }) {
  const { title, description, footer } = props;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        color: "white",
        padding: "60px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", marginBottom: "40px" }}>
        <div style={{ fontSize: "72px", fontWeight: 800 }}>Sovereign</div>
      </div>

      <div
        style={{
          fontSize: "48px",
          fontWeight: 800,
          textAlign: "center",
          marginBottom: description ? "20px" : "0px",
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>

      {description ? (
        <div style={{ fontSize: "28px", textAlign: "center", opacity: 0.82, lineHeight: 1.25 }}>
          {description}
        </div>
      ) : null}

      {footer ? (
        <div style={{ position: "absolute", bottom: "40px", right: "40px", fontSize: "24px", opacity: 0.9 }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export async function generateDocumentOgImage(slug: string, options?: OgOptions): Promise<ImageResponse> {
  let doc: any = null;

  try {
    doc = getDocBySlug(slug);
  } catch {
    doc = null;
  }

  const title = normalizeOgText(options?.title ?? doc?.title, "Untitled");
  const description = normalizeOgText(options?.description ?? doc?.description ?? doc?.excerpt, "");
  const type = normalizeOgText(options?.type ?? (doc ? getDocKind(doc) : "document"), "document");

  return new ImageResponse(
    <OgFrame title={title} description={description || undefined} footer={type} />,
    { width: 1200, height: 630 }
  );
}

export async function generateIndexOgImage(): Promise<ImageResponse> {
  return new ImageResponse(
    <OgFrame
      title="Institutional Intelligence Platform"
      description="Strategic insights for frontier markets and institutional resilience"
    />,
    { width: 1200, height: 630 }
  );
}

// Route handler (App Router style). If you're using Pages Router API routes,
// don't import this file directly as an API handler.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const slug = normalizeOgText(searchParams.get("slug"), "");
  const title = normalizeOgText(searchParams.get("title"), "");
  const description = normalizeOgText(searchParams.get("description"), "");
  const type = normalizeOgText(searchParams.get("type"), "");

  try {
    if (slug) {
      return await generateDocumentOgImage(slug, {
        title: title || undefined,
        description: description || undefined,
        type: type || undefined,
      });
    }

    return await generateIndexOgImage();
  } catch (err) {
    console.error("Error generating OG image:", err);

    return new ImageResponse(<OgFrame title="Sovereign OS" />, { width: 1200, height: 630 });
  }
}

export function getAllOgImageUrls(): string[] {
  const docs: any[] = getAllContentlayerDocs();

  return docs
    .filter((doc) => getDocKind(doc) !== "short")
    .map((doc) => {
      const slug = (doc?.slug ?? doc?._raw?.flattenedPath ?? "").toString();
      return `/api/og?slug=${encodeURIComponent(slug)}`;
    });
}