// app/actions/trade.ts
"use server";

import { z } from "zod";
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { LedgerAccount, LedgerTransaction } from "@/lib/models/Ledger";
import { getSystemAccount, updateAccountBalance } from "@/lib/ledger-helper";
import Trade from "@/lib/models/Trade";

const orderSchema = z.object({
  pair: z.string(), 
  side: z.enum(["buy", "sell"]),
  price: z.number().positive(),
  amount: z.number().positive(),
});

export async function executeTradeAction(rawData: unknown) {
  try {
    const session = await getServerSession();
    if (!session) return { error: "Unauthorized. Please log in." };

    const parsed = orderSchema.safeParse(rawData);
    if (!parsed.success) return { error: "Invalid order data." };

    const { pair, side, price, amount } = parsed.data;
    const [baseAsset, quoteAsset] = pair.split("-"); 
    const totalCost = price * amount;

    await connectDB();

    const userQuoteAccount = await LedgerAccount.findOne({ userId: session.id, assetId: quoteAsset, type: 'available' });
    const userBaseAccount = await LedgerAccount.findOne({ userId: session.id, assetId: baseAsset, type: 'available' });

    if (!userQuoteAccount || !userBaseAccount) return { error: "User ledger accounts not found." };

    const sysQuoteAccount = await getSystemAccount(quoteAsset);
    const sysBaseAccount = await getSystemAccount(baseAsset);

    if (!sysQuoteAccount || !sysBaseAccount) return { error: "System ledger accounts not found." };

    const costInCents = Math.round(totalCost * 100);
    const amountInCents = Math.round(amount * 100);

    if (side === "buy" && userQuoteAccount.cachedBalance < costInCents) return { error: `Insufficient ${quoteAsset} balance.` };
    if (side === "sell" && userBaseAccount.cachedBalance < amountInCents) return { error: `Insufficient ${baseAsset} balance.` };

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

    const entries = side === "buy" ? [
        { accountId: userQuoteAccount._id, direction: 'debit', amount: costInCents, balanceAfter: userQuoteAccount.cachedBalance - costInCents, assetId: quoteAsset },
        { accountId: sysQuoteAccount._id, direction: 'credit', amount: costInCents, balanceAfter: sysQuoteAccount.cachedBalance + costInCents, assetId: quoteAsset },
        { accountId: userBaseAccount._id, direction: 'credit', amount: amountInCents, balanceAfter: userBaseAccount.cachedBalance + amountInCents, assetId: baseAsset },
        { accountId: sysBaseAccount._id, direction: 'debit', amount: amountInCents, balanceAfter: sysBaseAccount.cachedBalance - amountInCents, assetId: baseAsset },
      ] : [
        { accountId: userBaseAccount._id, direction: 'debit', amount: amountInCents, balanceAfter: userBaseAccount.cachedBalance - amountInCents, assetId: baseAsset },
        { accountId: sysBaseAccount._id, direction: 'credit', amount: amountInCents, balanceAfter: sysBaseAccount.cachedBalance + amountInCents, assetId: baseAsset },
        { accountId: userQuoteAccount._id, direction: 'credit', amount: costInCents, balanceAfter: userQuoteAccount.cachedBalance + costInCents, assetId: quoteAsset },
        { accountId: sysQuoteAccount._id, direction: 'debit', amount: costInCents, balanceAfter: sysQuoteAccount.cachedBalance - costInCents, assetId: quoteAsset },
      ];

    await LedgerTransaction.create({
      kind: 'trade', refType: 'trade', refId: `trade_${Date.now()}`, idempotencyKey, entries: entries as any
    });

    const newTrade = await Trade.create({
      userId: session.id,
      pair,
      baseAsset,
      quoteAsset,
      side,
      entryPrice: price,
      amount,
      status: 'open',
      drawings: [],
    });

    return { success: true, message: "Trade executed successfully!", tradeId: newTrade._id.toString() };

  } catch (error: any) {
    console.error("Trade error:", error);
    return { error: "Failed to execute trade. Please try again." };
  }
}

// 👇 FIXED: Added alias for OrderTicket.tsx
export const placeOrderAction = executeTradeAction;

export async function saveDrawingAction(tradeId: string, drawing: any) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };
  await connectDB();
  await Trade.updateOne({ _id: tradeId, userId: session.id }, { $push: { drawings: drawing } });
  return { success: true };
}

export async function deleteDrawingAction(tradeId: string, drawingId: string) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };
  await connectDB();
  await Trade.updateOne(
    { _id: tradeId, userId: session.id }, 
    { $pull: { drawings: { id: drawingId } } }
  );
  return { success: true };
}

export async function closeTradeAction(tradeId: string, currentPrice: number) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };
  await connectDB();

  const trade = await Trade.findOne({ _id: tradeId, userId: session.id, status: 'open' });
  if (!trade) return { error: "Trade not found or already closed." };

  const priceDiff = currentPrice - trade.entryPrice;
  const pnl = trade.side === 'buy' ? priceDiff * trade.amount : -priceDiff * trade.amount;

  const closingSide = trade.side === 'buy' ? 'sell' : 'buy';
  const totalCost = currentPrice * trade.amount;
  
  const userQuoteAccount = await LedgerAccount.findOne({ userId: session.id, assetId: trade.quoteAsset, type: 'available' });
  const userBaseAccount = await LedgerAccount.findOne({ userId: session.id, assetId: trade.baseAsset, type: 'available' });
  const sysQuoteAccount = await getSystemAccount(trade.quoteAsset);
  const sysBaseAccount = await getSystemAccount(trade.baseAsset);

  // 👇 FIXED: Added null check to fix TS errors
  if (!userQuoteAccount || !userBaseAccount || !sysQuoteAccount || !sysBaseAccount) {
    return { error: "Ledger accounts missing." };
  }

  const costInCents = Math.round(totalCost * 100);
  const amountInCents = Math.round(trade.amount * 100);

  if (closingSide === "sell") {
    await updateAccountBalance(userBaseAccount._id.toString(), -amountInCents);
    await updateAccountBalance(sysBaseAccount._id.toString(), amountInCents);
    await updateAccountBalance(sysQuoteAccount._id.toString(), -costInCents);
    await updateAccountBalance(userQuoteAccount._id.toString(), costInCents);
  } else {
    await updateAccountBalance(userQuoteAccount._id.toString(), -costInCents);
    await updateAccountBalance(sysQuoteAccount._id.toString(), costInCents);
    await updateAccountBalance(sysBaseAccount._id.toString(), -amountInCents);
    await updateAccountBalance(userBaseAccount._id.toString(), amountInCents);
  }

  trade.status = 'closed';
  trade.pnl = pnl;
  trade.closedAt = new Date();
  await trade.save();

  return { success: true, pnl };
}

export async function getOpenTradesAction() {
  const session = await getServerSession();
  if (!session) return [];
  await connectDB();
  const trades = await Trade.find({ userId: session.id, status: 'open' }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(trades));
}
// // app/actions/trade.ts
// "use server";

// import { z } from "zod";
// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import { LedgerAccount, LedgerTransaction } from "@/lib/models/Ledger";
// import { getSystemAccount, updateAccountBalance } from "@/lib/ledger-helper";
// import Trade from "@/lib/models/Trade";

// const orderSchema = z.object({
//   pair: z.string(), 
//   side: z.enum(["buy", "sell"]),
//   price: z.number().positive(),
//   amount: z.number().positive(),
// });

// export async function executeTradeAction(rawData: unknown) {
//   try {
//     const session = await getServerSession();
//     if (!session) return { error: "Unauthorized. Please log in." };

//     const parsed = orderSchema.safeParse(rawData);
//     if (!parsed.success) return { error: "Invalid order data." };

//     const { pair, side, price, amount } = parsed.data;
//     const [baseAsset, quoteAsset] = pair.split("-"); 
//     const totalCost = price * amount;

//     await connectDB();

//     const userQuoteAccount = await LedgerAccount.findOne({ userId: session.id, assetId: quoteAsset, type: 'available' });
//     const userBaseAccount = await LedgerAccount.findOne({ userId: session.id, assetId: baseAsset, type: 'available' });

//     if (!userQuoteAccount || !userBaseAccount) return { error: "User ledger accounts not found." };

//     const sysQuoteAccount = await getSystemAccount(quoteAsset);
//     const sysBaseAccount = await getSystemAccount(baseAsset);

//     if (!sysQuoteAccount || !sysBaseAccount) return { error: "System ledger accounts not found." };

//     const costInCents = Math.round(totalCost * 100);
//     const amountInCents = Math.round(amount * 100);

//     if (side === "buy" && userQuoteAccount.cachedBalance < costInCents) return { error: `Insufficient ${quoteAsset} balance.` };
//     if (side === "sell" && userBaseAccount.cachedBalance < amountInCents) return { error: `Insufficient ${baseAsset} balance.` };

//     const idempotencyKey = `trade_${Date.now()}_${session.id}`;
    
//     // Fixed: Added ! to tell TypeScript these are not null
//     if (side === "buy") {
//       await updateAccountBalance(userQuoteAccount._id.toString(), -costInCents);
//       await updateAccountBalance(sysQuoteAccount!._id.toString(), costInCents);
//       await updateAccountBalance(sysBaseAccount!._id.toString(), -amountInCents);
//       await updateAccountBalance(userBaseAccount._id.toString(), amountInCents);
//     } else {
//       await updateAccountBalance(userBaseAccount._id.toString(), -amountInCents);
//       await updateAccountBalance(sysBaseAccount!._id.toString(), amountInCents);
//       await updateAccountBalance(sysQuoteAccount!._id.toString(), -costInCents);
//       await updateAccountBalance(userQuoteAccount._id.toString(), costInCents);
//     }

//     const entries = side === "buy" ? [
//         { accountId: userQuoteAccount._id, direction: 'debit', amount: costInCents, balanceAfter: userQuoteAccount.cachedBalance - costInCents, assetId: quoteAsset },
//         { accountId: sysQuoteAccount!._id, direction: 'credit', amount: costInCents, balanceAfter: sysQuoteAccount!.cachedBalance + costInCents, assetId: quoteAsset },
//         { accountId: userBaseAccount._id, direction: 'credit', amount: amountInCents, balanceAfter: userBaseAccount.cachedBalance + amountInCents, assetId: baseAsset },
//         { accountId: sysBaseAccount!._id, direction: 'debit', amount: amountInCents, balanceAfter: sysBaseAccount!.cachedBalance - amountInCents, assetId: baseAsset },
//       ] : [
//         { accountId: userBaseAccount._id, direction: 'debit', amount: amountInCents, balanceAfter: userBaseAccount.cachedBalance - amountInCents, assetId: baseAsset },
//         { accountId: sysBaseAccount!._id, direction: 'credit', amount: amountInCents, balanceAfter: sysBaseAccount!.cachedBalance + amountInCents, assetId: baseAsset },
//         { accountId: userQuoteAccount._id, direction: 'credit', amount: costInCents, balanceAfter: userQuoteAccount.cachedBalance + costInCents, assetId: quoteAsset },
//         { accountId: sysQuoteAccount!._id, direction: 'debit', amount: costInCents, balanceAfter: sysQuoteAccount!.cachedBalance - costInCents, assetId: quoteAsset },
//       ];

//     await LedgerTransaction.create({
//       kind: 'trade', refType: 'trade', refId: `trade_${Date.now()}`, idempotencyKey, entries: entries as any
//     });

//     const newTrade = await Trade.create({
//       userId: session.id,
//       pair,
//       baseAsset,
//       quoteAsset,
//       side,
//       entryPrice: price,
//       amount,
//       status: 'open',
//       drawings: [],
//     });

//     return { success: true, message: "Trade executed successfully!", tradeId: newTrade._id.toString() };

//   } catch (error: any) {
//     console.error("Trade error:", error);
//     return { error: "Failed to execute trade. Please try again." };
//   }
// }

// export async function saveDrawingAction(tradeId: string, drawing: any) {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };
//   await connectDB();
//   await Trade.updateOne({ _id: tradeId, userId: session.id }, { $push: { drawings: drawing } });
//   return { success: true };
// }

// // Fixed: Requires both tradeId and drawingId
// export async function deleteDrawingAction(tradeId: string, drawingId: string) {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };
//   await connectDB();
//   await Trade.updateOne(
//     { _id: tradeId, userId: session.id }, 
//     { $pull: { drawings: { id: drawingId } } }
//   );
//   return { success: true };
// }

// export async function closeTradeAction(tradeId: string, currentPrice: number) {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };
//   await connectDB();

//   const trade = await Trade.findOne({ _id: tradeId, userId: session.id, status: 'open' });
//   if (!trade) return { error: "Trade not found or already closed." };

//   const priceDiff = currentPrice - trade.entryPrice;
//   const pnl = trade.side === 'buy' ? priceDiff * trade.amount : -priceDiff * trade.amount;

//   const closingSide = trade.side === 'buy' ? 'sell' : 'buy';
//   const totalCost = currentPrice * trade.amount;
  
//   const userQuoteAccount = await LedgerAccount.findOne({ userId: session.id, assetId: trade.quoteAsset, type: 'available' });
//   const userBaseAccount = await LedgerAccount.findOne({ userId: session.id, assetId: trade.baseAsset, type: 'available' });
//   const sysQuoteAccount = await getSystemAccount(trade.quoteAsset);
//   const sysBaseAccount = await getSystemAccount(trade.baseAsset);

//   if (!userQuoteAccount || !userBaseAccount || !sysQuoteAccount || !sysBaseAccount) {
//     return { error: "Ledger accounts missing." };
//   }

//   const costInCents = Math.round(totalCost * 100);
//   const amountInCents = Math.round(trade.amount * 100);

//   if (closingSide === "sell") {
//     await updateAccountBalance(userBaseAccount._id.toString(), -amountInCents);
//     await updateAccountBalance(sysBaseAccount._id.toString(), amountInCents);
//     await updateAccountBalance(sysQuoteAccount._id.toString(), -costInCents);
//     await updateAccountBalance(userQuoteAccount._id.toString(), costInCents);
//   } else {
//     await updateAccountBalance(userQuoteAccount._id.toString(), -costInCents);
//     await updateAccountBalance(sysQuoteAccount._id.toString(), costInCents);
//     await updateAccountBalance(sysBaseAccount._id.toString(), -amountInCents);
//     await updateAccountBalance(userBaseAccount._id.toString(), amountInCents);
//   }

//   trade.status = 'closed';
//   trade.pnl = pnl;
//   trade.closedAt = new Date();
//   await trade.save();

//   return { success: true, pnl };
// }

// export async function getOpenTradesAction() {
//   const session = await getServerSession();
//   if (!session) return [];
//   await connectDB();
//   const trades = await Trade.find({ userId: session.id, status: 'open' }).sort({ createdAt: -1 }).lean();
//   return JSON.parse(JSON.stringify(trades));
// }