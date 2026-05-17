'use server';

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

  const { getPrisma } = await import('@/lib/prisma.server');
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

  const { sendAccessRequestEmail } = await import('@/lib/mail');
  const mailResult = await sendAccessRequestEmail({ userEmail: email, assetTitle: title, slug });

  if (mailResult?.ok) {
    return {
      message: 'Request received. An advisor will review your session.',
    };
  }

  console.error('[ACCESS_REQUEST_MAIL_FAIL]', mailResult?.error || 'UNKNOWN');
  throw new Error('Connectivity error. Please retry.');
}
