import { NextRequest, NextResponse } from "next/server";
import { 
  verifyDownloadToken, 
  incrementTokenUsage, 
  doesTokenMatchBinding 
} from "@/lib/premium/download-token";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
// Import your auth options to get the current user
// import { authOptions } from "@/lib/auth"; 

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("rid") || undefined;

  // 1. Get client metadata for auditing
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  // 2. Identity Binding (Match against session or user)
  // Note: Replace with your actual session retrieval logic
  // const session = await getServerSession(authOptions);
  const userId = null; // session?.user?.id
  const sessionId = req.cookies.get("next-auth.session-token")?.value || null;

  // 3. Verify Token
  const result = await verifyDownloadToken(token, contentId);

  if (!result.valid || !result.payload || !result.token) {
    await logAttempt(token, contentId, userId, sessionId, ip, userAgent, false, 403, result.reason);
    return NextResponse.json({ error: result.reason || "Unauthorized" }, { status: 403 });
  }

  // 4. Check Binding (Security: Prevent token sharing)
  const isMatch = doesTokenMatchBinding(result.payload, { userId, sessionId });
  if (!isMatch) {
    await logAttempt(token, contentId, userId, sessionId, ip, userAgent, false, 403, "Binding mismatch");
    return NextResponse.json({ error: "Token not valid for this session" }, { status: 403 });
  }

  // 5. Increment Usage
  const incremented = await incrementTokenUsage(token);
  if (!incremented) {
    return NextResponse.json({ error: "Failed to process download count" }, { status: 500 });
  }

  // 6. Log Success
  await logAttempt(token, contentId, userId, sessionId, ip, userAgent, true, 200);

  // 7. Stream File
  // In a real scenario, you would fetch the file path from your ContentMetadata
  // or a private bucket using the rid (contentId).
  try {
    const fileUrl = `https://your-private-storage.com/briefs/${result.token.contentId}.pdf`;
    
    // Example: Redirecting to a signed URL or streaming directly
    // return NextResponse.redirect(signedS3Url);
    
    return NextResponse.json({ 
      message: "Download authorized", 
      downloadUrl: fileUrl, // Ideally a short-lived signed URL
      expiresAt: result.token.expiresAt 
    });
  } catch (error) {
    console.error("STREAM_ERROR", error);
    return NextResponse.json({ error: "File delivery failed" }, { status: 500 });
  }
}

/**
 * Helper to log attempts to the PremiumDownloadAttempt table
 */
async function logAttempt(
  token: string,
  contentId: string | undefined,
  userId: string | null,
  sessionId: string | null,
  ip: string,
  ua: string,
  success: boolean,
  statusCode: number,
  reason?: string
) {
  try {
    await prisma.premiumDownloadAttempt.create({
      data: {
        tokenId: token.split(".")[1] ? token : undefined, // Store raw or extract tid
        contentId: contentId || "unknown",
        userId,
        sessionId,
        ipAddress: ip,
        userAgent: ua,
        success,
        statusCode,
        reason,
      },
    });
  } catch (e) {
    console.error("AUDIT_LOG_FAILURE", e);
  }
}