// lib/models/DemoSession.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDemoPosition {
  id: string;
  asset: string;
  type: string;
  size: string;
  entry: string;
  current: string;
  pnl: string;
  pnlPct: string;
  isProfit: boolean;
  tp: string | null;
  sl: string | null;
  status: string;
}

export interface IDemoActivity {
  id: string;
  type: string;
  asset: string;
  amount: string;
  status: string;
  date: string;
}

export interface IDemoSession extends Document {
  sessionId: string;
  ngnBalance: number;
  btcBalance: number;
  positions: IDemoPosition[];
  activity: IDemoActivity[];
  createdAt: Date;
}

const PositionSchema = new Schema<IDemoPosition>({
  id: { type: String, required: true },
  asset: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: String, required: true },
  entry: { type: String, required: true },
  current: { type: String, required: true },
  pnl: { type: String, required: true },
  pnlPct: { type: String, required: true },
  isProfit: { type: Boolean, required: true },
  tp: { type: String, default: null },
  sl: { type: String, default: null },
  status: { type: String, required: true },
}, { _id: false });

const ActivitySchema = new Schema<IDemoActivity>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  asset: { type: String, required: true },
  amount: { type: String, required: true },
  status: { type: String, required: true },
  date: { type: String, required: true },
}, { _id: false });

const DemoSessionSchema = new Schema<IDemoSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    ngnBalance: { type: Number, default: 4_250_000 },
    btcBalance: { type: Number, default: 0.045 },
    positions: { type: [PositionSchema], default: [
      { id: "demo-1", asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true, tp: "$68,000", sl: "$63,000", status: "increasing" },
      { id: "demo-2", asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true, tp: "$3,400", sl: "$3,700", status: "stable" },
      { id: "demo-3", asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false, tp: "$160", sl: "$140", status: "falling" }
    ]},
    activity: { type: [ActivitySchema], default: [
      { id: "demo-a1", type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
      { id: "demo-a2", type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
      { id: "demo-a3", type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" }
    ]},
  },
  { timestamps: true }
);

// 👇 TTL INDEX: Auto-delete demo sessions after 24 hours to save space
DemoSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const DemoSession: Model<IDemoSession> = 
  mongoose.models.DemoSession || mongoose.model<IDemoSession>('DemoSession', DemoSessionSchema);