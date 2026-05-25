// app/admin/research/page.tsx — redirect to Intelligence Foundry
import { redirect } from "next/navigation";

export default function AdminResearchPage() {
  redirect("/admin/intelligence-foundry");
}
