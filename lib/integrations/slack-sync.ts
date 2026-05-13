/**
 * lib/integrations/slack-sync.ts
 * Fetches Slack conversations and user presence to extract
 * behavioral signals (responsiveness, engagement, etc.)
 * for the Pattern-Breaker Contract verification system.
 */

import { getAccessToken, touchIntegrationSync, expireIntegration } from "./token-store";
import { nowISO } from "@/utils/dates";
import type { BehavioralDataSource } from "@/lib/alignment/enhanced-types";

export interface SlackSyncResult {
  success: boolean;
  signals: BehavioralDataSource["signals"];
  channelCount: number;
  messageCount: number;
  responseRate: number;
  syncTimestamp: string;
  error?: string;
}

/**
 * Sync Slack data for a user and extract behavioral signals.
 */
export async function syncSlack(
  userId: string,
): Promise<SlackSyncResult> {
  const token = await getAccessToken(userId, "slack");
  if (!token) {
    return {
      success: false,
      signals: {},
      channelCount: 0,
      messageCount: 0,
      responseRate: 0,
      syncTimestamp: nowISO(),
      error: "No active Slack connection. Reconnect via Settings > Integrations.",
    };
  }

  try {
    // 1. Get user info to find the user's Slack ID
    const userInfo = await slackApiCall(token, "users.identity");
    const slackUserId = userInfo?.user?.id;

    if (!slackUserId) {
      return {
        success: false,
        signals: {},
        channelCount: 0,
        messageCount: 0,
        responseRate: 0,
        syncTimestamp: nowISO(),
        error: "Could not resolve Slack user identity.",
      };
    }

    // 2. Get list of conversations the user is in
    const conversations = await slackApiCall(token, "users.conversations", {
      types: "public_channel,private_channel",
      limit: 50,
      exclude_archived: true,
    });

    const channels = conversations?.channels || [];
    const channelIds = channels.map((c: any) => c.id).filter(Boolean);

    // 3. For each channel, get recent messages and calculate response patterns
    let totalMessages = 0;
    let totalResponses = 0;
    let responseTimes: number[] = [];

    for (const channelId of channelIds.slice(0, 10)) {
      // Limit to 10 channels for performance
      const history = await slackApiCall(token, "conversations.history", {
        channel: channelId,
        limit: 50,
      });

      const messages: Array<{ ts: string; user?: string; thread_ts?: string; text: string }> =
        history?.messages || [];

      totalMessages += messages.length;

      // Count messages from this user (responses)
      const userMessages = messages.filter((m) => m.user === slackUserId);
      totalResponses += userMessages.length;

      // Estimate response time from thread replies
      const threadMessages = messages.filter((m) => m.thread_ts);
      for (const msg of threadMessages) {
        const parentTs = parseFloat(msg.thread_ts ?? "0");
        const msgTs = parseFloat(msg.ts ?? "0");
        if (parentTs > 0 && msgTs > 0 && msgTs > parentTs) {
          responseTimes.push((msgTs - parentTs) * 1000); // seconds to ms
        }
      }
    }

    // Calculate signals
    const responseRate = totalMessages > 0
      ? Math.round((totalResponses / totalMessages) * 100) / 100
      : 0;

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 3600000 * 10) / 10 // hours
      : undefined;

    // Update last sync timestamp
    await touchIntegrationSync(userId, "slack");

    return {
      success: true,
      signals: {
        slackResponsiveness: avgResponseTime ?? 24, // default 24h if no data
      },
      channelCount: channels.length,
      messageCount: totalMessages,
      responseRate,
      syncTimestamp: nowISO(),
    };
  } catch (error) {
    return {
      success: false,
      signals: {},
      channelCount: 0,
      messageCount: 0,
      responseRate: 0,
      syncTimestamp: nowISO(),
      error: error instanceof Error ? error.message : "Unknown Slack sync error",
    };
  }
}

/**
 * Build a BehavioralDataSource from the latest Slack sync.
 */
export async function buildSlackDataSource(
  userId: string,
): Promise<BehavioralDataSource | null> {
  const result = await syncSlack(userId);

  if (!result.success) return null;

  return {
    type: "slack",
    connectionId: `slack_${userId}`,
    connectedAt: nowISO(),
    lastSyncAt: result.syncTimestamp,
    status: "active",
    signals: result.signals,
  };
}

// ─── Slack API Helper ─────────────────────────────────────────────────────────

async function slackApiCall(
  token: string,
  method: string,
  params: Record<string, any> = {},
): Promise<any> {
  const url = `https://slack.com/api/${method}`;

  // POST with form body for methods that need it
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.set(key, String(value));
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} for method ${method}`);
  }

  const data = await response.json();

  if (!data.ok) {
    // Handle specific Slack errors
    if (data.error === "token_expired" || data.error === "invalid_auth") {
      throw new Error("SLACK_TOKEN_EXPIRED");
    }
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data;
}
