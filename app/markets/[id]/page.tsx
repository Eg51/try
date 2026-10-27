import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import AssetView, { Quote } from "./AssetView";

// ADD THIS EXACT LINE
export const instant = false;

const fallbackAssets: Record<string, any> = {
  "bitcoin": { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 64230, price_change_percentage_24h: 2.4, total_volume: 35000000000, market_cap: 1200000000000, high_24h: 65000, low_24h: 63500, circulating_supply: 19600000 },
  "ethereum": { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3450, price_change_percentage_24h: -1.2, total_volume: 15000000000, market_cap: 400000000000, high_24h: 3500, low_24h: 3400, circulating_supply: 120000000 },
};

const FIAT_QUOTES: Quote[] = [
  { id: "usd", symbol: "$", name: "US Dollar", rate: 1, category: "fiat" },
  { id: "eur", symbol: "€", name: "Euro", rate: 0.92, category: "fiat" },
  { id: "gbp", symbol: "£", name: "British Pound", rate: 0.79, category: "fiat" },
  { id: "ngn", symbol: "₦", name: "Nigerian Naira", rate: 1500, category: "fiat" },
  { id: "jpy", symbol: "¥", name: "Japanese Yen", rate: 151.2, category: "fiat" },
  { id: "cad", symbol: "C$", name: "Canadian Dollar", rate: 1.35, category: "fiat" },
  { id: "aud", symbol: "A$", name: "Australian Dollar", rate: 1.52, category: "fiat" },
  { id: "chf", symbol: "Fr", name: "Swiss Franc", rate: 0.90, category: "fiat" },
  { id: "cny", symbol: "¥", name: "Chinese Yuan", rate: 7.23, category: "fiat" },
  { id: "inr", symbol: "₹", name: "Indian Rupee", rate: 83.5, category: "fiat" },
];

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let coinData;
  let availableQuotes: Quote[] = [...FIAT_QUOTES];

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?tickers=false&community_data=false&developer_data=false`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error("API limit");
    const data = await res.json();
    
    coinData = {
      id: data.id, 
      symbol: data.symbol, 
      name: data.name, 
      current_price: data.market_data.current_price.usd,
      price_change_percentage_24h: data.market_data.price_change_percentage_24h, 
      total_volume: data.market_data.total_volume.usd,
      market_cap: data.market_data.market_cap.usd,
      high_24h: data.market_data.high_24h.usd,
      low_24h: data.market_data.low_24h.usd,
      circulating_supply: data.market_data.circulating_supply
    };

    const quotesRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`, { next: { revalidate: 300 } });
    if (quotesRes.ok) {
      const quotesData = await quotesRes.json();
      
      const cryptoQuotes: Quote[] = quotesData.map((c: any) => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        rate: 1 / c.current_price,
        category: ["dogecoin", "shiba-inu", "pepe", "bonk", "floki"].includes(c.id) ? "memes" : "crypto"
      }));
      
      availableQuotes = [...availableQuotes, ...cryptoQuotes];
    }
  } catch (error) {
    coinData = fallbackAssets[id] || fallbackAssets["bitcoin"];
  }

  const session = await getServerSession();
  let isFavorited = false;
  
  if (session) {
    await connectDB();
    const user = await User.findById(session.id).lean();
    isFavorited = user?.favorites?.includes(id) || false;
  }

  return <AssetView coin={coinData} initialIsFavorited={isFavorited} isLoggedIn={!!session} availableQuotes={availableQuotes} />;
}