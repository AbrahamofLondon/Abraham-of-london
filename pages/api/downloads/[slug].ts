// pages/api/downloads/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getDownloadBySlug,
  resolveDocDownloadUrl,
  getAccessLevel,
} from "@/lib/contentlayer-helper";

function hasInnerCircleAccess(req: NextApiRequest): boolean {
  const cookie = req.headers.cookie ?? "";
  return cookie.includes("innerCircleAccess=");
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const slug = String(req.query.slug ?? "").toLowerCase();
  if (!slug) return res.status(400).send("Missing slug");

  const doc = getDownloadBySlug(slug);
  if (!doc) return res.status(404).send("Not found");

  const url = resolveDocDownloadUrl(doc);
  if (!url) return res.status(500).send("Missing file");

  const access = getAccessLevel(doc);

  if (access === "public") {
    return res.redirect(302, url);
  }

  if (!hasInnerCircleAccess(req)) {
    return res.redirect(302, "/inner-circle");
  }

  return res.redirect(302, url);
}