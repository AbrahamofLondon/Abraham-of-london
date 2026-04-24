import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAuthorizedAdminSession } from "@/lib/auth/admin-authority";

export async function requireAdminServer() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  if (!isAuthorizedAdminSession(session)) {
    redirect("/auth/access-denied");
  }

  return session;
}
