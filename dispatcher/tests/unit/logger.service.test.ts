/**
 * TDD RED Phase - Logger Service Tests
 * 
 * Bu testler LoggerService implementasyonu OLMADAN yazilmistir.
 * Amac: MongoDB'ye log yazma ve sorgulama mantigi icin beklenen davranislari tanimlamak.
 * 
 * Beklenen: TUM TESTLER FAIL EDECEK (import hatasi - modul yok)
 */

import { LogEntry, LogQuery } from '../../src/interfaces/ILoggerService';

jest.mock('../../src/models/log.model', () => ({
  LogModel: {
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    countDocuments: jest.fn(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn(),
  },
}));

import { LoggerService } from '../../src/services/logger.service';
const { LogModel: mockLogModel } = require('../../src/models/log.model');

describe('LoggerService', () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    loggerService = new LoggerService();
    jest.clearAllMocks();
  });

  // ================================================
  // log - Log kaydi olusturma
  // ================================================
  describe('log', () => {
    it('should save a log entry to the database', async () => {
      const entry: LogEntry = {
        method: 'GET',
        path: '/api/products',
        statusCode: 200,
        responseTime: 45,
        targetService: 'product-service',
        level: 'info',
        timestamp: new Date(),
      };

      mockLogModel.create.mockResolvedValue(entry);

      await loggerService.log(entry);

      expect(mockLogModel.create).toHaveBeenCalledWith(entry);
    });

    it('should save log entry with user information', async () => {
      const entry: LogEntry = {
        method: 'POST',
        path: '/api/orders',
        statusCode: 201,
        responseTime: 120,
        userId: 'user123',
        userEmail: 'test@test.com',
        targetService: 'order-service',
        level: 'info',
        timestamp: new Date(),
      };

      mockLogModel.create.mockResolvedValue(entry);

      await loggerService.log(entry);

      expect(mockLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          userEmail: 'test@test.com',
        })
      );
    });

    it('should save error-level log entries', async () => {
      const entry: LogEntry = {
        method: 'GET',
        path: '/api/products/invalid',
        statusCode: 503,
        responseTime: 5000,
        targetService: 'product-service',
        level: 'error',
        message: 'Service unavailable',
        timestamp: new Date(),
      };

      mockLogModel.create.mockResolvedValue(entry);

      await loggerService.log(entry);

      expect(mockLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          statusCode: 503,
        })
      );
    });

    it('should not throw when database write fails (graceful degradation)', async () => {
      mockLogModel.create.mockRejectedValue(new Error('DB connection lost'));

      const entry: LogEntry = {
        method: 'GET',
        path: '/api/products',
        statusCode: 200,
        responseTime: 30,
        targetService: 'product-service',
        level: 'info',
        timestamp: new Date(),
      };

      await expect(loggerService.log(entry)).resolves.not.toThrow();
    });
  });

  // ================================================
  // query - Log sorgulama (filtreleme + sayfalama)
  // ================================================
  describe('query', () => {
    it('should return paginated logs with default parameters', async () => {
      const mockLogs = [
        { method: 'GET', path: '/api/products', statusCode: 200 },
        { method: 'POST', path: '/api/orders', statusCode: 201 },
      ];

      mockLogModel.lean.mockResolvedValue(mockLogs);
      mockLogModel.countDocuments.mockResolvedValue(2);

      const filter: LogQuery = {};
      const result = await loggerService.query(filter);

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should filter logs by level', async () => {
      const mockLogs = [
        { method: 'GET', path: '/api/fail', statusCode: 500, level: 'error' },
      ];

      mockLogModel.lean.mockResolvedValue(mockLogs);
      mockLogModel.countDocuments.mockResolvedValue(1);

      const filter: LogQuery = { level: 'error' };
      const result = await loggerService.query(filter);

      expect(result.logs).toHaveLength(1);
      expect(mockLogModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' })
      );
    });

    it('should filter logs by target service', async () => {
      mockLogModel.lean.mockResolvedValue([]);
      mockLogModel.countDocuments.mockResolvedValue(0);

      const filter: LogQuery = { targetService: 'order-service' };
      await loggerService.query(filter);

      expect(mockLogModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ targetService: 'order-service' })
      );
    });

    it('should support pagination with page and limit', async () => {
      mockLogModel.lean.mockResolvedValue([]);
      mockLogModel.countDocuments.mockResolvedValue(50);

      const filter: LogQuery = { page: 3, limit: 10 };
      const result = await loggerService.query(filter);

      expect(mockLogModel.skip).toHaveBeenCalledWith(20); // (page-1) * limit
      expect(mockLogModel.limit).toHaveBeenCalledWith(10);
      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
    });

    it('should filter logs by date range', async () => {
      mockLogModel.lean.mockResolvedValue([]);
      mockLogModel.countDocuments.mockResolvedValue(0);

      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-19');

      const filter: LogQuery = { startDate, endDate };
      await loggerService.query(filter);

      expect(mockLogModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.objectContaining({
            $gte: startDate,
            $lte: endDate,
          }),
        })
      );
    });
  });

  // ================================================
  // getRecentLogs - Son N log kaydini getirme
  // ================================================
  describe('getRecentLogs', () => {
    it('should return the most recent logs sorted by timestamp desc', async () => {
      const mockLogs = [
        { method: 'POST', path: '/api/orders', timestamp: new Date() },
        { method: 'GET', path: '/api/products', timestamp: new Date() },
      ];

      mockLogModel.lean.mockResolvedValue(mockLogs);

      const result = await loggerService.getRecentLogs(10);

      expect(result).toHaveLength(2);
      expect(mockLogModel.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockLogModel.limit).toHaveBeenCalledWith(10);
    });

    it('should default to 20 if limit is not provided or zero', async () => {
      mockLogModel.lean.mockResolvedValue([]);

      await loggerService.getRecentLogs(0);

      expect(mockLogModel.limit).toHaveBeenCalledWith(20);
    });
  });
});
