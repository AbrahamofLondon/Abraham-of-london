/* lib/security/entitlements.ts */

import { prisma } from "@/lib/prisma";

export async function getActiveEntitlementForEmail(opts: {
  email: string;
  productCode?: string | null;
}) {
  const email = opts.email.toLowerCase();

  return prisma.clientEntitlement.findFirst({
    where: {
      email,
      status: "active",
      ...(opts.productCode ? { productCode: opts.productCode } : {}),
      OR: [
        { endsAt: null },
        { endsAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}