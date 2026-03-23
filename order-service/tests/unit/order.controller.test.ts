import { Request, Response } from 'express';
import { OrderController } from '../../src/controllers/order.controller';
import { IOrderService } from '../../src/interfaces/IOrderService';

describe('OrderController - Unit Tests', () => {
  let controller: OrderController;
  let mockOrderService: jest.Mocked<IOrderService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockOrderService = {
      createOrder: jest.fn(),
      getOrders: jest.fn(),
      getOrderById: jest.fn(),
      updateOrder: jest.fn(),
      deleteOrder: jest.fn(),
    };

    controller = new OrderController(mockOrderService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createOrder()', () => {
    it('should return 201 on successful order creation', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user1',
          'x-user-email': 'test@test.com',
          'x-user-role': 'user',
        },
        body: {
          items: [{ productId: 'prod1', quantity: 2, price: 50 }],
        },
      };

      const mockResult = {
        id: 'order1',
        userId: 'user1',
        userEmail: 'test@test.com',
        items: mockReq.body.items,
        totalPrice: 100,
        status: 'pending' as const,
        createdAt: new Date(),
      };
      mockOrderService.createOrder.mockResolvedValue(mockResult);

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 if items are missing', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user1',
          'x-user-email': 'test@test.com',
          'x-user-role': 'user',
        },
        body: {},
      };

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if user headers are missing', async () => {
      mockReq = {
        headers: {},
        body: { items: [{ productId: 'prod1', quantity: 1, price: 50 }] },
      };

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOrders()', () => {
    it('should return 200 with orders list', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user1',
          'x-user-email': 'test@test.com',
          'x-user-role': 'user',
        },
      };
      mockOrderService.getOrders.mockResolvedValue([]);

      await controller.getOrders(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getOrderById()', () => {
    it('should return 200 with order detail', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user1',
          'x-user-email': 'test@test.com',
          'x-user-role': 'user',
        },
        params: { id: 'order1' },
      };
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        userEmail: 'test@test.com',
        items: [],
        totalPrice: 100,
        status: 'pending' as const,
        createdAt: new Date(),
      };
      mockOrderService.getOrderById.mockResolvedValue(mockOrder);

      await controller.getOrderById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if order not found', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user1',
          'x-user-email': 'test@test.com',
          'x-user-role': 'user',
        },
        params: { id: 'nonexistent' },
      };
      mockOrderService.getOrderById.mockRejectedValue(new Error('ORDER_NOT_FOUND'));

      await controller.getOrderById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if forbidden', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user2',
          'x-user-email': 'test2@test.com',
          'x-user-role': 'user',
        },
        params: { id: 'order1' },
      };
      mockOrderService.getOrderById.mockRejectedValue(new Error('FORBIDDEN'));

      await controller.getOrderById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateOrder()', () => {
    it('should return 200 on successful update', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user1',
          'x-user-email': 'test@test.com',
          'x-user-role': 'admin',
        },
        params: { id: 'order1' },
        body: { status: 'confirmed' },
      };
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        userEmail: 'test@test.com',
        items: [],
        totalPrice: 100,
        status: 'confirmed' as const,
        createdAt: new Date(),
      };
      mockOrderService.updateOrder.mockResolvedValue(mockOrder);

      await controller.updateOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteOrder()', () => {
    it('should return 200 on successful delete', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user1',
          'x-user-email': 'test@test.com',
          'x-user-role': 'admin',
        },
        params: { id: 'order1' },
      };
      mockOrderService.deleteOrder.mockResolvedValue(undefined);

      await controller.deleteOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if order not found', async () => {
      mockReq = {
        headers: {
          'x-user-id': 'user1',
          'x-user-email': 'test@test.com',
          'x-user-role': 'admin',
        },
        params: { id: 'nonexistent' },
      };
      mockOrderService.deleteOrder.mockRejectedValue(new Error('ORDER_NOT_FOUND'));

      await controller.deleteOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});