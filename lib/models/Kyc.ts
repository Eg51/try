// lib/models/Kyc.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKycSubmission extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'unverified' | 'pending' | 'approved' | 'rejected';
  tierRequested: 1 | 2 | 3;
  documents: {
    idType: string; // e.g., "National ID", "Passport"
    idNumber: string;
    proofOfAddressUrl: string; // In a real app, this is the S3/Cloudinary URL
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
      proofOfAddressUrl: { type: String, required: true }, // Mock URL for now
    },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const KycSubmission: Model<IKycSubmission> = 
  mongoose.models.KycSubmission || mongoose.model<IKycSubmission>('KycSubmission', KycSchema);