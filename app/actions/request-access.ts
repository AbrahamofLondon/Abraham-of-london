'use server'

import { getPrisma } from '@/lib/prisma.server';
import { sendAccessRequestEmail } from '@/lib/mail';

export async function requestAccessAction(formData: FormData) {
  const email = formData.get('email') as string;
  const slug = formData.get('slug') as string;
  const title = formData.get('title') as string;

  const prisma = await getPrisma();
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  // 1. Audit the request in the System Log
  await prisma.systemAuditLog.create({
    data: {
      action: 'ACCESS_REQUEST',
      resourceId: slug,
      actorEmail: email,
      metadata: JSON.stringify({ source: 'VaultGuard_UI' }),
      severity: 'info'
    }
  });

  // 2. Send the Institutional Notification
  const mailResult = await sendAccessRequestEmail(email, title, slug);

  if (mailResult.success) {
    return { message: "Request received. An advisor will review your session." };
  } else {
    throw new Error("Connectivity error. Please retry.");
  }
}