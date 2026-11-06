// lib/models/Notification.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'trade' | 'system' | 'promo' | 'alert' | 'wallet';
  title: string;
  message: string;
  read: boolean;
  href?: string;
  meta?: { label: string; value: string; tone?: 'up' | 'down' | 'neutral' }[];
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { 
      type: String, 
      enum: ['trade', 'system', 'promo', 'alert', 'wallet'], 
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    href: { type: String },
    meta: [{
      label: { type: String },
      value: { type: String },
      tone: { type: String, enum: ['up', 'down', 'neutral'] }
    }]
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Notification: Model<INotification> = 
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
// // lib/models/Notification.ts
// import mongoose, { Schema, Document, Model } from 'mongoose';

// export interface INotification extends Document {
//   userId: mongoose.Types.ObjectId;
//   type: 'trade' | 'system' | 'promo' | 'alert' | 'wallet';
//   title: string;
//   message: string;
//   read: boolean;
//   href?: string;
//   meta?: { label: string; value: string; tone?: 'up' | 'down' | 'neutral' }[];
//   createdAt: Date;
// }

// const NotificationSchema = new Schema<INotification>(
//   {
//     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
//     type: { 
//       type: String, 
//       enum: ['trade', 'system', 'promo', 'alert', 'wallet'], 
//       required: true 
//     },
//     title: { type: String, required: true },
//     message: { type: String, required: true },
//     read: { type: Boolean, default: false, index: true },
//     href: { type: String },
//     meta: [{
//       label: { type: String },
//       value: { type: String },
//       tone: { type: String, enum: ['up', 'down', 'neutral'] }
//     }]
//   },
//   { timestamps: { createdAt: true, updatedAt: false } }
// );

// const Notification: Model<INotification> = 
//   mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

// export default Notification;