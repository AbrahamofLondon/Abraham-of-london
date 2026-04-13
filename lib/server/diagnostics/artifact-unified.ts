import "server-only";

import { upsertArtifactDB, getLatestArtifactDB } from "./artifact-db";
import { upsertArtifactRecord, getLatestArtifact } from "./artifact-registry";

export async function saveArtifactUnified(record: any) {
  try {
    await upsertArtifactDB(record);
  } catch (err) {
    console.warn("DB write failed, falling back to JSON", err);
  }

  return upsertArtifactRecord(record); // always persist fallback
}

export async function getLatestArtifactUnified(diagnosticRef: string) {
  try {
    const db = await getLatestArtifactDB(diagnosticRef);
    if (db) return db;
  } catch {}

  return getLatestArtifact({ diagnosticRef });
}
