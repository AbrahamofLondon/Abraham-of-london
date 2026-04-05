import type { NextApiRequest, NextApiResponse } from "next";
import { getPublicationBySlug } from "@/lib/editorial/catalogue";

type CitationResponse =
  | {
      ok: true;
      citation: {
        title: string;
        author: string;
        publisher: string;
        year: string;
        canonicalUrl: string;
        doi?: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CitationResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  const slug =
    typeof req.query.slug === "string"
      ? req.query.slug.trim()
      : Array.isArray(req.query.slug)
        ? String(req.query.slug[0] || "").trim()
        : "";

  if (!slug) {
    return res.status(400).json({
      ok: false,
      error: "Missing slug",
    });
  }

  const item = getPublicationBySlug(slug);

  if (!item) {
    return res.status(404).json({
      ok: false,
      error: "Not found",
    });
  }

  return res.status(200).json({
    ok: true,
    citation: {
      title: item.citation.citationTitle,
      author: item.citation.citationAuthor,
      publisher: item.citation.citationPublisher,
      year: item.citation.citationYear,
      canonicalUrl: item.citation.canonicalUrl,
      doi: item.citation.doi,
    },
  });
}