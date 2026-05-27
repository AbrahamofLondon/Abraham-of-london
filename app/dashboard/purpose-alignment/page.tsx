import { redirect } from "next/navigation";

/**
 * RETIRED: Purpose alignment dashboard migrated to /diagnostics/purpose-alignment.
 * This route permanently redirects.
 */
export const dynamic = "force-static";

export default function DeprecatedPurposeAlignmentDashboard() {
  redirect("/diagnostics/purpose-alignment");
}
