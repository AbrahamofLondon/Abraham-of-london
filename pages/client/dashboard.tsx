// Retired: orphaned route with no auth gates. Redirects to /admin.
import type { GetServerSideProps } from "next";
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/admin", permanent: true },
});
export default function Retired() { return null; }
