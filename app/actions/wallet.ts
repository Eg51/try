// app/actions/wallet.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount, PaymentRequest } from "@/lib/models/Ledger";
import { createSystemNotification } from "@/lib/models/Notification"; // 👈 Imported Helper
import { revalidatePath } from "next/cache";

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

// 👇 NEW: The missing action to create a deposit or withdrawal
export async function createPaymentRequestAction(data: {
  type: 'deposit' | 'withdrawal';
  amount: number;
  assetId: string;
  method: string;
}) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  try {
    const amountInCents = Math.round(data.amount * 100);

    // 1. Create the payment request in DB
    await PaymentRequest.create({
      userId: session.id,
      type: data.type,
      amount: amountInCents,
      assetId: data.assetId,
      method: data.method,
      status: "pending",
    });

    // 2. Fire the notification to the user
    await createSystemNotification(
      session.id,
      "wallet",
      `${data.type === "deposit" ? "Deposit" : "Withdrawal"} Requested`,
      `Your request to ${data.type} ${data.amount} ${data.assetId} via ${data.method} is pending approval.`,
      "/dashboard/wallet"
    );

    revalidatePath("/dashboard/wallet");
    return { success: true };
  } catch (error) {
    console.error("Payment request error:", error);
    return { error: "Failed to create payment request." };
  }
}





// // app/actions/wallet.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import { LedgerAccount, PaymentRequest } from "@/lib/models/Ledger";

// export async function getUserBalances() {
//   try {
//     const session = await getServerSession();
//     if (!session) throw new Error("Unauthorized");

//     await connectDB();

//     const accounts = await LedgerAccount.find({ userId: session.id }).lean();
    
//     // Fetch the latest 10 transactions
//     const requests = await PaymentRequest.find({ userId: session.id })
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .lean();

//     return {
//       success: true,
//       balances: accounts.map((acc) => ({
//         assetId: acc.assetId,
//         type: acc.type,
//         balance: acc.cachedBalance / 100, // Convert cents to decimal
//       })),
//       transactions: requests.map((req) => ({
//         id: req._id.toString(),
//         type: req.type === 'deposit' ? 'Deposit' : 'Withdrawal',
//         amount: req.amount / 100,
//         method: req.method,
//         status: req.status,
//         rejectionReason: req.rejectionReason,
//         date: new Date(req.createdAt).toLocaleDateString(),
//         up: req.type === 'deposit',
//       })),
//     };
//   } catch (error) {
//     console.error("Error fetching balances:", error);
//     return { success: false, balances: [], transactions: [] };
//   }
// }