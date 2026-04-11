'use server';
export const dynamic = "force-dynamic";

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

  const prisma = getPrisma();
  if (!prisma) {
    throw new Error('Database connection unavailable');
  }

  await prisma.systemAuditLog.create({
    data: {
      action: 'ACCESS_REQUEST',
      severity: 'info',
      resourceId: slug,
      actorEmail: email,

      // Current generated Prisma types expect a string here.
      // This keeps the action compiling and preserves the payload content.
      metadata: JSON.stringify({
        source: 'VaultGuard_UI',
        title,
        slug,
      }),
    },
  });

  const mailResult = await sendAccessRequestEmail(email, title, slug);

  if (mailResult?.success) {
    return {
      message: 'Request received. An advisor will review your session.',
    };
  }

  throw new Error('Connectivity error. Please retry.');
}