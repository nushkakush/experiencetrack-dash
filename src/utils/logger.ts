/**
 * Enterprise logging utility with structured logging
 * Supports different log levels and external service integration
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      // Add user context if available
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
    };
  }

  private getUserId(): string | undefined {
    // This would get the current user ID from your auth system
    return undefined;
  }

  private getSessionId(): string | undefined {
    // This would get the current session ID
    return undefined;
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, userId } = entry;
    const levelName = LogLevel[level];
    const timeStr = timestamp.toISOString();
    
    let formatted = `[${timeStr}] ${levelName}: ${message}`;
    
    if (userId) {
      formatted += ` (User: ${userId})`;
    }
    
    if (context && Object.keys(context).length > 0) {
      formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    return formatted;
  }

  private consoleLog(entry: LogEntry): void {
    if (!this.isDevelopment) return;

    const formatted = this.formatMessage(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        if (entry.error) console.warn(entry.error);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        if (entry.error) console.error(entry.error);
        break;
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // In production, send to external logging service
    // e.g., Sentry, LogRocket, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      // Implementation would go here
      console.log('Would send to external service:', entry);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, error);
    
    this.consoleLog(entry);
    this.sendToExternalService(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Specialized logging methods
  apiError(endpoint: string, error: Error, context?: Record<string, any>): void {
    this.error(`API Error: ${endpoint}`, {
      endpoint,
      ...context,
    }, error);
  }

  userAction(action: string, context?: Record<string, any>): void {
    this.info(`User Action: ${action}`, context);
  }

  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...context,
    });
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Export singleton instance
export const logger = new Logger();