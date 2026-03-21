import { ILoggerService, LogEntry, LogQuery, PaginatedLogs } from '../interfaces/ILoggerService';
import { LogModel } from '../models/log.model';

export class LoggerService implements ILoggerService {
  async log(entry: LogEntry): Promise<void> {
    try {
      await LogModel.create(entry);
    } catch {
      // Graceful degradation: loglama hatasi uygulamayi kirmamali
    }
  }

  async query(filter: LogQuery): Promise<PaginatedLogs> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

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

  async getRecentLogs(limit: number): Promise<LogEntry[]> {
    const safeLimit = limit > 0 ? limit : 20;
    const logs = await LogModel.find({})
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .lean();

    return logs as LogEntry[];
  }
}
