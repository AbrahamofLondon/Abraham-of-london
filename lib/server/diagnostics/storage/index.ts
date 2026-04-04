/* lib/server/diagnostics/storage/index.ts */
import "server-only";

import type { DiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage/types";
import { LocalDiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage/local";
import { S3DiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage/s3";

let singleton: DiagnosticStorageAdapter | null = null;

export function getDiagnosticStorageAdapter(): DiagnosticStorageAdapter {
  if (singleton) return singleton;

  const provider = String(process.env.DIAGNOSTIC_STORAGE_PROVIDER || "local")
    .trim()
    .toLowerCase();

  if (provider === "s3") {
    singleton = new S3DiagnosticStorageAdapter();
    return singleton;
  }

  singleton = new LocalDiagnosticStorageAdapter();
  return singleton;
}