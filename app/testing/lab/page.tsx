/* app/testing/lab/page.tsx — redirect to Intelligence Foundry */
import { redirect } from "next/navigation";

export default function LabPage() {
  redirect("/admin/intelligence-foundry");
}
