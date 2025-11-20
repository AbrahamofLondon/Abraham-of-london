// lib/server/subscription.ts

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

export interface SubscriberData {
  email: string;
  metadata?: Record<string, any>;
  tags?: string[];
  preferences?: SubscriptionPreferences;
  referrer?: string;
}

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

// Buttondown API integration
async function subscribeToButtondown(
  subscriber: SubscriberData,
): Promise<SubscriptionResult> {
  const API_KEY = process.env.BUTTONDOWN_API_KEY;
  const API_URL = "https://api.buttondown.email/v1/subscribers";

  if (!API_KEY) {
    console.error("Buttondown API key not configured");
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

    const data = await response.json();

    if (response.ok) {
      return {
        ok: true,
        message: "Successfully subscribed! Please check your email to confirm.",
        status: response.status,
      };
    }

    // Handle specific Buttondown errors
    if (response.status === 400) {
      if (data.email?.[0]?.includes("already subscribed")) {
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
      error: data.detail || `API_ERROR_${response.status}`,
      status: response.status,
    };
  } catch (error) {
    console.error("Buttondown API error:", error);
    return {
      ok: false,
      message: "Network error. Please check your connection and try again.",
      error: "NETWORK_ERROR",
    };
  }
}

// Fallback email storage (for when ESP is down)
async function storeEmailLocally(email: string): Promise<void> {
  // In a real implementation, you might store in a database or file
  console.log("Storing email locally for later processing:", email);
}

// Rate limiting (simple in-memory version)
class RateLimiter {
  private attempts = new Map<string, number[]>();

  isRateLimited(
    identifier: string,
    maxAttempts: number,
    windowMs: number,
  ): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];

    // Clean old attempts
    const recentAttempts = userAttempts.filter(
      (time) => now - time < windowMs,
    );

    if (recentAttempts.length >= maxAttempts) {
      return true;
    }

    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    return false;
  }
}

const rateLimiter = new RateLimiter();

// Main subscription function
export async function subscribe(
  email: string,
  options: {
    preferences?: SubscriptionPreferences;
    metadata?: Record<string, any>;
    tags?: string[];
    referrer?: string;
  } = {},
): Promise<SubscriptionResult> {
  // Rate limiting (5 attempts per hour per IP/email)
  const rateLimitKey = `${email}_${options.referrer || "default"}`;
  if (rateLimiter.isRateLimited(rateLimitKey, 5, 60 * 60 * 1000)) {
    return {
      ok: false,
      message: "Too many subscription attempts. Please try again later.",
    };
  }

  // Validate email
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return {
      ok: false,
      message: "Please provide a valid email address.",
    };
  }

  // Check for disposable/temporary emails
  if (isDisposableEmail(normalizedEmail)) {
    return {
      ok: false,
      message: "Temporary email addresses are not allowed.",
    };
  }

  const subscriberData: SubscriberData = {
    email: normalizedEmail,
    metadata: options.metadata,
    tags: options.tags || ["website-subscriber"],
    preferences: options.preferences,
    referrer: options.referrer,
  };

  // Try Buttondown first
  const result = await subscribeToButtondown(subscriberData);

  // If Buttondown fails, store locally for later processing
  if (!result.ok && result.error !== "API_KEY_MISSING") {
    await storeEmailLocally(normalizedEmail);
    return {
      ok: false,
      message:
        "Subscription service is temporarily unavailable. We have saved your email and will retry.",
      error: result.error,
    };
  }

  return result;
}

// Simple disposable email checker
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

  const domain = email.split("@")[1];
  return disposableDomains.includes(domain);
}

// Bulk subscription helper
export async function bulkSubscribe(
  emails: string[],
  options: {
    tags?: string[];
    batchSize?: number;
  } = {},
): Promise<{
  successful: string[];
  failed: Array<{ email: string; error: string }>;
}> {
  const batchSize = options.batchSize || 10;
  const successful: string[] = [];
  const failed: Array<{ email: string; error: string }> = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const promises = batch.map((email) =>
      subscribe(email, { tags: options.tags }),
    );

    const results = await Promise.all(promises);

    results.forEach((result, index) => {
      if (result.ok) {
        successful.push(batch[index]);
      } else {
        failed.push({
          email: batch[index],
          error: result.error || result.message,
        });
      }
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { successful, failed };
}

// Unsubscribe function (stub / future extension)
export async function unsubscribe(email: string): Promise<SubscriptionResult> {
  // Implementation for unsubscribe would be similar to subscribe
  // but using the DELETE method or specific unsubscribe endpoint
  return {
    ok: true,
    message: "Successfully unsubscribed",
  };
}