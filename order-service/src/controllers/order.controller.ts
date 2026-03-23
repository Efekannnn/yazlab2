import { Request, Response } from 'express';
import { IOrderService } from '../interfaces/IOrderService';

export class OrderController {
  constructor(private orderService: IOrderService) {}

  createOrder = async (req: Request, res: Response): Promise<void> => {
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (!userId || !userEmail || !userRole) {
      res.status(400).json({
        error: { code: 'MISSING_HEADERS', message: 'User headers are required' },
      });
      return;
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Items are required' },
      });
      return;
    }

    try {
      const result = await this.orderService.createOrder(userId, userEmail, { items });
      res.status(201).json(result);
    } catch (err: any) {
      if (err.message === 'EMPTY_ORDER') {
        res.status(400).json({
          error: { code: 'EMPTY_ORDER', message: 'Order must have at least one item' },
        });
      } else {
        res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to create order' },
        });
      }
    }
  };

  getOrders = async (req: Request, res: Response): Promise<void> => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (!userId || !userRole) {
      res.status(400).json({
        error: { code: 'MISSING_HEADERS', message: 'User headers are required' },
      });
      return;
    }

    try {
      const orders = await this.orderService.getOrders(userId, userRole);
      res.status(200).json(orders);
    } catch (err: any) {
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' },
      });
    }
  };

  getOrderById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { id } = req.params;

    if (!userId || !userRole) {
      res.status(400).json({
        error: { code: 'MISSING_HEADERS', message: 'User headers are required' },
      });
      return;
    }

    try {
      const order = await this.orderService.getOrderById(id, userId, userRole);
      res.status(200).json(order);
    } catch (err: any) {
      if (err.message === 'ORDER_NOT_FOUND') {
        res.status(404).json({
          error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
        });
      } else if (err.message === 'FORBIDDEN') {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
      } else {
        res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch order' },
        });
      }
    }
  };

  updateOrder = async (req: Request, res: Response): Promise<void> => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId || !userRole) {
      res.status(400).json({
        error: { code: 'MISSING_HEADERS', message: 'User headers are required' },
      });
      return;
    }

    try {
      const order = await this.orderService.updateOrder(id, userId, userRole, { status });
      res.status(200).json(order);
    } catch (err: any) {
      if (err.message === 'ORDER_NOT_FOUND') {
        res.status(404).json({
          error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
        });
      } else if (err.message === 'FORBIDDEN') {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
      } else {
        res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to update order' },
        });
      }
    }
  };

  deleteOrder = async (req: Request, res: Response): Promise<void> => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { id } = req.params;

    if (!userId || !userRole) {
      res.status(400).json({
        error: { code: 'MISSING_HEADERS', message: 'User headers are required' },
      });
      return;
    }

    try {
      await this.orderService.deleteOrder(id, userId, userRole);
      res.status(200).json({ message: 'Order deleted successfully' });
    } catch (err: any) {
      if (err.message === 'ORDER_NOT_FOUND') {
        res.status(404).json({
          error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
        });
      } else if (err.message === 'FORBIDDEN') {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
      } else {
        res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to delete order' },
        });
      }
    }
  };
}