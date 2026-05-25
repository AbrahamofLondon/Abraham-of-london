// app/admin/intelligence-foundry/layout.tsx
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intelligence Foundry | Abraham of London" };

export default async function IntelligenceFoundryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminServer();
  return <>{children}</>;
}
