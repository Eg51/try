// app/actions/admin-ledger.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount, LedgerTransaction } from "@/lib/models/Ledger";
import { getSystemAccount, updateAccountBalance } from "@/lib/ledger-helper";
import { revalidatePath } from "next/cache";
import { createSystemNotification } from "@/lib/models/Notification";

export async function adjustUserBalance(data: {
  userId: string;
  assetId: string;
  amount: number;
  reason: string;
}) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };

  if (data.amount === 0) return { error: "Amount cannot be zero." };

  await connectDB();

  try {
    const userAccount = await LedgerAccount.findOneAndUpdate(
      { userId: data.userId, assetId: data.assetId, type: "available" },
      { $setOnInsert: { cachedBalance: 0, status: "active" } },
      { upsert: true, new: true }
    );

    const systemAccount = await getSystemAccount(data.assetId);
    const amountInCents = Math.round(data.amount * 100);

    // 👇 MOLE 2 FIXED: Prevent Negative Balances
    if (userAccount.cachedBalance + amountInCents < 0) {
      return { error: "Adjustment failed: User balance cannot go negative." };
    }

    const idempotencyKey = `admin_adjust_${Date.now()}_${data.userId}`;

    // 👇 MOLE 3 FIXED: Try/Catch with Rollback
    try {
      await updateAccountBalance(userAccount._id.toString(), amountInCents);
      await updateAccountBalance(systemAccount._id.toString(), -amountInCents);

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
    } catch (ledgerError) {
      // 🚨 ROLLBACK: If the ledger fails, we must revert the balances
      console.error("Ledger transaction failed. Rolling back balances...", ledgerError);
      await updateAccountBalance(userAccount._id.toString(), -amountInCents);
      await updateAccountBalance(systemAccount._id.toString(), amountInCents);
      
      return { error: "System error: Ledger imbalance detected. Balances have been safely rolled back." };
    }

    await createSystemNotification(
      data.userId,
      "alert",
      "Balance Adjusted",
      `An administrator adjusted your ${data.assetId} balance by ${data.amount > 0 ? '+' : ''}${data.amount}. Reason: ${data.reason}`,
      "/dashboard/wallet"
    );

    revalidatePath("/admin/users");
    revalidatePath("/admin/ledger");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/wallet");

    return { success: true };
  } catch (error: any) {
    console.error("Adjustment error:", error);
    return { error: "Failed to adjust balance." };
  }
}










// // app/actions/admin-ledger.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import { LedgerAccount, LedgerTransaction } from "@/lib/models/Ledger";
// import { getSystemAccount, updateAccountBalance } from "@/lib/ledger-helper";
// import { revalidatePath } from "next/cache";
// import { createSystemNotification } from "@/lib/models/Notification";

// export async function adjustUserBalance(data: {
//   userId: string;
//   assetId: string;
//   amount: number;
//   reason: string;
// }) {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   if (data.amount === 0) return { error: "Amount cannot be zero." };

//   await connectDB();

//   try {
//     const userAccount = await LedgerAccount.findOneAndUpdate(
//       { userId: data.userId, assetId: data.assetId, type: "available" },
//       { $setOnInsert: { cachedBalance: 0, status: "active" } },
//       { upsert: true, new: true }
//     );

//     const systemAccount = await getSystemAccount(data.assetId);

//     const amountInCents = Math.round(data.amount * 100);
//     const idempotencyKey = `admin_adjust_${Date.now()}_${data.userId}`;

//     await updateAccountBalance(userAccount._id.toString(), amountInCents);
//     await updateAccountBalance(systemAccount._id.toString(), -amountInCents);

//     const entries = [
//       {
//         accountId: userAccount._id,
//         direction: amountInCents > 0 ? "credit" : "debit",
//         amount: Math.abs(amountInCents),
//         balanceAfter: userAccount.cachedBalance + amountInCents,
//         assetId: data.assetId,
//       },
//       {
//         accountId: systemAccount._id,
//         direction: amountInCents > 0 ? "debit" : "credit",
//         amount: Math.abs(amountInCents),
//         balanceAfter: systemAccount.cachedBalance - amountInCents,
//         assetId: data.assetId,
//       },
//     ];

//     await LedgerTransaction.create({
//       kind: "adjustment",
//       refType: "manual",
//       refId: `admin_adjust_${data.userId}`,
//       idempotencyKey,
//       entries: entries as any,
//     });

//     await createSystemNotification(
//       data.userId,
//       "alert",
//       "Balance Adjusted",
//       `An administrator adjusted your ${data.assetId} balance by ${data.amount > 0 ? '+' : ''}${data.amount}. Reason: ${data.reason}`,
//       "/dashboard/wallet"
//     );

//     revalidatePath("/admin/users");
//     revalidatePath("/admin/ledger");
//     revalidatePath("/dashboard");
//     revalidatePath("/dashboard/wallet");

//     return { success: true };
//   } catch (error: any) {
//     console.error("Adjustment error:", error);
//     return { error: "Failed to adjust balance." };
//   }
// }

