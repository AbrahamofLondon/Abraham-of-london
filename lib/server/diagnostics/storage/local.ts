/* lib/server/diagnostics/storage/local.ts */
import "server-only";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import type {
  DiagnosticStorageAdapter,
  DiagnosticStoredObject,
  PutStoredObjectInput,
  SignedObjectUrlResult,
} from "@/lib/server/diagnostics/storage/types";

function getBaseDir(): string {
  return path.join(process.cwd(), ".runtime", "diagnostic-artifacts");
}

function resolvePath(objectKey: string): string {
  const safeKey = String(objectKey || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.\.+/g, "_");
  return path.join(getBaseDir(), safeKey);
}

export class LocalDiagnosticStorageAdapter implements DiagnosticStorageAdapter {
  provider = "local" as const;

  async putObject(input: PutStoredObjectInput): Promise<DiagnosticStoredObject> {
    const filePath = resolvePath(input.objectKey);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, input.body);

    const etag = crypto.createHash("md5").update(input.body).digest("hex");

    return {
      provider: "local",
      objectKey: input.objectKey,
      bucket: null,
      contentType: input.contentType,
      byteLength: input.body.length,
      etag,
      sha256: input.sha256 ?? null,
      fileName: input.fileName ?? null,
    };
  }

  async getObjectBuffer(objectKey: string): Promise<Buffer | null> {
    try {
      const filePath = resolvePath(objectKey);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async deleteObject(objectKey: string): Promise<boolean> {
    try {
      const filePath = resolvePath(objectKey);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedReadUrl(
    _objectKey: string,
    _fileName?: string | null,
  ): Promise<SignedObjectUrlResult | null> {
    return null;
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      const filePath = resolvePath(objectKey);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}