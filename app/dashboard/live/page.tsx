// Retired: orphaned dashboard. Redirects to /admin.
import { redirect } from "next/navigation";

export const dynamic = "force-static";

export default function Retired() {
  redirect("/admin");
}
