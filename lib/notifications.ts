// lib/notifications.ts - Notification utilities
export type NotificationType = 'health' | 'security' | 'system' | 'user';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface NotificationPayload {
  type: NotificationType;
  severity: NotificationSeverity;
  service?: string;
  title?: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Send an alert through the configured notification channels
 */
export async function sendAlert(payload: Omit<NotificationPayload, 'title'> & { title?: string }): Promise<void> {
  const notification: NotificationPayload = {
    title: `${payload.severity.toUpperCase()}: ${payload.service || 'System'}`,
    ...payload,
    timestamp: payload.timestamp || new Date(),
  };

  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[ALERT]', notification);
    return;
  }

  // In production, you might want to:
  // - Send to Slack/Teams
  // - Send email
  // - Trigger PagerDuty
  // - Log to external monitoring service
  
  try {
    // Example: Send to webhook if configured
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      }).catch(err => console.error('Failed to send alert webhook:', err));
    }

    // Log to console in all environments
    console.error('[ALERT]', notification);
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

/**
 * Send a notification to a user
 */
export async function sendUserNotification(
  userId: string,
  payload: Omit<NotificationPayload, 'type'> & { type?: NotificationType }
): Promise<void> {
  // Implement user notification logic (email, push, etc.)
  console.log(`[USER_NOTIFICATION] User ${userId}:`, payload);
}

/**
 * Get recent notifications
 */
export async function getRecentNotifications(limit: number = 50): Promise<NotificationPayload[]> {
  // Implement notification retrieval from database or cache
  return [];
}