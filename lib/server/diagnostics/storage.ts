/* lib/server/diagnostics/storage.ts */
/* Pages-router safe diagnostic storage facade */

import type {
  DiagnosticStorageAdapter,
  DiagnosticStoredObject,
  PutStoredObjectInput,
  SignedObjectUrlResult,
} from "@/lib/server/diagnostics/storage/types";

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

let cachedAdapter: DiagnosticStorageAdapter | null = null;

class LocalDiagnosticStorageAdapter implements DiagnosticStorageAdapter {
  provider = "local" as const;

  private getNode() {
    // keep node-only deps out of client bundling
    // eslint-disable-next-line no-eval
    const req = eval("require") as NodeRequire;
    return {
      fs: req("fs") as typeof import("fs"),
      path: req("path") as typeof import("path"),
    };
  }

  private rootDir(): string {
    const { path } = this.getNode();
    return path.join(process.cwd(), "var", "diagnostic-artifacts", "objects");
  }

  private resolvePath(objectKey: string): string {
    const { path } = this.getNode();
    const normalized = String(objectKey || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\.\./g, "");
    return path.join(this.rootDir(), normalized);
  }

  async putObject(input: PutStoredObjectInput): Promise<DiagnosticStoredObject> {
    const { fs, path } = this.getNode();
    const fullPath = this.resolvePath(input.objectKey);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, input.body);

    return {
      provider: "local",
      objectKey: input.objectKey,
      bucket: null,
      contentType: input.contentType,
      byteLength: input.body.length,
      etag: null,
      sha256: input.sha256 ?? null,
      fileName: input.fileName ?? null,
    };
  }

  async getObjectBuffer(objectKey: string): Promise<Buffer | null> {
    const { fs } = this.getNode();
    const fullPath = this.resolvePath(objectKey);

    try {
      if (!fs.existsSync(fullPath)) return null;
      return fs.readFileSync(fullPath);
    } catch {
      return null;
    }
  }

  async deleteObject(objectKey: string): Promise<boolean> {
    const { fs } = this.getNode();
    const fullPath = this.resolvePath(objectKey);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return true;
    } catch {
      return false;
    }
  }

  async getSignedReadUrl(
    objectKey: string,
    fileName?: string | null,
  ): Promise<SignedObjectUrlResult | null> {
    const base =
      safeString(process.env.NEXT_PUBLIC_SITE_URL) ||
      safeString(process.env.URL) ||
      "https://www.abrahamoflondon.org";

    const expiresInSeconds = Number(process.env.DIAGNOSTIC_SIGNED_URL_TTL_SECONDS || 900);
    const qs = new URLSearchParams({
      objectKey,
      ...(fileName ? { fileName } : {}),
    });

    return {
      url: `${base.replace(/\/+$/, "")}/api/diagnostics/report/object?${qs.toString()}`,
      expiresInSeconds,
    };
  }

  async exists(objectKey: string): Promise<boolean> {
    const { fs } = this.getNode();
    return fs.existsSync(this.resolvePath(objectKey));
  }
}

export function getDiagnosticStorageAdapter(): DiagnosticStorageAdapter {
  if (cachedAdapter) return cachedAdapter;

  const provider = safeString(process.env.DIAGNOSTIC_STORAGE_PROVIDER, "local").toLowerCase();

  if (provider === "s3") {
    try {
      // eslint-disable-next-line no-eval
      const req = eval("require") as NodeRequire;
      const mod = req("@/lib/server/diagnostics/storage/s3") as typeof import("@/lib/server/diagnostics/storage/s3");
      cachedAdapter = new mod.S3DiagnosticStorageAdapter();
      return cachedAdapter;
    } catch (error) {
      console.warn("[diagnostics/storage] Falling back to local adapter because S3 adapter failed.", error);
    }
  }

  cachedAdapter = new LocalDiagnosticStorageAdapter();
  return cachedAdapter;
}

export async function putDiagnosticObject(input: PutStoredObjectInput): Promise<DiagnosticStoredObject> {
  return getDiagnosticStorageAdapter().putObject(input);
}

export async function getDiagnosticObjectBuffer(objectKey: string): Promise<Buffer | null> {
  return getDiagnosticStorageAdapter().getObjectBuffer(objectKey);
}

export async function deleteDiagnosticObject(objectKey: string): Promise<boolean> {
  return getDiagnosticStorageAdapter().deleteObject(objectKey);
}

export async function getDiagnosticSignedReadUrl(
  objectKey: string,
  fileName?: string | null,
): Promise<SignedObjectUrlResult | null> {
  return getDiagnosticStorageAdapter().getSignedReadUrl(objectKey, fileName);
}
