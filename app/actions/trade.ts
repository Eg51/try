
// app/actions/trade.ts
"use server";

import { z } from "zod";
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount, LedgerTransaction } from "@/lib/models/Ledger";
import mongoose from "mongoose";

const orderSchema = z.object({
  pair: z.string(), // e.g., "BTC-USD"
  side: z.enum(["buy", "sell"]),
  price: z.number().positive(),
  amount: z.number().positive(),
});

export async function placeOrderAction(rawData: unknown) {
  try {
    const session = await getServerSession();
    if (!session) return { error: "Unauthorized. Please log in." };

    const parsed = orderSchema.safeParse(rawData);
    if (!parsed.success) return { error: "Invalid order data." };

    const { pair, side, price, amount } = parsed.data;
    const [baseAsset, quoteAsset] = pair.split("-"); // BTC, USD
    const totalCost = price * amount;

    await connectDB();

    // 1. Fetch user's ledger accounts
    const quoteAccount = await LedgerAccount.findOne({ userId: session.id, assetId: quoteAsset, type: 'available' });
    const baseAccount = await LedgerAccount.findOne({ userId: session.id, assetId: baseAsset, type: 'available' });

    if (!quoteAccount || !baseAccount) return { error: "Ledger accounts not found." };

    // Convert decimals to cents (integers) for the database
    const costInCents = Math.round(totalCost * 100);
    const amountInCents = Math.round(amount * 100);

    // 2. SECURITY: Check if they have enough balance
    if (side === "buy" && quoteAccount.cachedBalance < costInCents) {
      return { error: `Insufficient ${quoteAsset} balance.` };
    }
    if (side === "sell" && baseAccount.cachedBalance < amountInCents) {
      return { error: `Insufficient ${baseAsset} balance.` };
    }

    // 3. Execute the trade (Atomic updates)
    const idempotencyKey = `trade_${Date.now()}_${session.id}`;
    
    if (side === "buy") {
      // Deduct USD, Add BTC
      await LedgerAccount.updateOne({ _id: quoteAccount._id }, { $inc: { cachedBalance: -costInCents } });
      await LedgerAccount.updateOne({ _id: baseAccount._id }, { $inc: { cachedBalance: amountInCents } });
    } else {
      // Deduct BTC, Add USD
      await LedgerAccount.updateOne({ _id: baseAccount._id }, { $inc: { cachedBalance: -amountInCents } });
      await LedgerAccount.updateOne({ _id: quoteAccount._id }, { $inc: { cachedBalance: costInCents } });
    }

    // 4. Log the transaction in the immutable ledger
    await LedgerTransaction.create({
      kind: 'trade',
      refType: 'trade',
      refId: `mock_trade_${Date.now()}`,
      idempotencyKey,
      entries: [
        {
          accountId: quoteAccount._id,
          direction: side === "buy" ? 'debit' : 'credit',
          amount: costInCents,
          balanceAfter: side === "buy" ? quoteAccount.cachedBalance - costInCents : quoteAccount.cachedBalance + costInCents,
          assetId: quoteAsset,
        },
        {
          accountId: baseAccount._id,
          direction: side === "buy" ? 'credit' : 'debit',
          amount: amountInCents,
          balanceAfter: side === "buy" ? baseAccount.cachedBalance + amountInCents : baseAccount.cachedBalance - amountInCents,
          assetId: baseAsset,
        }
      ]
    });

    return { success: true, message: "Trade executed successfully!" };

  } catch (error: any) {
    console.error("Trade error:", error);
    return { error: "Failed to execute trade. Please try again." };
  }
}
// // app/actions/trade.ts
// "use server";

// import { z } from "zod";
// import { getServerSession } from "@/lib/auth"; // Your Firebase verification
// import connectDB from "@/lib/db";
// import Order from "@/lib/models/Order";
// import { safeAction } from "@/lib/safe-action"; // A wrapper that catches errors

// const orderSchema = z.object({
//   pairId: z.string().min(3),
//   side: z.enum(["buy", "sell"]),
//   type: z.enum(["market", "limit"]),
//   quantity: z.number().positive().max(1000000), // SECURITY: Prevent integer overflow or absurd sizes
// });

// export async function placeOrderAction(rawData: unknown) {
//   // 1. Authenticate (Who is this?)
//   const user = await getServerSession();
//   if (!user) return { error: "Unauthorized" };

//   // 2. Validate input (Zod)
//   const parsed = orderSchema.safeParse(rawData);
//   if (!parsed.success) return { error: "Invalid input data" };

//   const { pairId, side, type, quantity } = parsed.data;

//   await connectDB();

//   // 3. SECURITY: Check user tier
//   if (user.tier < 1) {
//     return { error: "You must complete KYC Tier 1 to trade." };
//   }

//   // 4. SECURITY: Re-fetch REAL price from Redis/DB (Never trust client price)
//   const realPrice = await getRealTimePrice(pairId); 
//   const totalCost = realPrice * quantity;

//   // 5. SECURITY: Check balance
//   const balance = await getBalance(user.id, pairId.split("-")[1]); // Quote asset
//   if (balance < totalCost) {
//     return { error: "Insufficient funds." };
//   }

//   // 6. Create the order
//   try {
//     await Order.create({
//       userId: user.id,
//       pairId,
//       side,
//       type,
//       quantity,
//       price: realPrice,
//       status: "pending",
//     });

//     return { success: true };
//   } catch (err) {
//     return { error: "System error. Please try again." };
//   }
// }