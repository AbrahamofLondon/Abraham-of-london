'use server';

/**
 * Institutional Action: Fetches unified analytics for the portfolio.
 * Uses dynamic imports to ensure fs-related code only runs in a Node environment.
 */
export async function getInstitutionalAnalytics() {
  try {
    const { getAllDashboardPDFs, getDashboardStats } = await import("@/utils/pdf-stats-converter");
    
    // Execute data gathering
    const rawPdfs = getAllDashboardPDFs();
    const stats = await getDashboardStats();

    return {
      success: true,
      data: {
        // Deep clone to ensure plain objects are passed to the client
        rawPdfs: JSON.parse(JSON.stringify(rawPdfs)),
        stats: JSON.parse(JSON.stringify(stats)),
      },
    };
  } catch (error) {
    console.error("[INSTITUTIONAL_ANALYTICS_ERROR]:", error);
    return {
      success: false,
      error: "Internal server error occurred while reading PDF registry.",
    };
  }
}