// lib/models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { encrypt, decrypt } from '../encryption';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  passwordHash?: string;
  displayName: string;
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
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    displayName: { type: String, required: true },
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
  },
  { timestamps: true }
);

// 👇 ENCRYPTION HOOKS (Using async to avoid 'next' type error)
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
    return ret;
  }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
// // lib/models/User.ts
// import mongoose, { Schema, Document, Model } from 'mongoose';

// export interface IUser extends Document {
//   firebaseUid: string;
//   email: string;
//   passwordHash?: string;
//   displayName: string;
//   role: 'user' | 'admin';
//   status: 'active' | 'suspended' | 'closed';
//   kycTier: 0 | 1 | 2 | 3;
//   displayCurrency: { assetId: string; selectedAt: Date; };
//   preferences: { 
//     theme: 'dark' | 'light' | 'auto'; 
//     notifications: boolean; 
//     language?: string; // 👈 ADDED
//   };
//   xp: number;
//   coins: number;
//   completedTasks: string[];
//   claimedBadges: string[];
//   favorites: string[];
//   lastSeenAt: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const UserSchema = new Schema<IUser>(
//   {
//     firebaseUid: { type: String, required: true, unique: true, index: true },
//     email: { type: String, required: true, unique: true, index: true },
//     passwordHash: { type: String },
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
//       language: { type: String, default: 'English (US)' }, // 👈 ADDED
//     },
//     xp: { type: Number, default: 0 },
//     coins: { type: Number, default: 0 },
//     completedTasks: { type: [String], default: [] },
//     claimedBadges: { type: [String], default: [] },
//     favorites: { type: [String], default: [] },
//     lastSeenAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// UserSchema.set('toJSON', {
//   transform: (doc, ret: any) => {
//     delete ret.__v;
//     delete ret.passwordHash;
//     return ret;
//   }
// });

// const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
// export default User;