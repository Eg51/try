// lib/models/Trade.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type ChartDrawing = {
  id: string;
  type: "line" | "hline" | "ray" | "rect" | "fib";
  start: { t: number; p: number };
  end: { t: number; p: number };
};

export interface ITrade extends Document {
  userId: mongoose.Types.ObjectId;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  amount: number;
  status: 'open' | 'closed';
  pnl: number;
  drawings: ChartDrawing[];
  closedAt?: Date;
  createdAt: Date;
}

const ChartDrawingSchema = new Schema<ChartDrawing>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["line", "hline", "ray", "rect", "fib"], required: true },
    start: {
      t: { type: Number, required: true },
      p: { type: Number, required: true },
    },
    end: {
      t: { type: Number, required: true },
      p: { type: Number, required: true },
    },
  },
  { _id: false }
);

const TradeSchema = new Schema<ITrade>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pair: { type: String, required: true },
    baseAsset: { type: String, required: true },
    quoteAsset: { type: String, required: true },
    side: { type: String, enum: ['buy', 'sell'], required: true },
    entryPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    pnl: { type: Number, default: 0 },
    drawings: { type: [ChartDrawingSchema], default: [] },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

const Trade: Model<ITrade> =
  mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);
export default Trade;
// // lib/models/Trade.ts
// import mongoose, { Schema, Document, Model } from 'mongoose';

// export type ChartDrawing = {
//   id: string;
//   type: "line" | "hline" | "ray" | "rect" | "fib";
//   start: { t: number; p: number };
//   end: { t: number; p: number };
// };

// export interface ITrade extends Document {
//   userId: mongoose.Types.ObjectId;
//   pair: string;
//   baseAsset: string;
//   quoteAsset: string;
//   side: 'buy' | 'sell';
//   entryPrice: number;
//   amount: number;
//   status: 'open' | 'closed';
//   pnl: number;
//   drawings: ChartDrawing[];
//   closedAt?: Date;
//   createdAt: Date;
// }

// const TradeSchema = new Schema<ITrade>(
//   {
//     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
//     pair: { type: String, required: true },
//     baseAsset: { type: String, required: true },
//     quoteAsset: { type: String, required: true },
//     side: { type: String, enum: ['buy', 'sell'], required: true },
//     entryPrice: { type: Number, required: true },
//     amount: { type: Number, required: true },
//     status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
//     pnl: { type: Number, default: 0 },
//     drawings: { type: Array, default: [] }, // ✅ fixes TS2322
//     closedAt: { type: Date },
//   },
//   { timestamps: true }
// );

// const Trade: Model<ITrade> =
//   mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);
// export default Trade;

 // lib/models/Trade.ts
// import mongoose, { Schema, Document, Model } from 'mongoose';

// export type ChartDrawing = {
//   id: string;
//   type: "line" | "hline";
//   y1: number;
//   x1?: number;
//   x2?: number;
//   y2?: number;
// };

// export interface ITrade extends Document {
//   userId: mongoose.Types.ObjectId;
//   pair: string;
//   baseAsset: string;
//   quoteAsset: string;
//   side: 'buy' | 'sell';
//   entryPrice: number;
//   amount: number;
//   status: 'open' | 'closed';
//   pnl: number;
//   drawings: ChartDrawing[];
//   closedAt?: Date;
//   createdAt: Date;
// }

// const TradeSchema = new Schema<ITrade>(
//   {
//     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
//     pair: { type: String, required: true },
//     baseAsset: { type: String, required: true },
//     quoteAsset: { type: String, required: true },
//     side: { type: String, enum: ['buy', 'sell'], required: true },
//     entryPrice: { type: Number, required: true },
//     amount: { type: Number, required: true },
//     status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
//     pnl: { type: Number, default: 0 },
//     drawings: { type: [Schema.Types.Mixed], default: [] as any[] }, // 👈 FIXED TS ERROR
//     closedAt: { type: Date },
//   },
//   { timestamps: true }
// );

// const Trade: Model<ITrade> = mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);
// export default Trade;