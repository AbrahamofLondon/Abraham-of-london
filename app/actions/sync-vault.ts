'use server';

import prisma from "@/lib/prisma";
import { getAllPDFItems } from "@/lib/pdf/registry";
import { revalidatePath } from "next/cache";

/**
 * Institutional Sync: Reconciles File System with PostgreSQL
 */
export async function syncVaultRegistry() {
  try {
    // 1. Fetch current ground truth from the File System
    const fsItems = getAllPDFItems({ includeMissing: true });
    
    console.log(`[SYNC_START]: Processing ${fsItems.length} portfolio items.`);

    // 2. Atomic Upsert: Update metadata for every brief
    // We use a transaction to ensure database integrity
    const operations = fsItems.map((item) => 
      prisma.contentMetadata.upsert({
        where: { slug: item.id },
        update: {
          title: item.title,
          type: item.type || 'brief',
          classification: item.tier || 'restricted',
          updatedAt: new Date(),
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

    // 3. Clear Next.js Cache for the Dashboard
    revalidatePath('/api/stats');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      count: fsItems.length,
      timestamp: new Date().toISOString() 
    };
  } catch (error: any) {
    console.error("[SYNC_CRITICAL_FAILURE]:", error);
    return { success: false, error: error.message };
  }
}