import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { getLinkedInPublishingCredential } from "@/lib/outbound/linkedin-oauth";

const LINKEDIN_ORG_ACLS_URL =
  "https://api.linkedin.com/rest/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED";

type LinkedInOrgAclResponse = {
  elements?: Array<{
    organizationalTarget?: string;
    role?: string;
    state?: string;
    organization?: string;
    localizedName?: string;
  }>;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const credential = await getLinkedInPublishingCredential("member");
  if (!credential) {
    return res.status(400).json({
      ok: false,
      error: "LinkedIn connection is not active.",
    });
  }

  if (!credential.scope.split(" ").includes("r_organization_social")) {
    return res.status(403).json({
      ok: false,
      error: "LinkedIn app does not currently have organisation-read permission or the account lacks approved API access.",
      code: "LINKEDIN_ORG_READ_SCOPE_MISSING",
    });
  }

  const response = await fetch(LINKEDIN_ORG_ACLS_URL, {
    headers: {
      Authorization: `Bearer ${credential.accessToken}`,
      "LinkedIn-Version": "202504",
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (response.status === 403) {
    return res.status(403).json({
      ok: false,
      error: "LinkedIn app does not currently have organisation-read permission or the account lacks approved API access.",
      code: "LINKEDIN_ORG_ACCESS_NOT_APPROVED",
    });
  }

  if (!response.ok) {
    return res.status(response.status).json({
      ok: false,
      error: `LinkedIn organisation discovery failed with status ${response.status}.`,
      code: "LINKEDIN_ORG_DISCOVERY_FAILED",
    });
  }

  const data = (await response.json()) as LinkedInOrgAclResponse;
  const organizations = (data.elements || []).map((element) => ({
    organizationUrn: element.organizationalTarget || element.organization || null,
    localizedName: element.localizedName || null,
    role: element.role || null,
    status: element.state || null,
  })).filter((item) => item.organizationUrn);

  return res.status(200).json({ ok: true, organizations });
}
