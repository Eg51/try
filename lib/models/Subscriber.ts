// lib/models/Subscriber.ts
import mongoose, { Schema, Document, models } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  createdAt: Date;
}

const SubscriberSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

const Subscriber = models.Subscriber || mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;