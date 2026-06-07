// app/api/enterprise/enquiry/route.ts
//
// Enterprise enquiry submission endpoint.
// Captures the decision context, pressure, and preferred route
// from a buyer who is not yet ready to scan.
//
// POSTs to internal notification + admin audit log.
// No CRM sync unless explicitly enabled.
// No payment. No entitlement check. This is a pre-commercial handshake.

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email/core/sendEmail'
import { writeSecurityAudit } from '@/lib/security/audit-log'

const ADMIN_EMAIL = process.env.CONTACT_RECEIVER_EMAIL?.trim() || 'admin@abrahamoflondon.org'
const NOTIFY_CC = 'seunadaramola@gmail.com'

const PREFERRED_ROUTES = [
  'enterprise_decision_scan',
  'boardroom_brief',
  'executive_reporting',
  'strategy_room',
  'team_assessment',
  'retainer_review',
  'unsure',
] as const

const EnterpriseEnquirySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  role: z.string().min(2).max(100).trim(),
  organisation: z.string().min(2).max(200).trim(),
  decisionPressure: z.string().min(20).max(2000).trim(),
  deadline: z.string().max(100).optional(),
  estimatedExposure: z.string().max(100).optional(),
  preferredRoute: z.enum(PREFERRED_ROUTES).default('unsure'),
  consentToContact: z.literal(true, { errorMap: () => ({ message: 'Consent to contact is required' }) }),
  honeypot: z.string().max(0, 'Bot detected').optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = EnterpriseEnquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Persist to audit log
  try {
    await writeSecurityAudit({
      action: 'enterprise_enquiry_received',
      severity: 'info',
      status: 'SUCCESS',
      category: 'commercial',
      resourceId: data.email,
      metadata: {
        name: data.name,
        role: data.role,
        organisation: data.organisation,
        preferredRoute: data.preferredRoute,
        deadline: data.deadline,
        estimatedExposure: data.estimatedExposure,
        // Do not log full decisionPressure text — may contain sensitive detail
        pressureLength: data.decisionPressure.length,
      },
    })
  } catch {
    // Non-fatal — continue with email
  }

  // Send admin notification
  try {
    await sendEmail({
      type: 'ENTERPRISE',
      to: ADMIN_EMAIL,
      cc: NOTIFY_CC,
      subject: `Enterprise enquiry — ${data.organisation} (${data.role})`,
      text: [
        `New enterprise enquiry received`,
        ``,
        `Name:           ${data.name}`,
        `Email:          ${data.email}`,
        `Role:           ${data.role}`,
        `Organisation:   ${data.organisation}`,
        `Preferred route: ${data.preferredRoute}`,
        `Deadline:       ${data.deadline ?? 'not stated'}`,
        `Exposure:       ${data.estimatedExposure ?? 'not stated'}`,
        ``,
        `Decision pressure:`,
        data.decisionPressure,
        ``,
        `Submitted at: ${new Date().toISOString()}`,
      ].join('\n'),
    })
  } catch {
    // Non-fatal — audit log already written
  }

  return NextResponse.json({
    ok: true,
    message: 'Your enquiry has been received. We will assess the appropriate route and respond within one business day.',
    submittedAt: new Date().toISOString(),
  }, { status: 201 })
}
