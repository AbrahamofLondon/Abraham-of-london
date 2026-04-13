// server-only guard removed — Pages Router incompatible (see Next.js docs)

/* lib/server/diagnostics/artifact-registry.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export type DiagnosticArtifactKind = "pdf";

export type DiagnosticArtifactRecord = {
  artifactId: string;
  diagnosticRef: string;
  reportId: string;
  version: string;
  kind: DiagnosticArtifactKind;
  fileName: string;
  mimeType: string;
  byteLength: number;
  sha256: string;
  storageProvider: "local" | "s3";
  objectKey: string;
  bucket?: string | null;
  etag?: string | null;
  publicPath: string | null;
  createdAt: string;
  createdBy: string | null;
};

type RegistryShape = {
  version: 2;
  updatedAt: string;
  items: DiagnosticArtifactRecord[];
};

const REGISTRY_DIR = path.join(process.cwd(), "var", "diagnostic-artifacts");
const REGISTRY_FILE = path.join(REGISTRY_DIR, "registry.json");

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function nowIso(): string {
  return new Date().toISOString();
}

function jsonSafeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function emptyRegistry(): RegistryShape {
  return {
    version: 2,
    updatedAt: nowIso(),
    items: [],
  };
}

function normalizeRef(v: string): string {
  return String(v || "").trim();
}

function normalizeVersion(v: string): string {
  return String(v || "").trim() || "2026.1";
}

function safeFileSegment(v: string): string {
  return String(v || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readArtifactRegistry(): RegistryShape {
  ensureDir(REGISTRY_DIR);

  if (!fs.existsSync(REGISTRY_FILE)) {
    const seed = emptyRegistry();
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }

  const raw = fs.readFileSync(REGISTRY_FILE, "utf8");
  const parsed = jsonSafeParse<RegistryShape>(raw, emptyRegistry());

  return {
    version: 2,
    updatedAt: parsed.updatedAt || nowIso(),
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

export function writeArtifactRegistry(registry: RegistryShape): void {
  ensureDir(REGISTRY_DIR);

  fs.writeFileSync(
    REGISTRY_FILE,
    JSON.stringify(
      {
        version: 2,
        updatedAt: nowIso(),
        items: Array.isArray(registry.items) ? registry.items : [],
      },
      null,
      2,
    ),
    "utf8",
  );
}

export function createArtifactObjectKey(args: {
  diagnosticRef: string;
  version: string;
  extension: string;
}): {
  objectKey: string;
  fileName: string;
} {
  const ref = safeFileSegment(args.diagnosticRef);
  const version = safeFileSegment(args.version);
  const extension =
    safeFileSegment(args.extension).replace(/^\.+/, "") || "bin";
  const fileName = `${ref}-${version}.${extension}`;

  return {
    objectKey: `diagnostics/${ref}/${version}/${fileName}`,
    fileName,
  };
}

export function buildArtifactRecord(args: {
  diagnosticRef: string;
  reportId: string;
  version: string;
  mimeType: string;
  byteLength: number;
  sha256: string;
  storageProvider: "local" | "s3";
  objectKey: string;
  fileName: string;
  createdBy?: string | null;
  publicPath?: string | null;
  bucket?: string | null;
  etag?: string | null;
}): DiagnosticArtifactRecord {
  return {
    artifactId: `art_${crypto.randomBytes(10).toString("hex")}`,
    diagnosticRef: normalizeRef(args.diagnosticRef),
    reportId: String(args.reportId || "").trim(),
    version: normalizeVersion(args.version),
    kind: "pdf",
    fileName: args.fileName,
    mimeType: args.mimeType,
    byteLength: args.byteLength,
    sha256: args.sha256,
    storageProvider: args.storageProvider,
    objectKey: args.objectKey,
    bucket: args.bucket ?? null,
    etag: args.etag ?? null,
    publicPath: args.publicPath ?? null,
    createdAt: nowIso(),
    createdBy: args.createdBy ?? null,
  };
}

export function upsertArtifactRecord(
  record: DiagnosticArtifactRecord,
): DiagnosticArtifactRecord {
  const registry = readArtifactRegistry();

  registry.items = [
    ...registry.items.filter(
      (item) =>
        !(
          item.diagnosticRef === record.diagnosticRef &&
          item.version === record.version &&
          item.kind === record.kind
        ),
    ),
    record,
  ];

  writeArtifactRegistry(registry);
  return record;
}

export function listArtifactsByDiagnosticRef(
  diagnosticRef: string,
): DiagnosticArtifactRecord[] {
  const ref = normalizeRef(diagnosticRef);

  return readArtifactRegistry()
    .items
    .filter((item) => item.diagnosticRef === ref)
    .sort((a, b) => {
      if (a.version !== b.version) {
        return b.version.localeCompare(a.version, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
}

export function getArtifactByVersion(args: {
  diagnosticRef: string;
  version: string;
  kind?: DiagnosticArtifactKind;
}): DiagnosticArtifactRecord | null {
  const { diagnosticRef, version, kind = "pdf" } = args;
  const ref = normalizeRef(diagnosticRef);
  const ver = normalizeVersion(version);

  return (
    readArtifactRegistry().items.find(
      (item) =>
        item.diagnosticRef === ref &&
        item.version === ver &&
        item.kind === kind,
    ) || null
  );
}

export function getLatestArtifact(args: {
  diagnosticRef: string;
  kind?: DiagnosticArtifactKind;
}): DiagnosticArtifactRecord | null {
  const { diagnosticRef, kind = "pdf" } = args;
  const ref = normalizeRef(diagnosticRef);

  const items = readArtifactRegistry()
    .items
    .filter((item) => item.diagnosticRef === ref && item.kind === kind)
    .sort((a, b) => {
      if (a.version !== b.version) {
        return b.version.localeCompare(a.version, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

  return items[0] || null;
}
