/**
 * Structured Logging System
 * Replaces console.log with proper logging levels and formatting
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    this.logLevel =
      process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    let formattedMessage = `[${timestamp}] ${levelName}: ${message}`;

    if (context && Object.keys(context).length > 0) {
      try {
        formattedMessage += ` | Context: ${JSON.stringify(context, null, 2)}`;
      } catch (e) {
        // Handle circular references or non-serializable objects
        formattedMessage += ` | Context: [Unable to serialize context object]`;
      }
    }

    if (error) {
      formattedMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        formattedMessage += ` | Stack: ${error.stack}`;
      }
    }

    return formattedMessage;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
    };

    this.addLog(entry);

    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
    };

    this.addLog(entry);
    console.info(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      error,
    };

    this.addLog(entry);
    console.warn(this.formatMessage(LogLevel.WARN, message, context, error));
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      error,
    };

    this.addLog(entry);
    console.error(this.formatMessage(LogLevel.ERROR, message, context, error));
  }

  critical(
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    if (!this.shouldLog(LogLevel.CRITICAL)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.CRITICAL,
      message,
      context,
      error,
    };

    this.addLog(entry);
    console.error(
      this.formatMessage(LogLevel.CRITICAL, message, context, error)
    );

    // In production, you might want to send this to an external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service (e.g., Sentry, LogRocket)
    // This is where you would send critical logs to an external service
    // For now, we'll just store it in memory or could send to a monitoring service
    this.addLog(entry);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create a singleton instance
export const logger = Logger.getInstance();

// Convenience functions
export const debug = (message: string, context?: Record<string, any>) =>
  logger.debug(message, context);
export const info = (message: string, context?: Record<string, any>) =>
  logger.info(message, context);
export const warn = (
  message: string,
  context?: Record<string, any>,
  error?: Error
) => logger.warn(message, context, error);
export const error = (
  message: string,
  context?: Record<string, any>,
  error?: Error
) => logger.error(message, context, error);
export const critical = (
  message: string,
  context?: Record<string, any>,
  error?: Error
) => logger.critical(message, context, error);
