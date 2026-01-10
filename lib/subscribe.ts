// lib/subscribe.ts

import type {
  SubscriptionResult,
  SubscriptionPreferences,
  SubscriberData,
} from "@/lib/server/subscription";
import {
  subscribe as coreSubscribe,
  bulkSubscribe as coreBulkSubscribe,
  unsubscribe as coreUnsubscribe,
} from "@/lib/server/subscription";

export type { SubscriptionResult, SubscriptionPreferences, SubscriberData };

/**
 * Public subscribe helper for use in API routes / server actions.
 */
export async function subscribe(
  email: string,
  options: {
    preferences?: SubscriptionPreferences;
    metadata?: Record<string, unknown>;
    tags?: string[];
    referrer?: string;
  } = {}
): Promise<SubscriptionResult> {
  return coreSubscribe(email, options);
}

/**
 * Bulk subscribe helper.
 */
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
  return coreBulkSubscribe(emails, options);
}

/**
 * Public unsubscribe helper.
 */
export async function unsubscribe(email: string): Promise<SubscriptionResult> {
  return coreUnsubscribe(email);
}


