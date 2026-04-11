import path from "path";
import { prisma } from "@/lib/prisma";
import { putObject } from "@/lib/storage/object-store";

type CreateArtifactManifestInput = {
  artifactId: string;
  subjectEmail: string;
  artifactType: string;
  version?: string | null;
  retentionClass?: string | null;
  mimeType: string;
  filename: string;
  folder: string;
  body: Buffer | string;
  expiresAt?: Date | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isLikelyEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeFolder(folder: string): string {
  return folder
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .trim();
}

function normalizeFilename(filename: string): string {
  return path.basename(filename).trim();
}

function normalizeNullable(value?: string | null): string | null {
  const out = value?.trim();
  return out ? out : null;
}

function assertInput(input: CreateArtifactManifestInput): void {
  if (!input.artifactId?.trim()) {
    throw new Error("artifactId is required.");
  }

  if (!input.artifactType?.trim()) {
    throw new Error("artifactType is required.");
  }

  if (!input.mimeType?.trim()) {
    throw new Error("mimeType is required.");
  }

  if (!input.filename?.trim()) {
    throw new Error("filename is required.");
  }

  if (!input.folder?.trim()) {
    throw new Error("folder is required.");
  }

  const email = normalizeEmail(input.subjectEmail);
  if (!email || !isLikelyEmail(email)) {
    throw new Error("subjectEmail must be a valid email address.");
  }

  if (typeof input.body === "string" && input.body.length === 0) {
    throw new Error("body must not be empty.");
  }

  if (Buffer.isBuffer(input.body) && input.body.byteLength === 0) {
    throw new Error("body must not be empty.");
  }
}

export async function createArtifactManifest(
  input: CreateArtifactManifestInput,
) {
  assertInput(input);

  const normalized = {
    artifactId: input.artifactId.trim(),
    subjectEmail: normalizeEmail(input.subjectEmail),
    artifactType: input.artifactType.trim(),
    version: normalizeNullable(input.version),
    retentionClass: normalizeNullable(input.retentionClass),
    mimeType: input.mimeType.trim(),
    filename: normalizeFilename(input.filename),
    folder: normalizeFolder(input.folder),
    body: input.body,
    expiresAt: input.expiresAt ?? null,
  };

  const stored = await putObject({
    folder: normalized.folder,
    filename: normalized.filename,
    body: normalized.body,
    mimeType: normalized.mimeType,
  });

  try {
    return await prisma.artifactManifest.create({
      data: {
        artifactId: normalized.artifactId,
        subjectEmail: normalized.subjectEmail,
        artifactType: normalized.artifactType,
        version: normalized.version,
        storageDriver: stored.driver,
        storagePath: stored.path,
        checksumSha256: stored.checksumSha256,
        mimeType: stored.mimeType,
        byteSize: stored.byteSize,
        retentionClass: normalized.retentionClass,
        expiresAt: normalized.expiresAt,
      },
    });
  } catch (error) {
    /**
     * If your object store supports deleteObject, this is where you should
     * remove the uploaded blob to avoid orphaned files.
     *
     * Example:
     * await deleteObject({ driver: stored.driver, path: stored.path }).catch(() => {});
     */
    throw error;
  }
}

export async function revokeArtifactManifest(id: string) {
  const manifestId = id?.trim();

  if (!manifestId) {
    throw new Error("Artifact manifest id is required.");
  }

  return prisma.artifactManifest.update({
    where: { id: manifestId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
}