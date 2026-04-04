// lib/content/api-payload.ts
import type { NextApiResponse } from "next";
import { gzipSync } from "zlib";

export type CompressedBodyCodeMeta = {
  compressed: true;
  encoding: "gzip-base64";
};

export function compressBodyCode(content: string): string {
  return gzipSync(Buffer.from(content || "", "utf8")).toString("base64");
}

export function sendCompressedBodyCode<T extends Record<string, unknown>>(
  res: NextApiResponse,
  payload: T & { bodyCode: string },
  status = 200,
) {
  return res.status(status).json({
    ...payload,
    bodyCode: compressBodyCode(payload.bodyCode || ""),
    compressed: true,
    encoding: "gzip-base64",
  });
}