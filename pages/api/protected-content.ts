import type { NextApiRequest, NextApiResponse } from "next";
import { withInnerCircleAccess } from "@/lib/server/with-inner-circle-access";

type ProtectedContentResponse = {
  success: boolean;
  data?: {
    message: string;
    protectedContent: Array<{
      id: number;
      title: string;
      content: string;
    }>;
    accessedAt: string;
    accessedBy: string | null;
    sessionId: string | null;
    tier: string;
  };
  error?: string;
  message?: string;
};

const protectedContentHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<ProtectedContentResponse>,
) => {
  const access = (req as NextApiRequest & {
    innerCircleAccess?: {
      hasAccess: boolean;
      tier: string;
      userId: string | null;
      sessionId: string | null;
    };
  }).innerCircleAccess;

  return res.status(200).json({
    success: true,
    data: {
      message: "Welcome to the Inner Circle",
      protectedContent: [
        { id: 1, title: "Exclusive Strategy", content: "..." },
        { id: 2, title: "Private Analysis", content: "..." },
        { id: 3, title: "Member-only Resources", content: "..." },
      ],
      accessedAt: new Date().toISOString(),
      accessedBy: access?.userId ?? null,
      sessionId: access?.sessionId ?? null,
      tier: access?.tier ?? "public",
    },
  });
};

export default withInnerCircleAccess(protectedContentHandler, {
  requireAuth: true,
});