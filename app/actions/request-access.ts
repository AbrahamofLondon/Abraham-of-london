'use server';

import { getPrisma } from '@/lib/prisma.server';
import { sendAccessRequestEmail } from '@/lib/mail';

function normalizeEmail(input: unknown): string {
  return String(input ?? '').trim().toLowerCase();
}

function normalizeSlug(input: unknown): string {
  return String(input ?? '').trim();
}

function normalizeTitle(input: unknown): string {
  return String(input ?? '').trim();
}

export async function requestAccessAction(formData: FormData) {
  const email = normalizeEmail(formData.get('email'));
  const slug = normalizeSlug(formData.get('slug'));
  const title = normalizeTitle(formData.get('title'));

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!slug) {
    throw new Error('Missing resource identifier.');
  }

  const prisma = await getPrisma();
  if (!prisma) throw new Error('Database connection unavailable');

  // 1) Audit (schema-aligned: actorEmail + Json metadata)
  await prisma.systemAuditLog.create({
    data: {
      action: 'ACCESS_REQUEST',
      severity: 'info', // AuditSeverity enum value (matches your schema default)
      resourceId: slug,
      actorEmail: email,

      // ✅ metadata is Json? in Prisma, so pass an object (NOT JSON.stringify)
      metadata: {
        source: 'VaultGuard_UI',
        title,
        slug,
      },

      // Optional: capture request headers if you pass them in later.
      // ipAddress: null,
      // userAgent: null,
    },
  });

  // 2) Notification
  const mailResult = await sendAccessRequestEmail(email, title, slug);

  if (mailResult?.success) {
    return { message: 'Request received. An advisor will review your session.' };
  }

  throw new Error('Connectivity error. Please retry.');
}