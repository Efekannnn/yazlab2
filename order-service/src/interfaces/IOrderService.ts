export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderDTO {
  items: OrderItem[];
}

export interface UpdateOrderDTO {
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
}

export interface OrderResult {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  createdAt: Date;
}

export interface IOrderService {
  createOrder(userId: string, userEmail: string, dto: CreateOrderDTO): Promise<OrderResult>;
  getOrders(userId: string, role: string): Promise<OrderResult[]>;
  getOrderById(orderId: string, userId: string, role: string): Promise<OrderResult>;
  updateOrder(orderId: string, userId: string, role: string, dto: UpdateOrderDTO): Promise<OrderResult>;
  deleteOrder(orderId: string, userId: string, role: string): Promise<void>;
}
```

---

**📄 `order-service/.env.example`**
```
PORT=3003
MONGODB_URI=mongodb://order-mongo:27017/order-db
PRODUCT_SERVICE_URL=http://product-service:3002
NODE_ENV=development
```

---

**📄 `order-service/.gitignore`**
```
node_modules/
dist/
coverage/
.env