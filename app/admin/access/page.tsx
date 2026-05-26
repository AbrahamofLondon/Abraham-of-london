import { redirect } from "next/navigation";

export default function AdminAccessRedirect() {
  redirect("/admin/access-keys");
}
