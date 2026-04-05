// Log şiddet seviyeleri
export type LogLevel = 'info' | 'warn' | 'error';

// Her HTTP isteği için oluşturulan log kaydı
export interface LogEntry {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;   // Milisaniye cinsinden
  userId?: string;        // Opsiyonel — yalnızca kimlik doğrulanmış isteklerde
  userEmail?: string;
  targetService: string;
  level: LogLevel;
  message?: string;
  timestamp: Date;
}

// GET /api/logs endpoint'i için filtre parametreleri
export interface LogQuery {
  level?: LogLevel;
  targetService?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Sayfalanmış log sorgu sonucu
export interface PaginatedLogs {
  logs: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

// Logger servisinin dışa açık sözleşmesi
export interface ILoggerService {
  log(entry: LogEntry): Promise<void>;
  query(filter: LogQuery): Promise<PaginatedLogs>;
  getRecentLogs(limit: number): Promise<LogEntry[]>;
}
