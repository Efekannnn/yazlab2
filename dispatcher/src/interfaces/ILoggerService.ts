export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  userEmail?: string;
  targetService: string;
  level: LogLevel;
  message?: string;
  timestamp: Date;
}

export interface LogQuery {
  level?: LogLevel;
  targetService?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedLogs {
  logs: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ILoggerService {
  log(entry: LogEntry): Promise<void>;
  query(filter: LogQuery): Promise<PaginatedLogs>;
  getRecentLogs(limit: number): Promise<LogEntry[]>;
}
