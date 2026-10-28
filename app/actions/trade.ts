// app/actions/trade.ts
"use server";

import { z } from "zod";
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount, LedgerTransaction } from "@/lib/models/Ledger";
import { getSystemAccount, updateAccountBalance } from "@/lib/ledger-helper";
import mongoose from "mongoose";

const orderSchema = z.object({
  pair: z.string(), 
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
    const [baseAsset, quoteAsset] = pair.split("-"); // e.g., BTC, USD
    const totalCost = price * amount;

    await connectDB();

    // 1. Fetch user's ledger accounts
    const userQuoteAccount = await LedgerAccount.findOne({ userId: session.id, assetId: quoteAsset, type: 'available' });
    const userBaseAccount = await LedgerAccount.findOne({ userId: session.id, assetId: baseAsset, type: 'available' });

    if (!userQuoteAccount || !userBaseAccount) return { error: "User ledger accounts not found." };

    // 2. Fetch system's ledger accounts
    const sysQuoteAccount = await getSystemAccount(quoteAsset);
    const sysBaseAccount = await getSystemAccount(baseAsset);

    // Convert decimals to cents (integers) for the database
    const costInCents = Math.round(totalCost * 100);
    const amountInCents = Math.round(amount * 100);

    // 3. SECURITY: Check if they have enough balance
    if (side === "buy" && userQuoteAccount.cachedBalance < costInCents) {
      return { error: `Insufficient ${quoteAsset} balance.` };
    }
    if (side === "sell" && userBaseAccount.cachedBalance < amountInCents) {
      return { error: `Insufficient ${baseAsset} balance.` };
    }

    // 4. Execute the trade (Atomic updates to Account Balances)
    const idempotencyKey = `trade_${Date.now()}_${session.id}`;
    
    if (side === "buy") {
      await updateAccountBalance(userQuoteAccount._id.toString(), -costInCents);
      await updateAccountBalance(sysQuoteAccount._id.toString(), costInCents);
      
      await updateAccountBalance(sysBaseAccount._id.toString(), -amountInCents);
      await updateAccountBalance(userBaseAccount._id.toString(), amountInCents);
    } else {
      await updateAccountBalance(userBaseAccount._id.toString(), -amountInCents);
      await updateAccountBalance(sysBaseAccount._id.toString(), amountInCents);
      
      await updateAccountBalance(sysQuoteAccount._id.toString(), -costInCents);
      await updateAccountBalance(userQuoteAccount._id.toString(), costInCents);
    }

    // 5. Log the transaction in the immutable ledger (4 ENTRIES PER ASSET)
    const entries = side === "buy" 
      ? [
          // Quote Asset (USD) movements
          { accountId: userQuoteAccount._id, direction: 'debit', amount: costInCents, balanceAfter: userQuoteAccount.cachedBalance - costInCents, assetId: quoteAsset },
          { accountId: sysQuoteAccount._id, direction: 'credit', amount: costInCents, balanceAfter: sysQuoteAccount.cachedBalance + costInCents, assetId: quoteAsset },
          // Base Asset (BTC) movements
          { accountId: userBaseAccount._id, direction: 'credit', amount: amountInCents, balanceAfter: userBaseAccount.cachedBalance + amountInCents, assetId: baseAsset },
          { accountId: sysBaseAccount._id, direction: 'debit', amount: amountInCents, balanceAfter: sysBaseAccount.cachedBalance - amountInCents, assetId: baseAsset },
        ]
      : [
          // Base Asset (BTC) movements
          { accountId: userBaseAccount._id, direction: 'debit', amount: amountInCents, balanceAfter: userBaseAccount.cachedBalance - amountInCents, assetId: baseAsset },
          { accountId: sysBaseAccount._id, direction: 'credit', amount: amountInCents, balanceAfter: sysBaseAccount.cachedBalance + amountInCents, assetId: baseAsset },
          // Quote Asset (USD) movements
          { accountId: userQuoteAccount._id, direction: 'credit', amount: costInCents, balanceAfter: userQuoteAccount.cachedBalance + costInCents, assetId: quoteAsset },
          { accountId: sysQuoteAccount._id, direction: 'debit', amount: costInCents, balanceAfter: sysQuoteAccount.cachedBalance - costInCents, assetId: quoteAsset },
        ];

    await LedgerTransaction.create({
      kind: 'trade',
      refType: 'trade',
      refId: `trade_${Date.now()}`,
      idempotencyKey,
      entries: entries as any // Casting to bypass strict Mongoose array types
    });

    return { success: true, message: "Trade executed successfully!" };

  } catch (error: any) {
    console.error("Trade error:", error);
    return { error: "Failed to execute trade. Please try again." };
  }
}