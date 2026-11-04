// lib/models/Settings.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  platformFeePercent: number;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    platformFeePercent: { type: Number, default: 0.1 }, // 0.1%
  },
  { timestamps: true }
);

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
export default Settings;