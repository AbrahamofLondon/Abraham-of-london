/* lib/logging.ts — Institutional Structured Logger */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface LogMetadata {
  service?: string;
  environment?: string;
  version?: string;
  actorId?: string;
  requestId?: string;
  path?: string;
  [key: string]: any;
}

const LEVEL_PRECEDENCE: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4
};

// Terminal Colors for "Institutional" clarity
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  amber: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

class Logger {
  private level: LogLevel;
  private serviceName: string;
  private isProduction: boolean;

  constructor(serviceName?: string) {
    this.serviceName = serviceName || process.env.APP_NAME || 'directorate-core';
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRECEDENCE[level] <= LEVEL_PRECEDENCE[this.level];
  }

  /**
   * Prevents sensitive keys from being printed to standard output
   */
  private sanitize(metadata: LogMetadata): object {
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'key'];
    const sanitized = { ...metadata };
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED_FOR_SECURITY]';
      }
    }
    return sanitized;
  }

  private format(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = metadata ? this.sanitize(metadata) : {};
    
    // In Production, output pure JSON for ingestion (Datadog/ELK/CloudWatch)
    if (this.isProduction) {
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        service: this.serviceName,
        message,
        ...sanitizedMeta
      });
    }

    // In Development, output "Institutional Terminal" style
    const color = level === 'error' ? COLORS.red : level === 'warn' ? COLORS.amber : COLORS.cyan;
    const metaString = metadata ? `${COLORS.dim}${JSON.stringify(sanitizedMeta)}${COLORS.reset}` : '';
    
    return `${COLORS.dim}[${timestamp}]${COLORS.reset} ${color}${level.toUpperCase().padEnd(7)}${COLORS.reset} ${COLORS.blue}[${this.serviceName}]${COLORS.reset}: ${message} ${metaString}`;
  }

  /* --- CORE METHODS --- */

  error(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('error')) console.error(this.format('error', message, metadata));
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('warn')) console.warn(this.format('warn', message, metadata));
  }

  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('info')) console.log(this.format('info', message, metadata));
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('debug')) console.debug(this.format('debug', message, metadata));
  }

  verbose(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('verbose')) console.log(this.format('verbose', message, metadata));
  }

  /**
   * Special helper for institutional audit events
   */
  audit(action: string, actor: string, success: boolean, metadata?: any): void {
    const message = `AUDIT_EVENT: ${action} | Actor: ${actor} | Status: ${success ? 'SUCCESS' : 'FAILURE'}`;
    this.info(message, { ...metadata, audit: true, category: 'SECURITY' });
  }
}

// Export a singleton instance and a simplified functional proxy
export const logger = new Logger();

export const log = {
  info: (msg: string, meta?: LogMetadata) => logger.info(msg, meta),
  warn: (msg: string, meta?: LogMetadata) => logger.warn(msg, meta),
  error: (msg: string, meta?: LogMetadata) => logger.error(msg, meta),
  debug: (msg: string, meta?: LogMetadata) => logger.debug(msg, meta),
  verbose: (msg: string, meta?: LogMetadata) => logger.verbose(msg, meta),
  audit: (action: string, actor: string, ok: boolean, meta?: any) => logger.audit(action, actor, ok, meta)
};