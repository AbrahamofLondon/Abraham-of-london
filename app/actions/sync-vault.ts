// app/actions/sync-vault.ts
'use server';

import { getPrisma } from "@/lib/prisma.server";
import { getAllPDFItemsNode } from "@/lib/pdf/registry";
import { revalidatePath } from "next/cache";

/**
 * Institutional Sync: Reconciles File System with PostgreSQL
 * - Server-only
 * - Chunked transactions to avoid huge $transaction payloads
 * - Safe classification normalization
 */
export async function syncVaultRegistry() {
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      throw new Error("Database connection unavailable (DATABASE_URL not configured).");
    }

    // 1) Ground truth from FS stats
    const fsItems = await getAllPDFItemsNode({ includeMissing: true });

    console.log(`[SYNC_START]: Processing ${fsItems.length} portfolio items.`);

    // 2) Normalize fields (don’t let bad data poison DB)
    const now = new Date();

    const normalizeClassification = (tier: any): string => {
      const t = String(tier || "restricted").toLowerCase();
      // Map your tiers to DB classification as needed
      if (t === "free" || t === "public") return "public";
      if (t === "member") return "member";
      if (t === "architect") return "architect";
      if (t === "inner-circle") return "inner-circle";
      return "restricted";
    };

    // 3) Chunk upserts to avoid DB limits / huge transactions
    const CHUNK = 50;
    let upserted = 0;

    for (let i = 0; i < fsItems.length; i += CHUNK) {
      const batch = fsItems.slice(i, i + CHUNK);

      const ops = batch.map((item: any) =>
        prisma.contentMetadata.upsert({
          where: { slug: String(item.id) },
          update: {
            title: String(item.title || item.id),
            type: String(item.type || "brief"),
            classification: normalizeClassification(item.tier),
            updatedAt: now,
            metadata: JSON.stringify({
              version: String(item.version || "1.0.0"),
              existsOnDisk: Boolean(item.existsOnDisk),
              fileSize: String(item.fileSizeHuman || ""),
              lastModifiedISO: String(item.lastModifiedISO || ""),
              outputPath: String(item.outputPath || item.path || ""),
            }),
          },
          create: {
            slug: String(item.id),
            title: String(item.title || item.id),
            type: String(item.type || "brief"),
            classification: normalizeClassification(item.tier),
            createdAt: now,
            updatedAt: now,
            metadata: JSON.stringify({
              version: String(item.version || "1.0.0"),
              existsOnDisk: Boolean(item.existsOnDisk),
              fileSize: String(item.fileSizeHuman || ""),
              lastModifiedISO: String(item.lastModifiedISO || ""),
              outputPath: String(item.outputPath || item.path || ""),
            }),
          },
        }),
      );

      await prisma.$transaction(ops);
      upserted += batch.length;
      console.log(`[SYNC_PROGRESS]: ${upserted}/${fsItems.length}`);
    }

    revalidatePath("/dashboard");
    return { success: true, count: fsItems.length };
  } catch (error: any) {
    console.error("[SYNC_CRITICAL_FAILURE]:", error);
    return { success: false, error: error?.message || String(error) };
  }
}