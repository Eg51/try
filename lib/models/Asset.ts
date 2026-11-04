// lib/models/Asset.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAsset extends Document {
  symbol: string;
  name: string;
  category: 'commodity' | 'crypto' | 'fiat' | 'memes';
  basePrice: number;
  color: string;
  isActive: boolean;
  createdAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['commodity', 'crypto', 'fiat', 'memes'], required: true },
    basePrice: { type: Number, required: true },
    color: { type: String, default: '#84cc16' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Asset: Model<IAsset> = mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
export default Asset;