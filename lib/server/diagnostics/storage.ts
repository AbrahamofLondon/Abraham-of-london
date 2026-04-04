// lib/server/diagnostics/storage.ts
import "server-only";
import fs from "fs/promises";
import path from "path";

function rootDir() {
  return path.resolve(process.cwd(), process.env.DIAGNOSTIC_STORAGE_ROOT || "./private/diagnostics");
}

export async function ensureStorageRoot() {
  await fs.mkdir(rootDir(), { recursive: true });
}

export async function writeArtifactObject(args: {
  objectKey: string;
  buffer: Buffer;
}) {
  await ensureStorageRoot();
  const target = path.join(rootDir(), args.objectKey);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, args.buffer);
  return target;
}

export async function readArtifactObject(objectKey: string) {
  const target = path.join(rootDir(), objectKey);
  return fs.readFile(target);
}