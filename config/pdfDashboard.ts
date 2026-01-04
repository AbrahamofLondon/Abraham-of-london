// config/pdfDashboard.ts
export const PDF_DASHBOARD_CONFIG = {
  pagination: {
    pageSize: 10,
    infiniteScroll: false,
  },
  refresh: {
    autoRefreshInterval: 30000, // 30 seconds
    enabled: false,
  },
  features: {
    bulkActions: true,
    search: true,
    filtering: true,
    sorting: true,
    preview: true,
  },
  api: {
    timeout: 30000,
    retries: 3,
  },
} as const;