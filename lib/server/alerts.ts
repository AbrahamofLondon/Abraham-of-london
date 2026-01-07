// lib/server/alerts.ts - Simplified alerts without external dependencies
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AlertOptions {
  component: string;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
  environment?: string;
  timestamp?: Date;
  userId?: string;
  requestId?: string;
}

class AlertManager {
  private alertHistory: AlertOptions[] = [];
  private readonly maxHistory = 100;
  private cooldownMap: Map<string, number> = new Map();
  private readonly cooldowns: Record<AlertSeverity, number> = {
    info: 300000,    // 5 minutes
    warning: 60000,  // 1 minute
    error: 30000,    // 30 seconds
    critical: 0      // No cooldown for critical
  };

  async sendHealthAlert(options: AlertOptions): Promise<void> {
    const fullOptions: AlertOptions = {
      ...options,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date()
    };

    // Check cooldown
    if (!this.shouldSendAlert(fullOptions)) {
      console.debug(`Alert cooldown active for ${options.component}:${options.severity}`);
      return;
    }

    // Add to history
    this.addToHistory(fullOptions);

    // Log the alert
    this.logAlert(fullOptions);

    // Send to configured channels
    await this.sendToConfiguredChannels(fullOptions);

    // Update cooldown
    this.updateCooldown(fullOptions);
  }

  private shouldSendAlert(options: AlertOptions): boolean {
    const key = `${options.component}:${options.severity}`;
    const lastSent = this.cooldownMap.get(key);
    
    if (!lastSent) return true;
    
    const cooldown = this.cooldowns[options.severity];
    const now = Date.now();
    
    return now - lastSent > cooldown;
  }

  private updateCooldown(options: AlertOptions): void {
    const key = `${options.component}:${options.severity}`;
    this.cooldownMap.set(key, Date.now());
  }

  private addToHistory(alert: AlertOptions): void {
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory.pop();
    }
  }

  private logAlert(alert: AlertOptions): void {
    const logMethod = {
      info: console.log,
      warning: console.warn,
      error: console.error,
      critical: console.error
    }[alert.severity];

    logMethod(`[${alert.severity.toUpperCase()}] ${alert.component}: ${alert.message}`, {
      metadata: alert.metadata,
      environment: alert.environment,
      userId: alert.userId,
      requestId: alert.requestId
    });
  }

  private async sendToConfiguredChannels(alert: AlertOptions): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to console (always enabled)
    promises.push(Promise.resolve());

    // Send to webhook if configured
    if (process.env.DISCORD_ALERT_WEBHOOK || process.env.SLACK_ALERT_WEBHOOK) {
      promises.push(this.sendToWebhook(alert));
    }

    // Send to email if configured
    if (process.env.ALERT_EMAIL_ENABLED === 'true') {
      promises.push(this.sendEmail(alert));
    }

    await Promise.allSettled(promises);
  }

  private async sendToWebhook(alert: AlertOptions): Promise<void> {
    const webhookUrl = process.env.DISCORD_ALERT_WEBHOOK || process.env.SLACK_ALERT_WEBHOOK;
    if (!webhookUrl) return;

    try {
      const payload = this.createWebhookPayload(alert);
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  private createWebhookPayload(alert: AlertOptions): any {
    const isDiscord = process.env.DISCORD_ALERT_WEBHOOK;
    
    if (isDiscord) {
      return {
        embeds: [{
          title: `${alert.severity.toUpperCase()} Alert: ${alert.component}`,
          description: alert.message,
          color: this.getDiscordColor(alert.severity),
          timestamp: alert.timestamp?.toISOString(),
          fields: [
            {
              name: 'Environment',
              value: alert.environment || 'unknown',
              inline: true
            }
          ]
        }]
      };
    } else {
      // Slack format
      return {
        text: `*${alert.severity.toUpperCase()} Alert*`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alert.component}*: ${alert.message}`
            }
          }
        ]
      };
    }
  }

  private getDiscordColor(severity: AlertSeverity): number {
    const colors = {
      info: 0x3498db,     // Blue
      warning: 0xf39c12,  // Orange
      error: 0xe74c3c,    // Red
      critical: 0x8b0000  // Dark Red
    };
    return colors[severity];
  }

  private async sendEmail(alert: AlertOptions): Promise<void> {
    // Simple email stub - in production, integrate with your email service
    console.log(`[EMAIL ALERT] ${alert.severity.toUpperCase()}: ${alert.component} - ${alert.message}`);
  }

  async getAlertHistory(limit = 50): Promise<AlertOptions[]> {
    return this.alertHistory.slice(0, limit);
  }

  async clearCooldowns(): Promise<void> {
    this.cooldownMap.clear();
  }
}

// Singleton instance
const alertManager = new AlertManager();

export async function sendHealthAlert(options: AlertOptions): Promise<void> {
  return alertManager.sendHealthAlert(options);
}

export { alertManager, AlertManager };