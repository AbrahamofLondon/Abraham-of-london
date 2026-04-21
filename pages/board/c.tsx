// RETIRED: system metric patterns extracted to components/admin/charts/HealthMetricCard.tsx.
// Route redirects to /admin.
import type { GetServerSideProps } from "next";
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/admin", permanent: true },
});
export default function Retired() { return null; }
