import { redirect } from "next/navigation";

export default function FoundrySecurityRedTeamRedirect() {
  redirect("/admin/intelligence-foundry/chaos");
}
