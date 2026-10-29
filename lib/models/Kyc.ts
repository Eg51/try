// lib/models/Kyc.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKycSubmission extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'unverified' | 'pending' | 'approved' | 'rejected';
  tierRequested: 1 | 2 | 3;
  documents: {
    idType: string;
    idNumber: string;
    proofOfAddressUrl?: string; // Optional because it's only for Tier 2+
    sourceOfWealthUrl?: string; // Optional because it's only for Tier 3
    selfieLivenessUrl?: string; // Required for Tier 1, but optional in DB just in case
  };
  rejectionReason?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}

const KycSchema = new Schema<IKycSubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['unverified', 'pending', 'approved', 'rejected'], default: 'pending' },
    tierRequested: { type: Number, enum: [1, 2, 3], required: true },
    documents: {
      idType: { type: String, required: true },
      idNumber: { type: String, required: true },
      proofOfAddressUrl: { type: String },
      sourceOfWealthUrl: { type: String },
      selfieLivenessUrl: { type: String },
    },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const KycSubmission: Model<IKycSubmission> = 
  mongoose.models.KycSubmission || mongoose.model<IKycSubmission>('KycSubmission', KycSchema);