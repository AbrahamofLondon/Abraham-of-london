// lib/logging.ts - Simplified, dependency-free logging
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'verbose';

export interface LogMetadata {
  service?: string;
  environment?: string;
  version?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private serviceName: string;

  constructor(serviceName?: string) {
    this.serviceName = serviceName || process.env.APP_NAME || 'app';
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      verbose: 4
    };
    return levels[level] <= levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const meta = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] ${level.toUpperCase()} [${this.serviceName}]: ${message}${meta}`;
  }

  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, metadata));
    }
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, metadata));
    }
  }

  error(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, metadata));
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, metadata));
    }
  }

  verbose(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('verbose')) {
      console.log(this.formatMessage('verbose', message, metadata));
    }
  }
}

export const logger = new Logger();
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  verbose: (message: string, meta?: any) => logger.verbose(message, meta),
};