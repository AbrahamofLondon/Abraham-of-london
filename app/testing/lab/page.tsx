/* app/testing/lab/page.tsx — RETIRED: redirect to Intelligence Foundry */
import { redirect } from "next/navigation";

export const dynamic = "force-static";

export default function LabPage() {
  redirect("/admin/intelligence-foundry");
}
