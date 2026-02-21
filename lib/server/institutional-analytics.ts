// lib/server/institutional-analytics.ts — PAGES ROUTER SAFE (NO "server-only")
/* eslint-disable @typescript-eslint/no-explicit-any */

function ensureNodeOnly(moduleName: string) {
  // Blocks browser bundles + Edge runtime
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  const isEdge = typeof (globalThis as any).EdgeRuntime === "string";
  const isNode = typeof process !== "undefined" && !!(process as any).versions?.node;

  if (isBrowser || isEdge || !isNode) {
    throw new Error(
      `[${moduleName}] is Node-only but was loaded in a non-Node runtime. ` +
        `Do not import it from client components; call via getServerSideProps or an API route.`
    );
  }
}

export async function getInstitutionalAnalyticsServer() {
  ensureNodeOnly("getInstitutionalAnalyticsServer");

  try {
    const { getAllDashboardPDFs, getDashboardStats } = await import("@/utils/pdf-stats-converter");

    const rawPdfs = getAllDashboardPDFs();
    const stats = await getDashboardStats();

    return {
      success: true as const,
      data: {
        rawPdfs: JSON.parse(JSON.stringify(rawPdfs)),
        stats: JSON.parse(JSON.stringify(stats)),
      },
    };
  } catch (error: any) {
    console.error("[INSTITUTIONAL_ANALYTICS_ERROR]:", error);
    return {
      success: false as const,
      error: "Internal server error occurred while reading PDF registry.",
    };
  }
}