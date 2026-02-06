'use server'

import { getDashboardStats, getAllDashboardPDFs } from "@/utils/pdf-stats-converter";

/**
 * This stays 100% on the server. 
 * The browser only receives the raw JSON result.
 */
export async function fetchInstitutionalStats() {
  try {
    const stats = await getDashboardStats();
    const pdfs = await getAllDashboardPDFs();
    
    return {
      stats,
      pdfs,
      success: true
    };
  } catch (error) {
    console.error("Institutional Data Retrieval Failure:", error);
    return { success: false, error: "Access Denied" };
  }
}