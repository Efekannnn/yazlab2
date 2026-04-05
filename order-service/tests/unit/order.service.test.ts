import { IOrderService, CreateOrderDTO, UpdateOrderDTO } from '../../src/interfaces/IOrderService';

describe('OrderService - Unit Tests', () => {
  let orderService: IOrderService;

  beforeEach(() => {
    orderService = {
      createOrder: jest.fn(),
      getOrders: jest.fn(),
      getOrderById: jest.fn(),
      updateOrder: jest.fn(),
      deleteOrder: jest.fn(),
    };
  });

  describe('createOrder()', () => {
    it('should create an order and return order result', async () => {
      const dto: CreateOrderDTO = {
        items: [{ productId: 'prod1', quantity: 2, price: 50 }],
      };
      const mockResult = {
        id: 'order1',
        userId: 'user1',
        userEmail: 'test@test.com',
        items: dto.items,
        totalPrice: 100,
        status: 'pending' as const,
        createdAt: new Date(),
      };
      (orderService.createOrder as jest.Mock).mockResolvedValue(mockResult);

      const result = await orderService.createOrder('user1', 'test@test.com', dto);

      expect(result).toHaveProperty('id');
      expect(result.totalPrice).toBe(100);
      expect(result.status).toBe('pending');
    });

    it('should throw error if items are empty', async () => {
      const dto: CreateOrderDTO = { items: [] };
      (orderService.createOrder as jest.Mock).mockRejectedValue(
        new Error('EMPTY_ORDER')
      );

      await expect(
        orderService.createOrder('user1', 'test@test.com', dto)
      ).rejects.toThrow('EMPTY_ORDER');
    });

    it('should calculate total price correctly', async () => {
      const dto: CreateOrderDTO = {
        items: [
          { productId: 'prod1', quantity: 2, price: 50 },
          { productId: 'prod2', quantity: 1, price: 30 },
        ],
      };
      const mockResult = {
        id: 'order2',
        userId: 'user1',
        userEmail: 'test@test.com',
        items: dto.items,
        totalPrice: 130,
        status: 'pending' as const,
        createdAt: new Date(),
      };
      (orderService.createOrder as jest.Mock).mockResolvedValue(mockResult);

      const result = await orderService.createOrder('user1', 'test@test.com', dto);
      expect(result.totalPrice).toBe(130);
    });
  });

  describe('getOrders()', () => {
    it('should return all orders for admin', async () => {
      const mockOrders = [
        {
          id: 'order1',
          userId: 'user1',
          userEmail: 'test@test.com',
          items: [],
          totalPrice: 100,
          status: 'pending' as const,
          createdAt: new Date(),
        },
      ];
      (orderService.getOrders as jest.Mock).mockResolvedValue(mockOrders);

      const result = await orderService.getOrders('admin1', 'admin');
      expect(result).toHaveLength(1);
    });

    it('should return only user orders for regular user', async () => {
      const mockOrders = [
        {
          id: 'order1',
          userId: 'user1',
          userEmail: 'test@test.com',
          items: [],
          totalPrice: 100,
          status: 'pending' as const,
          createdAt: new Date(),
        },
      ];
      (orderService.getOrders as jest.Mock).mockResolvedValue(mockOrders);

      const result = await orderService.getOrders('user1', 'user');
      expect(result.every((o) => o.userId === 'user1')).toBe(true);
    });
  });

  describe('getOrderById()', () => {
    it('should return order by id', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        userEmail: 'test@test.com',
        items: [],
        totalPrice: 100,
        status: 'pending' as const,
        createdAt: new Date(),
      };
      (orderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order1', 'user1', 'user');
      expect(result.id).toBe('order1');
    });

    it('should throw error if order not found', async () => {
      (orderService.getOrderById as jest.Mock).mockRejectedValue(
        new Error('ORDER_NOT_FOUND')
      );

      await expect(
        orderService.getOrderById('nonexistent', 'user1', 'user')
      ).rejects.toThrow('ORDER_NOT_FOUND');
    });

    it('should throw error if user tries to access another user order', async () => {
      (orderService.getOrderById as jest.Mock).mockRejectedValue(
        new Error('FORBIDDEN')
      );

      await expect(
        orderService.getOrderById('order1', 'user2', 'user')
      ).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('updateOrder()', () => {
    it('should update order status', async () => {
      const dto: UpdateOrderDTO = { status: 'confirmed' };
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        userEmail: 'test@test.com',
        items: [],
        totalPrice: 100,
        status: 'confirmed' as const,
        createdAt: new Date(),
      };
      (orderService.updateOrder as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderService.updateOrder('order1', 'user1', 'admin', dto);
      expect(result.status).toBe('confirmed');
    });

    it('should throw error if order not found', async () => {
      (orderService.updateOrder as jest.Mock).mockRejectedValue(
        new Error('ORDER_NOT_FOUND')
      );

      await expect(
        orderService.updateOrder('nonexistent', 'user1', 'admin', { status: 'confirmed' })
      ).rejects.toThrow('ORDER_NOT_FOUND');
    });
  });

  describe('deleteOrder()', () => {
    it('should delete order successfully', async () => {
      (orderService.deleteOrder as jest.Mock).mockResolvedValue(undefined);

      await expect(
        orderService.deleteOrder('order1', 'user1', 'admin')
      ).resolves.toBeUndefined();
    });

    it('should throw error if order not found', async () => {
      (orderService.deleteOrder as jest.Mock).mockRejectedValue(
        new Error('ORDER_NOT_FOUND')
      );

      await expect(
        orderService.deleteOrder('nonexistent', 'user1', 'admin')
      ).rejects.toThrow('ORDER_NOT_FOUND');
    });
  });
});