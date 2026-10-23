// app/actions/wallet.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount } from "@/lib/models/Ledger";

export async function getUserBalances() {
  try {
    const session = await getServerSession();
    if (!session) throw new Error("Unauthorized");

    await connectDB();

    // Fetch all ledger accounts for this user
    const accounts = await LedgerAccount.find({ userId: session.id }).lean();

    // Map them to a clean, serializable format for the client
    return {
      success: true,
      balances: accounts.map((acc) => ({
        assetId: acc.assetId,
        type: acc.type,
        balance: acc.cachedBalance / 100, // Convert cents to decimal (e.g., 1000 -> $10.00)
      })),
    };
  } catch (error) {
    console.error("Error fetching balances:", error);
    return { success: false, balances: [] };
  }
}