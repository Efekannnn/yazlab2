import mongoose, { Schema, Document } from 'mongoose';
import { LogEntry } from '../interfaces/ILoggerService';

// Mongoose Document ile LogEntry arayüzünü birleştiren tip
export interface ILogDocument extends LogEntry, Document {}

const logSchema = new Schema<ILogDocument>(
  {
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseTime: { type: Number, required: true },
    userId: { type: String },       // Kimlik doğrulanmış isteklerde dolu
    userEmail: { type: String },
    targetService: { type: String, required: true },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    message: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false } // createdAt/updatedAt yerine timestamp alanı kullanılıyor
);

// Sık sorgulanan alanlara index ekle
logSchema.index({ level: 1 });
logSchema.index({ targetService: 1 });
logSchema.index({ timestamp: -1 }); // En yeni önce sıralama için

export const LogModel = mongoose.model<ILogDocument>('Log', logSchema);
