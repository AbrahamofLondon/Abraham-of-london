/* lib/server/diagnostics/storage */
import "server-only";

import fs from "fs";
import path from "path";

import type {
  DiagnosticStorageAdapter,
  DiagnosticStoredObject,
  PutStoredObjectInput,
  SignedObjectUrlResult,
} from "@/lib/server/diagnostics/storage/types";

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function getRoot(): string {
  const root =
    process.env.DIAGNOSTIC_LOCAL_STORAGE_DIR?.trim() ||
    path.join(process.cwd(), "var", "diagnostic-artifacts");
  ensureDir(root);
  return root;
}

function safeJoinFromKey(objectKey: string): string {
  const normalized = String(objectKey || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .trim();

  return path.join(getRoot(), normalized);
}

export class LocalDiagnosticStorageAdapter implements DiagnosticStorageAdapter {
  provider = "local" as const;

  async putObject(input: PutStoredObjectInput): Promise<DiagnosticStoredObject> {
    const abs = safeJoinFromKey(input.objectKey);
    ensureDir(path.dirname(abs));
    await fs.promises.writeFile(abs, input.body);

    return {
      provider: "local",
      objectKey: input.objectKey,
      contentType: input.contentType,
      byteLength: input.body.length,
      fileName: input.fileName ?? null,
      sha256: input.sha256 ?? null,
      etag: null,
      bucket: null,
    };
  }

  async getObjectBuffer(objectKey: string): Promise<Buffer | null> {
    try {
      const abs = safeJoinFromKey(objectKey);
      return await fs.promises.readFile(abs);
    } catch {
      return null;
    }
  }

  async deleteObject(objectKey: string): Promise<boolean> {
    try {
      const abs = safeJoinFromKey(objectKey);
      await fs.promises.unlink(abs);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedReadUrl(_objectKey: string, _fileName?: string | null): Promise<SignedObjectUrlResult | null> {
    return null;
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      const abs = safeJoinFromKey(objectKey);
      await fs.promises.access(abs, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}