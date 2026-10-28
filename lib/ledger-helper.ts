// lib/ledger-helper.ts
import connectDB from './db';
import { LedgerAccount } from './models/Ledger';

export const SUPPORTED_ASSETS = ["USD", "BTC", "ETH", "DOGE"];

/**
 * Ensures the system account for a specific asset exists.
 */
export async function getSystemAccount(assetId: string) {
  await connectDB();
  
  let systemAccount = await LedgerAccount.findOne({ 
    userId: null, 
    assetId, 
    type: 'system' 
  });

  if (!systemAccount) {
    // If it doesn't exist, create it with a massive balance (since the system is the counterparty to all trades)
    // In a real app, the system starts at 0, and users deposit into it.
    systemAccount = await LedgerAccount.create({
      userId: null,
      assetId,
      type: 'system',
      cachedBalance: 1000000000000, // Mock liquidity
    });
  }

  return systemAccount;
}

/**
 * Safely updates a ledger account balance.
 */
export async function updateAccountBalance(accountId: string, amountInCents: number) {
  await LedgerAccount.updateOne(
    { _id: accountId },
    { $inc: { cachedBalance: amountInCents } }
  );
}