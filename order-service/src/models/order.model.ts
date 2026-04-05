import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: string;
  userEmail: string;
  items: IOrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);