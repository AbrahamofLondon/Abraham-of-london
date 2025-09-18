// pages/api/og.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { readFile } from "fs/promises";
import { join } from "path";

const WIDTH = 1200;
const HEIGHT = 630;
const brand = { forest: "#0b2e1f", cream: "#f5f5f0" };

async function loadFont(name: "Inter-Regular" | "Inter-Bold") {
  const path = join(process.cwd(), "public", "fonts", `${name}.ttf`);
  return readFile(path);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const title = (req.query.title as string) || "Abraham of London";
  try {
    const [regular, bold] = await Promise.all([
      loadFont("Inter-Regular"),
      loadFont("Inter-Bold"),
    ]);

    const svg = await satori(
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: brand.forest,
          color: brand.cream,
          padding: "64px",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.9 }}>Abraham of London</div>
        <div style={{ fontSize: 80, lineHeight: 1.05, fontWeight: 700, maxWidth: 980 }}>
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, opacity: 0.9 }}>Principled Strategy • Enduring Standards</div>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              backgroundColor: brand.cream,
              color: brand.forest,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
            }}
          >
            A
          </div>
        </div>
      </div>,
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
          { name: "Inter", data: regular, weight: 400, style: "normal" },
          { name: "Inter", data: bold, weight: 700, style: "normal" },
        ],
      }
    );

    const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).send(Buffer.from(png));
  } catch {
    // Fallback to static OG image if fonts missing or render fails
    res.setHeader("Location", "/assets/images/social/og-image.jpg");
    return res.status(302).end();
  }
}

export const config = {
  api: { bodyParser: false },
};
