/* lib/artifacts/manifest.ts */

import { prisma } from "@/lib/prisma";
import { putObject } from "@/lib/storage/object-store";

export async function createArtifactManifest(input: {
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
}) {
  const stored = await putObject({
    folder: input.folder,
    filename: input.filename,
    body: input.body,
    mimeType: input.mimeType,
  });

  return prisma.artifactManifest.create({
    data: {
      artifactId: input.artifactId,
      subjectEmail: input.subjectEmail.toLowerCase(),
      artifactType: input.artifactType,
      version: input.version ?? null,
      storageDriver: stored.driver,
      storagePath: stored.path,
      checksumSha256: stored.checksumSha256,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
      retentionClass: input.retentionClass ?? null,
      expiresAt: input.expiresAt ?? null,
    },
  });
}

export async function revokeArtifactManifest(id: string) {
  return prisma.artifactManifest.update({
    where: { id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
}