'use server';

import prisma from "@/lib/prisma";
import { getAllPDFItemsNode } from "@/lib/pdf/registry"; // Use the Node-accurate version
import { revalidatePath } from "next/cache";

/**
 * Institutional Sync: Reconciles File System with PostgreSQL
 */
export async function syncVaultRegistry() {
  try {
    // 1. Fetch current ground truth with real FS stats
    const fsItems = await getAllPDFItemsNode({ includeMissing: true });
    
    console.log(`[SYNC_START]: Processing ${fsItems.length} portfolio items.`);

    // 2. Atomic Upsert
    const operations = fsItems.map((item) => 
      prisma.contentMetadata.upsert({
        where: { slug: item.id },
        update: {
          title: item.title,
          type: item.type || 'brief',
          classification: item.tier || 'restricted',
          updatedAt: new Date(),
          // Store actual disk status in metadata
          metadata: JSON.stringify({ 
            version: item.version || '1.0.0',
            existsOnDisk: item.existsOnDisk,
            fileSize: item.fileSizeHuman 
          }),
        },
        create: {
          slug: item.id,
          title: item.title,
          type: item.type || 'brief',
          classification: item.tier || 'restricted',
          metadata: JSON.stringify({ version: item.version || '1.0.0' }),
        },
      })
    );

    await prisma.$transaction(operations);

    revalidatePath('/dashboard');
    return { success: true, count: fsItems.length };
  } catch (error: any) {
    console.error("[SYNC_CRITICAL_FAILURE]:", error);
    return { success: false, error: error.message };
  }
}