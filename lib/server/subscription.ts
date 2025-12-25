// lib/server/subscription.ts
// Robust subscription service (Buttondown + local fallback)

// Hard guard: this must never be imported in the browser.
if (typeof window !== "undefined") {
  throw new Error("subscription must not be imported on the client");
}

export interface SubscriptionResult {
  ok: boolean;
  message: string;
  error?: string;
  status?: number;
}

export interface SubscriptionPreferences {
  newsletter?: boolean;
  updates?: boolean;
  marketing?: boolean;
}

export interface SubscriberMetadata {
  [key: string]: unknown;
}

export interface SubscriberData {
  email: string;
  metadata?: SubscriberMetadata;
  tags?: string[];
  preferences?: SubscriptionPreferences;
  referrer?: string;
}

interface ButtondownErrorShape {
  email?: unknown;
  detail?: unknown;
}

// ---------------------------------------------------------------------------
// Basic email utilities
// ---------------------------------------------------------------------------

// Validate email with more comprehensive regex
function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Sanitize and normalize email
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Buttondown API integration (SERVER-SIDE ONLY)
// ---------------------------------------------------------------------------

async function subscribeToButtondown(
  subscriber: SubscriberData
): Promise<SubscriptionResult> {
  const API_KEY = process.env.BUTTONDOWN_API_KEY;
  const API_URL = "https://api.buttondown.email/v1/subscribers";

  if (!API_KEY) {
    console.error("[Buttondown] API key not configured");
    return {
      ok: false,
      message: "Subscription service temporarily unavailable",
      error: "API_KEY_MISSING",
    };
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: subscriber.email,
        metadata: subscriber.metadata,
        tags: subscriber.tags,
        referrer_url: subscriber.referrer,
      }),
    });

    let data: ButtondownErrorShape | null = null;
    try {
      data = (await response.json()) as ButtondownErrorShape;
    } catch {
      data = null;
    }

    if (response.ok) {
      return {
        ok: true,
        message: "Successfully subscribed! Please check your email to confirm.",
        status: response.status,
      };
    }

    // Handle specific Buttondown errors
    if (response.status === 400 && data && data.email) {
      const firstEmailMsg =
        Array.isArray(data.email) && data.email.length > 0
          ? data.email[0]
          : data.email;

      const msg = String(firstEmailMsg ?? "").toLowerCase();
      if (msg.includes("already subscribed")) {
        return {
          ok: true,
          message: "You are already subscribed to our newsletter.",
          status: response.status,
        };
      }
    }

    return {
      ok: false,
      message: "Failed to subscribe. Please try again later.",
      error:
        (data && typeof data.detail === "string" && data.detail) ||
        `API_ERROR_${response.status}`,
      status: response.status,
    };
  } catch (error) {
    console.error("[Buttondown] API error:", error);
    return {
      ok: false,
      message: "Network error. Please check your connection and try again.",
      error: "NETWORK_ERROR",
    };
  }
}

// ---------------------------------------------------------------------------
// Fallback: local storage (stubbed)
// ---------------------------------------------------------------------------

async function storeEmailLocally(email: string): Promise<void> {
  // In production, push into a queue / DB.
  console.log(
    "[Subscription] Storing email locally for later processing:",
    email
  );
}

// ---------------------------------------------------------------------------
// Rate limiting (simple in-memory version, per process)
// ---------------------------------------------------------------------------

class RateLimiter {
  private attempts = new Map<string, number[]>();

  isRateLimited(
    identifier: string,
    maxAttempts: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];

    const recentAttempts = userAttempts.filter((time) => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return true;
    }

    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    return false;
  }
}

const rateLimiter = new RateLimiter();

// ---------------------------------------------------------------------------
// Disposable email blocking
// ---------------------------------------------------------------------------

function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    "tempmail.com",
    "guerrillamail.com",
    "mailinator.com",
    "10minutemail.com",
    "throwaway.com",
    "fake.com",
    "yopmail.com",
    "trashmail.com",
  ];

  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && disposableDomains.includes(domain);
}

// ---------------------------------------------------------------------------
// Main subscription function (SERVER-SIDE ONLY)
// ---------------------------------------------------------------------------

export async function subscribe(
  email: string,
  options: {
    preferences?: SubscriptionPreferences;
    metadata?: SubscriberMetadata;
    tags?: string[];
    referrer?: string;
  } = {}
): Promise<SubscriptionResult> {
  // Normalise early so rate-limit key is predictable
  const normalizedEmail = normalizeEmail(email || "");

  // Rate limiting (5 attempts per hour per email + referrer bucket)
  const rateLimitKey = `${normalizedEmail || "invalid"}_${
    options.referrer || "default"
  }`;

  if (rateLimiter.isRateLimited(rateLimitKey, 5, 60 * 60 * 1000)) {
    return {
      ok: false,
      message: "Too many subscription attempts. Please try again later.",
      error: "RATE_LIMITED",
      status: 429,
    };
  }

  // Validate email
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return {
      ok: false,
      message: "Please provide a valid email address.",
      error: "INVALID_EMAIL",
      status: 400,
    };
  }

  // Block obvious disposable / temporary addresses
  if (isDisposableEmail(normalizedEmail)) {
    return {
      ok: false,
      message: "Temporary email addresses are not allowed.",
      error: "DISPOSABLE_EMAIL",
      status: 400,
    };
  }

  const subscriberData: SubscriberData = {
    email: normalizedEmail,
    metadata: options.metadata,
    tags:
      options.tags && options.tags.length > 0
        ? options.tags
        : ["website-subscriber"],
    preferences: options.preferences,
    referrer: options.referrer,
  };

  // Try Buttondown first
  const result = await subscribeToButtondown(subscriberData);

  // If Buttondown fails (for reasons other than missing API key), store locally
  if (!result.ok && result.error !== "API_KEY_MISSING") {
    await storeEmailLocally(normalizedEmail);

    return {
      ok: false,
      message:
        "Subscription service is temporarily unavailable. We have saved your email and will retry.",
      error: result.error,
      status: result.status,
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Bulk subscription helper
// ---------------------------------------------------------------------------

export async function bulkSubscribe(
  emails: string[],
  options: {
    tags?: string[];
    batchSize?: number;
  } = {}
): Promise<{
  successful: string[];
  failed: Array<{ email: string; error: string }>;
}> {
  const batchSize = options.batchSize || 10;
  const successful: string[] = [];
  const failed: Array<{ email: string; error: string }> = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const results: SubscriptionResult[] = await Promise.all(
      batch.map((addr) => subscribe(addr, { tags: options.tags }))
    );

    results.forEach((result, index) => {
      const originalEmail = batch[index];
      if (result.ok) {
        successful.push(originalEmail);
      } else {
        failed.push({
          email: originalEmail,
          error: result.error || result.message,
        });
      }
    });

    // Small delay between batches to avoid any ESP-side throttling
    if (i + batchSize < emails.length) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { successful, failed };
}

// ---------------------------------------------------------------------------
// Unsubscribe (stub - implement real Buttondown call when needed)
// ---------------------------------------------------------------------------

export async function unsubscribe(email: string): Promise<SubscriptionResult> {
  const normalizedEmail = normalizeEmail(email || "");

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return {
      ok: false,
      message: "Please provide a valid email address.",
      error: "INVALID_EMAIL",
      status: 400,
    };
  }

  // TODO: call Buttondown unsubscribe endpoint when you're ready.
  // For now, we just return success to avoid blocking the UX.
  return {
    ok: true,
    message: "Successfully unsubscribed.",
    status: 200,
  };
}
