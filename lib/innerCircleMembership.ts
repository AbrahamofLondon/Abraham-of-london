// lib/innerCircleMembership.ts
/* eslint-disable no-console */

export type InnerCircleMember = {
  email: string;
  name?: string;
};

function splitName(name?: string): { firstName?: string; lastName?: string } {
  if (!name) return {};
  const parts = name.trim().split(/\s+/u);
  if (parts.length === 1) {
    return { firstName: parts[0] };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

/**
 * Record / update an Inner Circle member in Resend Contacts.
 * This is your canonical membership record.
 *
 * Privacy: we store ONLY email + (optional) first/last name
 * + a few non-sensitive custom flags.
 */
export async function recordInnerCircleJoin(
  member: InnerCircleMember,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[InnerCircle] RESEND_API_KEY not set. Skipping membership persistence.",
    );
    return;
  }

  const { email, name } = member;
  const { firstName, lastName } = splitName(name);
  const joinedAt = new Date().toISOString();

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const baseProperties = {
    inner_circle_member: "true",
    inner_circle_joined_at: joinedAt,
    inner_circle_last_email_at: joinedAt,
  };

  try {
    const { error } = await resend.contacts.create({
      email,
      firstName,
      lastName,
      unsubscribed: false,
      properties: baseProperties,
    } as any);

    if (error) {
      console.warn(
        "[InnerCircle] contacts.create failed, attempting update by email:",
        error,
      );
      // Contact probably already exists – update instead
      await resend.contacts.update({
        email,
        ...(firstName || lastName ? { firstName, lastName } : {}),
        unsubscribed: false,
        properties: {
          inner_circle_member: "true",
          inner_circle_last_email_at: joinedAt,
        },
      } as any);
    }
  } catch (err) {
    console.error("[InnerCircle] Failed to persist membership:", err);
    // Do NOT fail the whole request because of analytics;
    // access/email still work even if membership logging fails.
  }
}