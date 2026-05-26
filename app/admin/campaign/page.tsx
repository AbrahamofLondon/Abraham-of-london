import { redirect } from "next/navigation";

export default function AdminCampaignRedirect() {
  redirect("/admin/campaigns");
}
