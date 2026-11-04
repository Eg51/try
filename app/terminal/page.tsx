// app/terminal/page.tsx
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import TradingTerminal from "@/components/features/TradingTerminal";

export default async function TerminalPage() {
  // 👇 Fetch user's currency preference
  const session = await getServerSession();
  let currencySymbol = "$"; // default

  if (session) {
    await connectDB();
    const user = await User.findById(session.id).lean();
    const currencyMap: Record<string, string> = { 
      USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", 
      AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹" 
    };
    const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
    currencySymbol = currencyMap[userCurrencyCode] || "$";
  }

  return (
    <div className="h-screen w-full">
      {/* 👇 Pass the currencySymbol to TradingTerminal */}
      <TradingTerminal currencySymbol={currencySymbol} />
    </div>
  );
}