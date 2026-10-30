// lib/models/Kyc.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKycSubmission extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'unverified' | 'pending' | 'approved' | 'rejected';
  tierRequested: 1 | 2 | 3;
  
  // 👇 ADDED PERSONAL & ADDRESS DETAILS
  personalDetails: {
    legalName: string;
    dob: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    state: string;
    country: string;
  };

  documents: {
    idType: string;
    idNumber?: string; // 👈 Made optional so Passports don't fail validation
    proofOfAddressUrl?: string; 
    sourceOfWealthUrl?: string; 
    selfieLivenessUrl?: string; 
    idDocumentUrl?: string; // 👈 Added to save the Base64 ID image
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
    
    // 👇 ADDED TO SCHEMA
    personalDetails: {
      legalName: { type: String, required: true },
      dob: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },

    documents: {
      idType: { type: String, required: true },
      idNumber: { type: String }, // No longer strictly required
      proofOfAddressUrl: { type: String },
      sourceOfWealthUrl: { type: String },
      selfieLivenessUrl: { type: String },
      idDocumentUrl: { type: String },
    },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const KycSubmission: Model<IKycSubmission> = 
  mongoose.models.KycSubmission || mongoose.model<IKycSubmission>('KycSubmission', KycSchema);