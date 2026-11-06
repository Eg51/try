// app/actions/admin-ledger.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount, LedgerTransaction } from "@/lib/models/Ledger";
import { getSystemAccount, updateAccountBalance } from "@/lib/ledger-helper";
import { revalidatePath } from "next/cache";

export async function adjustUserBalance(data: {
  userId: string;
  assetId: string;
  amount: number; // Positive for credit, negative for debit
  reason: string;
}) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };

  if (data.amount === 0) return { error: "Amount cannot be zero." };

  await connectDB();

  try {
    // 1. Get or create the user's available account
    const userAccount = await LedgerAccount.findOneAndUpdate(
      { userId: data.userId, assetId: data.assetId, type: "available" },
      { $setOnInsert: { cachedBalance: 0, status: "active" } },
      { upsert: true, new: true }
    );

    // 2. Get the system account
    const systemAccount = await getSystemAccount(data.assetId);

    const amountInCents = Math.round(data.amount * 100);
    const idempotencyKey = `admin_adjust_${Date.now()}_${data.userId}`;

    // 3. Update Balances
    await updateAccountBalance(userAccount._id.toString(), amountInCents);
    await updateAccountBalance(systemAccount._id.toString(), -amountInCents);

    // 4. Create immutable Ledger Entries
    const entries = [
      {
        accountId: userAccount._id,
        direction: amountInCents > 0 ? "credit" : "debit",
        amount: Math.abs(amountInCents),
        balanceAfter: userAccount.cachedBalance + amountInCents,
        assetId: data.assetId,
      },
      {
        accountId: systemAccount._id,
        direction: amountInCents > 0 ? "debit" : "credit",
        amount: Math.abs(amountInCents),
        balanceAfter: systemAccount.cachedBalance - amountInCents,
        assetId: data.assetId,
      },
    ];

    await LedgerTransaction.create({
      kind: "adjustment",
      refType: "manual",
      refId: `admin_adjust_${data.userId}`,
      idempotencyKey,
      entries: entries as any,
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/ledger");
    return { success: true };
  } catch (error: any) {
    console.error("Adjustment error:", error);
    return { error: "Failed to adjust balance." };
  }
}