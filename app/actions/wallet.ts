// app/actions/wallet.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount, PaymentRequest } from "@/lib/models/Ledger";

export async function getUserBalances() {
  try {
    const session = await getServerSession();
    if (!session) throw new Error("Unauthorized");

    await connectDB();

    const accounts = await LedgerAccount.find({ userId: session.id }).lean();
    
    // Fetch the latest 10 transactions
    const requests = await PaymentRequest.find({ userId: session.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      success: true,
      balances: accounts.map((acc) => ({
        assetId: acc.assetId,
        type: acc.type,
        balance: acc.cachedBalance / 100, // Convert cents to decimal
      })),
      transactions: requests.map((req) => ({
        id: req._id.toString(),
        type: req.type === 'deposit' ? 'Deposit' : 'Withdrawal',
        amount: req.amount / 100,
        method: req.method,
        status: req.status,
        rejectionReason: req.rejectionReason,
        date: new Date(req.createdAt).toLocaleDateString(),
        up: req.type === 'deposit',
      })),
    };
  } catch (error) {
    console.error("Error fetching balances:", error);
    return { success: false, balances: [], transactions: [] };
  }
}