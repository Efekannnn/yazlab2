/**
 * SHARED INTERFACES - Faz 1 Contract
 * 
 * Bu dosya referans dokumanidir. Her servis kendi interface dosyasini
 * bu sozlesmeye uygun olarak olusturur.
 * 
 * Dispatcher (Gelistirici 1) ve Auth Service (Gelistirici 2)
 * bu tiplere gore bagimsiz calisabilir.
 */

// ============================================
// JWT & Auth Types
// ============================================

export type UserRole = 'user' | 'admin';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest {
  user: JwtPayload;
  headers: {
    'x-user-id': string;
    'x-user-email': string;
    'x-user-role': UserRole;
  };
}

// ============================================
// Auth Service API Types
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt?: string;
  };
  token: string;
}

export interface LogoutResponse {
  message: string;
}

// ============================================
// Shared Error Response
// ============================================

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_MISSING'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR';

// ============================================
// Service Health Check
// ============================================

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: string;
  uptime: number;
  checks?: {
    database: 'connected' | 'disconnected';
  };
}

// ============================================
// Downstream Header Constants
// ============================================

export const AUTH_HEADERS = {
  USER_ID: 'x-user-id',
  USER_EMAIL: 'x-user-email',
  USER_ROLE: 'x-user-role',
} as const;

// ============================================
// Route Protection Configuration
// ============================================

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  target: 'auth' | 'product' | 'order' | 'dispatcher';
  auth: 'public' | 'protected' | 'admin';
}

export const ROUTE_MAP: RouteConfig[] = [
  // Auth routes
  { path: '/api/auth/register', method: 'POST', target: 'auth', auth: 'public' },
  { path: '/api/auth/login', method: 'POST', target: 'auth', auth: 'public' },
  { path: '/api/auth/logout', method: 'POST', target: 'auth', auth: 'protected' },

  // Product routes
  { path: '/api/products', method: 'GET', target: 'product', auth: 'public' },
  { path: '/api/products/:id', method: 'GET', target: 'product', auth: 'public' },
  { path: '/api/products', method: 'POST', target: 'product', auth: 'protected' },
  { path: '/api/products/:id', method: 'PUT', target: 'product', auth: 'protected' },
  { path: '/api/products/:id', method: 'DELETE', target: 'product', auth: 'protected' },

  // Order routes
  { path: '/api/orders', method: 'GET', target: 'order', auth: 'protected' },
  { path: '/api/orders/:id', method: 'GET', target: 'order', auth: 'protected' },
  { path: '/api/orders', method: 'POST', target: 'order', auth: 'protected' },
  { path: '/api/orders/:id', method: 'PUT', target: 'order', auth: 'protected' },
  { path: '/api/orders/:id', method: 'DELETE', target: 'order', auth: 'protected' },

  // Dispatcher internal
  { path: '/api/logs', method: 'GET', target: 'dispatcher', auth: 'admin' },
  { path: '/api/health', method: 'GET', target: 'dispatcher', auth: 'public' },
];

// ============================================
// User Model (Auth Service MongoDB Schema Reference)
// ============================================

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Product Model (Product Service MongoDB Schema Reference)
// ============================================

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Order Model (Order Service MongoDB Schema Reference)
// ============================================

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Log Model (Dispatcher MongoDB Schema Reference)
// ============================================

export type LogLevel = 'info' | 'warn' | 'error';

export interface ILog {
  _id: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  userEmail?: string;
  targetService: string;
  level: LogLevel;
  message?: string;
  timestamp: Date;
}
