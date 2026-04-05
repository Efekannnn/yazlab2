import { ILoggerService, LogEntry, LogLevel, LogQuery, PaginatedLogs } from '../interfaces/ILoggerService';
import { LogModel } from '../models/log.model';

// MongoDB sorgusu için dinamik filtre yapısı
interface LogFilter {
  level?: LogLevel;
  targetService?: string;
  timestamp?: { $gte?: Date; $lte?: Date };
}

export class LoggerService implements ILoggerService {
  // Log kaydını MongoDB'ye yazar; hata olursa sessizce geçer
  async log(entry: LogEntry): Promise<void> {
    try {
      await LogModel.create(entry);
    } catch {
      // Graceful degradation: loglama hatası uygulamayı kırmamalı
    }
  }

  // Filtre, sayfalama ve tarih aralığına göre log sorgular
  async query(filter: LogQuery): Promise<PaginatedLogs> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: LogFilter = {};

    // Sadece belirtilen filtreleri sorguya ekle
    if (filter.level) {
      where.level = filter.level;
    }
    if (filter.targetService) {
      where.targetService = filter.targetService;
    }
    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.$gte = filter.startDate;
      if (filter.endDate) where.timestamp.$lte = filter.endDate;
    }

    const total = await LogModel.countDocuments(where);
    // En yeni loglar önce gelecek şekilde sırala
    const logs = await LogModel.find(where)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      logs: logs as LogEntry[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Son N log kaydını döndürür; geçersiz limit için 20 kullanır
  async getRecentLogs(limit: number): Promise<LogEntry[]> {
    const safeLimit = limit > 0 ? limit : 20;
    const logs = await LogModel.find({})
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .lean();

    return logs as LogEntry[];
  }
}
