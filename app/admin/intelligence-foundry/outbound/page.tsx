import { redirect } from "next/navigation";

export default function FoundryOutboundRedirect() {
  redirect("/admin/outbound");
}
