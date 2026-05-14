import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import AppAdminShell from "@/components/admin/AppAdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminServer();

  return <AppAdminShell>{children}</AppAdminShell>;
}
