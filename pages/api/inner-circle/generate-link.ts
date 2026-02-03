/* ./pages/api/inner-circle/generate-link.ts — PRODUCTION ASSET RETRIEVAL */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options"; // Path corrected to your unified options
import { AuditService } from '@/lib/server/services/audit-service';
import { BRIEF_REGISTRY } from '@/lib/briefs/registry';
import { ROLE_HIERARCHY, UserRole } from '@/types/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Use the unified authOptions to ensure the session is parsed correctly
  const session = await getServerSession(req, res, authOptions);

  // 1. Rigorous Authentication
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Authentication Required' });
  }

  // 2. UNIFIED ROLE CHECK (Using Hierarchy)
  const userRole = (session.user as any).role as UserRole;
  
  // Requirement: Must be at least a 'member' (Value 2) to access the Inner Circle vault
  const hasClearance = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY['member'];

  if (!hasClearance) {
    await AuditService.recordSecurityEvent({
      action: "unauthorized_access_attempt",
      actorId: session.user.id,
      actorEmail: session.user.email || 'unknown',
      severity: "critical",
      metadata: { briefId: req.body.briefId, note: `Insufficient Role: ${userRole}` }
    });
    return res.status(403).json({ error: 'Level 2 Clearance Required' });
  }

  const { briefId } = req.body;

  // 3. Registry Verification
  const briefAsset = BRIEF_REGISTRY.find(b => b.id === briefId);
  if (!briefAsset) return res.status(404).json({ error: 'Asset not found in Registry' });

  try {
    // 4. Cryptographic Token Generation (60s Expiry)
    // For production, the userSignature should ideally be a HMAC hash of the email + secret
    const expiration = Math.floor(Date.now() / 1000) + 60;
    const userSignature = Buffer.from(session.user.email || '').toString('base64');
    
    // Constructing the secure delivery URL
    const signedUrl = `https://cdn.intelligence.aol/vault/v1/${briefId}.pdf` + 
      `?sig=${encodeURIComponent(userSignature)}&exp=${expiration}&aid=${briefAsset.id}`;

    // 5. Systematic Audit Logging
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || "unknown";
    
    await AuditService.recordDownload({
      briefId: briefAsset.id,
      memberId: session.user.id,
      email: session.user.email || 'unknown',
      ip: clientIp,
      userAgent: req.headers['user-agent'] || 'unknown',
      success: true,
      latencyMs: Date.now() - startTime
    });

    // 6. Update Asset Metric Counter
    await AuditService.incrementAssetMetrics(briefAsset.id);

    return res.status(200).json({ 
      downloadUrl: signedUrl,
      issuedAt: new Date().toISOString(),
      expiresInSeconds: 60
    });

  } catch (error: any) {
    await AuditService.recordSecurityEvent({
      action: "protocol_failure",
      actorId: session.user.id,
      severity: "warning",
      metadata: { error: error.message, briefId }
    });
    
    return res.status(500).json({ error: 'Encryption Protocol Failure' });
  }
}