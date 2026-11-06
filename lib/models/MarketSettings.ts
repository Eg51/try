// lib/models/MarketSettings.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type TrendType = 'bullish' | 'bearish' | 'consolidate';

export interface ITimeBlock {
  trend: TrendType;
  intensity: number; // 1 to 10
}

export interface IMarketSettings extends Document {
  block1: ITimeBlock; // 12am - 7am
  block2: ITimeBlock; // 7:01am - 12pm
  block3: ITimeBlock; // 12:01pm - 6pm
  block4: ITimeBlock; // 6:01pm - 11:59pm
  updatedAt: Date;
}

const TimeBlockSchema = new Schema<ITimeBlock>({
  trend: { type: String, enum: ['bullish', 'bearish', 'consolidate'], default: 'consolidate' },
  intensity: { type: Number, min: 1, max: 10, default: 5 },
}, { _id: false });

const MarketSettingsSchema = new Schema<IMarketSettings>(
  {
    block1: { type: TimeBlockSchema, default: { trend: 'consolidate', intensity: 5 } },
    block2: { type: TimeBlockSchema, default: { trend: 'consolidate', intensity: 5 } },
    block3: { type: TimeBlockSchema, default: { trend: 'consolidate', intensity: 5 } },
    block4: { type: TimeBlockSchema, default: { trend: 'consolidate', intensity: 5 } },
  },
  { timestamps: true }
);

const MarketSettings: Model<IMarketSettings> = 
  mongoose.models.MarketSettings || mongoose.model<IMarketSettings>('MarketSettings', MarketSettingsSchema);

export default MarketSettings;