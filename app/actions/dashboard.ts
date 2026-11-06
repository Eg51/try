// app/actions/dashboard.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount, LedgerTransaction } from "@/lib/models/Ledger";
import Trade from "@/lib/models/Trade";

export async function getDashboardData() {
  const session = await getServerSession();
  if (!session) return { balances: [], trades: [], activity: [] };

  await connectDB();

  // 1. Get User Balances (Available accounts only)
  const balances = await LedgerAccount.find({ 
    userId: session.id, 
    type: "available" 
  }).lean();

  // 2. Get Open Trades
  const trades = await Trade.find({ 
    userId: session.id, 
    status: "open" 
  }).sort({ createdAt: -1 }).lean();

  // 3. Get Recent Ledger Activity
  const accountIds = balances.map((b: any) => b._id);
  const activity = await LedgerTransaction.find({
    "entries.accountId": { $in: accountIds }
  })
  .sort({ createdAt: -1 })
  .limit(10)
  .lean();

  // Serialize for client components
  return JSON.parse(JSON.stringify({
    balances,
    trades,
    activity
  }));
}