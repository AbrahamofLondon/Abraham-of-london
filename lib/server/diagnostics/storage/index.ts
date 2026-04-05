/* lib/server/diagnostics/storage/index.ts */
import "server-only";

import type { DiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage/types";
import { LocalDiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage/local";
import { S3DiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage/s3";

export function getDiagnosticStorageAdapter(): DiagnosticStorageAdapter {
  const provider = String(process.env.DIAGNOSTIC_STORAGE_PROVIDER || "local")
    .trim()
    .toLowerCase();

  if (provider === "s3") {
    return new S3DiagnosticStorageAdapter();
  }

  return new LocalDiagnosticStorageAdapter();
}