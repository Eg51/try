// lib/models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { encrypt, decrypt } from '../encryption';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  passwordHash?: string;
  deviceIds: string[]; 
  displayName: string;
  country?: string; // 👈 ADDED
  phone?: string;   // 👈 ADDED
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'closed';
  kycTier: 0 | 1 | 2 | 3;
  displayCurrency: { assetId: string; selectedAt: Date; };
  preferences: { 
    theme: 'dark' | 'light' | 'auto'; 
    notifications: boolean; 
    language?: string; 
  };
  xp: number;
  coins: number;
  completedTasks: string[];
  claimedBadges: string[];
  favorites: string[];
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  failedOtpAttempts: number; 
  isResetBlocked: boolean;   
  lockedUntil?: Date; 
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    deviceIds: { type: [String], default: [], index: true },
    displayName: { type: String, required: true },
    country: { type: String }, // 👈 ADDED
    phone: { type: String },   // 👈 ADDED
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'suspended', 'closed'], default: 'active', index: true },
    kycTier: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    displayCurrency: {
      assetId: { type: String, default: 'USD' },
      selectedAt: { type: Date, default: Date.now },
    },
    preferences: {
      theme: { type: String, enum: ['dark', 'light', 'auto'], default: 'dark' },
      notifications: { type: Boolean, default: true },
      language: { type: String, default: 'English (US)' },
    },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    completedTasks: { type: [String], default: [] },
    claimedBadges: { type: [String], default: [] },
    favorites: { type: [String], default: [] },
    lastSeenAt: { type: Date, default: Date.now },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    failedOtpAttempts: { type: Number, default: 0 }, 
    isResetBlocked: { type: Boolean, default: false }, 
    lockedUntil: { type: Date }, 
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (this.isModified('displayName')) {
    this.displayName = encrypt(this.displayName);
  }
});

UserSchema.post('init', function (doc: any) {
  if (doc.displayName) {
    doc.displayName = decrypt(doc.displayName);
  }
});

UserSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.deviceIds;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.failedOtpAttempts;
    delete ret.isResetBlocked;
    return ret;
  }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;










// // lib/models/User.ts
// import mongoose, { Schema, Document, Model } from 'mongoose';
// import { encrypt, decrypt } from '../encryption';

// export interface IUser extends Document {
//   firebaseUid: string;
//   email: string;
//   passwordHash?: string;
//   deviceIds: string[]; 
//   displayName: string;
//   role: 'user' | 'admin';
//   status: 'active' | 'suspended' | 'closed';
//   kycTier: 0 | 1 | 2 | 3;
//   displayCurrency: { assetId: string; selectedAt: Date; };
//   preferences: { 
//     theme: 'dark' | 'light' | 'auto'; 
//     notifications: boolean; 
//     language?: string; 
//   };
//   xp: number;
//   coins: number;
//   completedTasks: string[];
//   claimedBadges: string[];
//   favorites: string[];
//   lastSeenAt: Date;
//   createdAt: Date;
//   updatedAt: Date;
//   resetPasswordToken?: string;
//   resetPasswordExpires?: Date;
//   failedOtpAttempts: number; 
//   isResetBlocked: boolean;   
//   lockedUntil?: Date; // 👈 FIXED: Added here
// }

// const UserSchema = new Schema<IUser>(
//   {
//     firebaseUid: { type: String, required: true, unique: true, index: true },
//     email: { type: String, required: true, unique: true, index: true },
//     passwordHash: { type: String },
//     deviceIds: { type: [String], default: [], index: true },
//     displayName: { type: String, required: true },
//     role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
//     status: { type: String, enum: ['active', 'suspended', 'closed'], default: 'active', index: true },
//     kycTier: { type: Number, enum: [0, 1, 2, 3], default: 0 },
//     displayCurrency: {
//       assetId: { type: String, default: 'USD' },
//       selectedAt: { type: Date, default: Date.now },
//     },
//     preferences: {
//       theme: { type: String, enum: ['dark', 'light', 'auto'], default: 'dark' },
//       notifications: { type: Boolean, default: true },
//       language: { type: String, default: 'English (US)' },
//     },
//     xp: { type: Number, default: 0 },
//     coins: { type: Number, default: 0 },
//     completedTasks: { type: [String], default: [] },
//     claimedBadges: { type: [String], default: [] },
//     favorites: { type: [String], default: [] },
//     lastSeenAt: { type: Date, default: Date.now },
//     resetPasswordToken: { type: String },
//     resetPasswordExpires: { type: Date },
//     failedOtpAttempts: { type: Number, default: 0 }, 
//     isResetBlocked: { type: Boolean, default: false }, 
//     lockedUntil: { type: Date }, // 👈 FIXED: Added here
//   },
//   { timestamps: true }
// );

// UserSchema.pre('save', async function () {
//   if (this.isModified('displayName')) {
//     this.displayName = encrypt(this.displayName);
//   }
// });

// UserSchema.post('init', function (doc: any) {
//   if (doc.displayName) {
//     doc.displayName = decrypt(doc.displayName);
//   }
// });

// UserSchema.set('toJSON', {
//   transform: (doc, ret: any) => {
//     delete ret.__v;
//     delete ret.passwordHash;
//     delete ret.deviceIds;
//     delete ret.resetPasswordToken;
//     delete ret.resetPasswordExpires;
//     delete ret.failedOtpAttempts;
//     delete ret.isResetBlocked;
//     return ret;
//   }
// });

// const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
// export default User;

