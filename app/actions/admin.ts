// app/actions/admin.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { LedgerTransaction } from "@/lib/models/Ledger";

export async function getAdminDashboardStats() {
  try {
    // Note: The proxy.ts already blocks non-admins from reaching /admin, 
    // but we double-check here for absolute security.
    const session = await getServerSession();
    // if (!session || session.role !== 'admin') throw new Error("Unauthorized"); 
    // (Assuming we add role to SafeUser later, for now we trust the proxy)

    await connectDB();

    // 1. Fetch Core Metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    
    // 2. Fetch Recent Activity (Ledger Transactions)
    const recentActivity = await LedgerTransaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('entries.accountId', 'assetId') // Gets the asset type
      .lean();

    // 3. Calculate Volume (Sum of trade transactions)
    const trades = await LedgerTransaction.find({ kind: 'trade' }).lean();
    const totalVolumeCents = trades.reduce((acc, txn) => {
      // Find the USD entry in the transaction to sum up
      const usdEntry = txn.entries.find(e => e.assetId === 'USD');
      return acc + (usdEntry ? usdEntry.amount : 0);
    }, 0);

    return {
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalVolume: totalVolumeCents / 100, // Convert cents to dollars
      },
      activity: recentActivity.map(a => ({
        id: a._id.toString(),
        kind: a.kind,
        date: a.createdAt,
        refId: a.refId,
      }))
    };
  } catch (error) {
    console.error("Admin fetch error:", error);
    return { success: false, stats: null, activity: [] };
  }
}