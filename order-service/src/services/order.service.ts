import { OrderModel } from '../models/order.model';
import {
  IOrderService,
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderResult,
} from '../interfaces/IOrderService';

export class OrderService implements IOrderService {
  async createOrder(
    userId: string,
    userEmail: string,
    dto: CreateOrderDTO
  ): Promise<OrderResult> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('EMPTY_ORDER');
    }

    const totalPrice = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await OrderModel.create({
      userId,
      userEmail,
      items: dto.items,
      totalPrice,
      status: 'pending',
    });

    return this.toOrderResult(order);
  }

  async getOrders(userId: string, role: string): Promise<OrderResult[]> {
    const filter = role === 'admin' ? {} : { userId };
    const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
    return orders.map((o) => this.toOrderResult(o));
  }

  async getOrderById(
    orderId: string,
    userId: string,
    role: string
  ): Promise<OrderResult> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }
    if (role !== 'admin' && order.userId !== userId) {
      throw new Error('FORBIDDEN');
    }
    return this.toOrderResult(order);
  }

  async updateOrder(
    orderId: string,
    userId: string,
    role: string,
    dto: UpdateOrderDTO
  ): Promise<OrderResult> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }
    if (role !== 'admin' && order.userId !== userId) {
      throw new Error('FORBIDDEN');
    }

    order.status = dto.status;
    await order.save();
    return this.toOrderResult(order);
  }

  async deleteOrder(
    orderId: string,
    userId: string,
    role: string
  ): Promise<void> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }
    if (role !== 'admin' && order.userId !== userId) {
      throw new Error('FORBIDDEN');
    }
    await OrderModel.findByIdAndDelete(orderId);
  }

  private toOrderResult(order: any): OrderResult {
    return {
      id: order._id.toString(),
      userId: order.userId,
      userEmail: order.userEmail,
      items: order.items,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
    };
  }
}