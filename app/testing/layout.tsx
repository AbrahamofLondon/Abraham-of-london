import { requireAdminServer } from "@/lib/auth/requireAdminServer";

export const dynamic = "force-dynamic";

export default async function TestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminServer();

  return <>{children}</>;
}
