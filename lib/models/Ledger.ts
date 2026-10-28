// lib/models/Ledger.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// 1. LEDGER ACCOUNT
// ==========================================
export interface ILedgerAccount extends Document {
  userId: mongoose.Types.ObjectId | null;
  assetId: string;
  type: 'available' | 'escrow' | 'fee' | 'system';
  cachedBalance: number;
  version: number;
  status: 'active' | 'frozen' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const LedgerAccountSchema = new Schema<ILedgerAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assetId: { type: String, required: true, index: true },
    type: { type: String, enum: ['available', 'escrow', 'fee', 'system'], required: true },
    cachedBalance: { type: Number, required: true, default: 0 },
    version: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'frozen', 'closed'], default: 'active' },
  },
  { timestamps: true }
);

// Notice the index is changed. It now accounts for null userIds for system accounts.
LedgerAccountSchema.index({ userId: 1, assetId: 1, type: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } });
LedgerAccountSchema.index({ assetId: 1, type: 1 }, { unique: true, partialFilterExpression: { userId: null } });

export const LedgerAccount: Model<ILedgerAccount> = 
  mongoose.models.LedgerAccount || mongoose.model<ILedgerAccount>('LedgerAccount', LedgerAccountSchema);

// ==========================================
// 2. LEDGER TRANSACTION (Double-Entry)
// ==========================================
export interface ILedgerEntry {
  accountId: mongoose.Types.ObjectId;
  direction: 'debit' | 'credit';
  amount: number;
  balanceAfter: number;
  assetId: string;
}

export interface ILedgerTransaction extends Document {
  kind: 'deposit' | 'trade' | 'fee' | 'withdrawal' | 'adjustment';
  refType: 'order' | 'trade' | 'manual';
  refId: string;
  idempotencyKey: string;
  entries: ILedgerEntry[];
  createdAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>({
  accountId: { type: Schema.Types.ObjectId, ref: 'LedgerAccount', required: true },
  direction: { type: String, enum: ['debit', 'credit'], required: true },
  amount: { type: Number, required: true, min: 1 },
  balanceAfter: { type: Number, required: true },
  assetId: { type: String, required: true },
}, { _id: false });

const LedgerTransactionSchema = new Schema<ILedgerTransaction>(
  {
    kind: { 
      type: String, 
      enum: ['deposit', 'trade', 'fee', 'withdrawal', 'adjustment'], 
      required: true 
    },
    refType: { type: String, enum: ['order', 'trade', 'manual'], required: true },
    refId: { type: String, required: true, index: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    entries: { type: [LedgerEntrySchema], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// FIX: Use async function and throw, rather than next() callbacks
LedgerTransactionSchema.pre('save', async function (this: ILedgerTransaction) {
  const assetBalances: Record<string, number> = {};

  // 1. Calculate the total credits and debits for EACH asset
  for (const entry of this.entries) {
    if (!assetBalances[entry.assetId]) {
      assetBalances[entry.assetId] = 0;
    }
    const amount = entry.direction === 'credit' ? entry.amount : -entry.amount;
    assetBalances[entry.assetId] += amount;
  }

  // 2. Verify that every single asset sums exactly to zero
  for (const [assetId, balance] of Object.entries(assetBalances)) {
    if (balance !== 0) {
      throw new Error(`Ledger imbalance for ${assetId}: Must sum to zero, but got ${balance}`);
    }
  }
});

export const LedgerTransaction: Model<ILedgerTransaction> = 
  mongoose.models.LedgerTransaction || mongoose.model<ILedgerTransaction>('LedgerTransaction', LedgerTransactionSchema);