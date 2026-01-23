// pages/api/mdx/serialize.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

type Ok = { ok: true; source: any };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const raw = String(req.body?.raw || "");
    const source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    res.status(200).json({ ok: true, source });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "Serialize failed" });
  }
}