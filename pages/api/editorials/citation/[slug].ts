// pages/api/editorials/citation/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getPublicationBySlug } from "@/lib/editorial/catalogue";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  const item = getPublicationBySlug(slug);

  if (!item) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.status(200).json({
    title: item.citation.citationTitle,
    author: item.citation.citationAuthor,
    publisher: item.citation.citationPublisher,
    year: item.citation.citationYear,
    canonicalUrl: item.citation.canonicalUrl,
  });
}