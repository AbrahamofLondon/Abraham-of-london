// app/admin/reporting/executive/[...slug]/page.tsx
// Legacy executive report catch-all route.
// Redirect handling is defined in next.config.mjs.
// This page should never render in normal operation.

export const metadata = {
  robots: "noindex, nofollow",
};

export default function LegacyExecutiveReportCatchAllPage() {
  return null;
}