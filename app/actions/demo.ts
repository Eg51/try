// app/actions/demo.ts
"use server";

import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { DemoSession } from "@/lib/models/DemoSession";
import crypto from "crypto";

// 👇 Fetch or Create Demo Session
export async function getDemoSessionAction() {
  await connectDB();
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("demo_session_id")?.value;

  let session;
  if (sessionId) {
    session = await DemoSession.findOne({ sessionId }).lean();
  }

  if (!session) {
    sessionId = `demo_${crypto.randomUUID()}`;
    cookieStore.set("demo_session_id", sessionId, { maxAge: 60 * 60 * 24, path: "/" });
    session = await DemoSession.create({ sessionId });
    session = session.toObject();
  }

  return JSON.parse(JSON.stringify(session));
}

// 👇 Execute Demo Trade
export async function executeDemoTradeAction(data: {
  pair: string;
  side: "buy" | "sell";
  amount: number;
  price: number;
}) {
  await connectDB();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("demo_session_id")?.value;

  if (!sessionId) return { error: "Demo session expired. Please refresh." };

  const session = await DemoSession.findOne({ sessionId });
  if (!session) return { error: "Demo session not found." };

  // 1. Calculate Cost
  const isNgn = data.pair.includes("NGN");
  const NGN_PER_USD = 1500;
  const cost = isNgn ? data.amount * data.price * NGN_PER_USD : data.amount * data.price;

  // 2. Check Balance
  if (isNgn) {
    if (cost > session.ngnBalance) return { error: "Insufficient demo NGN balance." };
    session.ngnBalance -= cost;
  } else {
    const usdBalance = session.btcBalance * 64230; // Using base BTC price for demo USD wallet
    if (cost > usdBalance) return { error: "Insufficient demo USD balance." };
    session.btcBalance -= (cost / 64230);
  }

  // 3. Create Position
  const newPosId = `demo-pos-${Date.now()}`;
  const newPos = {
    id: newPosId,
    asset: data.pair,
    type: data.side === "buy" ? "Long" : "Short",
    size: `${data.amount} ${data.pair.split("-")[0]}`,
    entry: `$${data.price.toFixed(2)}`,
    current: `$${data.price.toFixed(2)}`,
    pnl: "$0.00",
    pnlPct: "0%",
    isProfit: true,
    tp: null,
    sl: null,
    status: "increasing",
  };

  // Keep only the newest open position (Demo limit logic)
  session.positions = [newPos, ...session.positions.filter((p: any) => p.status === "closed")];

  // 4. Add Activity
  session.activity.unshift({
    id: `demo-act-${Date.now()}`,
    type: "Trade",
    asset: data.pair,
    amount: data.side === "buy" ? "Long" : "Short",
    status: "Filled",
    date: "Just now",
  });

  await session.save();
  return { success: true, tradeId: newPosId };
}