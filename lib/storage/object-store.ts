/* lib/storage/object-store.ts */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export type StoredObjectResult = {
  driver: "local";
  path: string;
  checksumSha256: string;
  byteSize: number;
  mimeType: string;
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sha256(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function putObject(input: {
  folder: string;
  filename: string;
  body: Buffer | string;
  mimeType: string;
}): Promise<StoredObjectResult> {
  const root = path.join(process.cwd(), "private_artifacts", input.folder);
  ensureDir(root);

  const buffer = Buffer.isBuffer(input.body) ? input.body : Buffer.from(input.body);
  const filePath = path.join(root, input.filename);

  await fs.promises.writeFile(filePath, buffer);

  return {
    driver: "local",
    path: filePath,
    checksumSha256: sha256(buffer),
    byteSize: buffer.byteLength,
    mimeType: input.mimeType,
  };
}

export async function readObject(storagePath: string): Promise<Buffer> {
  return fs.promises.readFile(storagePath);
}

export async function deleteObject(storagePath: string): Promise<void> {
  if (fs.existsSync(storagePath)) {
    await fs.promises.unlink(storagePath);
  }
}