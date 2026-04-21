// RETIRED: patterns extracted to components/admin/charts/EngagementBarChart.tsx,
// DistributionPieChart.tsx, and HealthMetricCard.tsx. Route redirects to /admin.
import type { GetServerSideProps } from "next";
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/admin", permanent: true },
});
export default function Retired() { return null; }
