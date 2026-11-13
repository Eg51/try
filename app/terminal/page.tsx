// app/terminal/page.tsx
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Asset from "@/lib/models/Asset";
import TradingTerminal from "@/components/features/TradingTerminal";
import { getOpenTradesAction } from "@/app/actions/trade";

// 👇 Re-using the Quote type from AssetView to ensure consistency
type Quote = {
  id: string;
  symbol: string;
  name: string;
  rate: number;
  category: "fiat" | "crypto" | "memes";
  price_change_percentage_24h?: number;
};

const FIAT_QUOTES: Quote[] = [
  { id: "usd", symbol: "$", name: "US Dollar", rate: 1, category: "fiat", price_change_percentage_24h: 0 },
  { id: "eur", symbol: "€", name: "Euro", rate: 0.92, category: "fiat", price_change_percentage_24h: 0 },
  { id: "gbp", symbol: "£", name: "British Pound", rate: 0.79, category: "fiat", price_change_percentage_24h: 0 },
  { id: "jpy", symbol: "¥", name: "Japanese Yen", rate: 151.2, category: "fiat", price_change_percentage_24h: 0 },
  { id: "ngn", symbol: "₦", name: "Nigerian Naira", rate: 1500, category: "fiat", price_change_percentage_24h: 0 },
];

export default async function TerminalPage() {
  const session = await getServerSession();
  let currencySymbol = "$";
  let initialTrades: any[] = [];
  let availableQuotes: Quote[] = [...FIAT_QUOTES];

  await connectDB();

  // 1. Fetch Feeder Cache Assets
  const dbAssets = await Asset.find({ isActive: true }).lean();

  // 2. Fetch User Settings & Trades
  if (session) {
    const user = await User.findById(session.id).lean();
    const currencyMap: Record<string, string> = { 
      USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", 
      AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹" 
    };
    const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
    currencySymbol = currencyMap[userCurrencyCode] || "$";

    initialTrades = await getOpenTradesAction();
  }

  // 3. Fetch CoinGecko Quotes for the Pair Selector
  try {
    const quotesRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`, { next: { revalidate: 300 } });
    if (quotesRes.ok) {
      const quotesData = await quotesRes.json();
      const cryptoQuotes: Quote[] = quotesData.map((c: any) => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        rate: 1 / c.current_price,
        category: ["dogecoin", "shiba-inu", "pepe", "bonk", "floki"].includes(c.id) ? "memes" : "crypto",
        price_change_percentage_24h: c.price_change_percentage_24h || 0
      }));
      availableQuotes = [...availableQuotes, ...cryptoQuotes];
    }
  } catch (error) {
    console.error("Failed to fetch CoinGecko quotes", error);
  }

  return (
    <div className="h-screen w-full">
      <TradingTerminal 
        currencySymbol={currencySymbol}
        dbAssets={dbAssets}
        availableQuotes={availableQuotes}
        initialTrades={initialTrades}
      />
    </div>
  );
}

// // app/terminal/page.tsx
// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import TradingTerminal from "@/components/features/TradingTerminal";

// export default async function TerminalPage() {
//   // 👇 Fetch user's currency preference
//   const session = await getServerSession();
//   let currencySymbol = "$"; // default

//   if (session) {
//     await connectDB();
//     const user = await User.findById(session.id).lean();
//     const currencyMap: Record<string, string> = { 
//       USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", 
//       AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹" 
//     };
//     const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
//     currencySymbol = currencyMap[userCurrencyCode] || "$";
//   }

//   return (
//     <div className="h-screen w-full">
//       {/* 👇 Pass the currencySymbol to TradingTerminal */}
//       <TradingTerminal currencySymbol={currencySymbol} />
//     </div>
//   );
// }