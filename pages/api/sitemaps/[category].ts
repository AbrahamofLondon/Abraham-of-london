import { NextApiRequest, NextApiResponse } from "next";
import { allShorts, allCanons, allBooks } from "contentlayer/generated";
import { generateSitemapXml } from "@/lib/sitemap-utils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { category } = req.query;

  let docs: any[] = [];
  let pathPrefix = "";

  switch (category) {
    case "blog-sitemap": // Intelligence Briefs
      docs = allShorts;
      pathPrefix = "/shorts";
      break;
    case "canons-sitemap":
      docs = allCanons;
      pathPrefix = "/canon";
      break;
    case "books-sitemap":
      docs = allBooks;
      pathPrefix = "/books";
      break;
    default:
      return res.status(404).end();
  }

  const sitemap = generateSitemapXml(
    docs.map((d) => ({
      loc: `${pathPrefix}/${d.slug || d._raw.flattenedPath.split("/").pop()}`,
      lastmod: d.date || new Date().toISOString(),
    }))
  );

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();
}