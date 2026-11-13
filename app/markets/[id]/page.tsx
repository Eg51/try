// app/markets/[id]/page.tsx
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Asset from "@/lib/models/Asset";
import AssetView, { Quote } from "./AssetView";
import { WatchlistItem } from "./ChartSidePanel";
import { getOpenTradesAction } from "@/app/actions/trade";

export const instant = false;

const fallbackAssets: Record<string, any> = {
  "bitcoin": { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 64230, price_change_percentage_24h: 2.4, total_volume: 35000000000, market_cap: 1200000000000, high_24h: 65000, low_24h: 63500, circulating_supply: 19600000 },
  "ethereum": { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3450, price_change_percentage_24h: -1.2, total_volume: 15000000000, market_cap: 400000000000, high_24h: 3500, low_24h: 3400, circulating_supply: 120000000 },
};

const FIAT_QUOTES: Quote[] = [
  { id: "usd", symbol: "$", name: "US Dollar", rate: 1, category: "fiat", price_change_percentage_24h: 0 },
  { id: "eur", symbol: "€", name: "Euro", rate: 0.92, category: "fiat", price_change_percentage_24h: 0 },
  { id: "gbp", symbol: "£", name: "British Pound", rate: 0.79, category: "fiat", price_change_percentage_24h: 0 },
  { id: "ngn", symbol: "₦", name: "Nigerian Naira", rate: 1500, category: "fiat", price_change_percentage_24h: 0 },
  { id: "jpy", symbol: "¥", name: "Japanese Yen", rate: 151.2, category: "fiat", price_change_percentage_24h: 0 },
  { id: "cad", symbol: "C$", name: "Canadian Dollar", rate: 1.35, category: "fiat", price_change_percentage_24h: 0 },
  { id: "aud", symbol: "A$", name: "Australian Dollar", rate: 1.52, category: "fiat", price_change_percentage_24h: 0 },
  { id: "chf", symbol: "Fr", name: "Swiss Franc", rate: 0.90, category: "fiat", price_change_percentage_24h: 0 },
  { id: "cny", symbol: "¥", name: "Chinese Yuan", rate: 7.23, category: "fiat", price_change_percentage_24h: 0 },
  { id: "inr", symbol: "₹", name: "Indian Rupee", rate: 83.5, category: "fiat", price_change_percentage_24h: 0 },
];

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let coinData;
  let availableQuotes: Quote[] = [...FIAT_QUOTES];

  await connectDB();

  // 1. Fetch ALL active DB assets (Feeder Cache)
  const dbAssets = await Asset.find({ isActive: true }).lean();

  // 2. Check if the Admin has explicitly approved this asset in the DB
  const dbAsset = dbAssets.find((a: any) => a.symbol.toLowerCase() === id.toLowerCase());

  // 3. Fallback to API if it's not in DB
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
        category: ["dogecoin", "shiba-inu", "pepe", "bonk", "floki"].includes(c.id) ? "memes" : "crypto",
        price_change_percentage_24h: c.price_change_percentage_24h || 0 // 👈 DYNAMIC 24H CHANGE
      }));
      
      availableQuotes = [...availableQuotes, ...cryptoQuotes];
    }
  } catch (error) {
    coinData = fallbackAssets[id] || fallbackAssets["bitcoin"];
  }

  // 4. If DB Asset exists, OVERRIDE the API price and name with Admin's rules
  if (dbAsset) {
    coinData = {
      ...coinData,
      id: dbAsset.symbol.toLowerCase(),
      symbol: dbAsset.symbol,
      name: dbAsset.name,
      current_price: dbAsset.basePrice || coinData?.current_price || 0,
      category: dbAsset.category,
    };
  }

  const session = await getServerSession();
  let isFavorited = false;
  let userTier = 0;
  let initialTrades: any[] = [];
  let currencySymbol = "$";
  let initialCurrency = "USD";
  let initialLanguage = "en"; // 👈 FIXED: Default to ISO code
  let initialWatchlist: WatchlistItem[] = [];
  
  if (session) {
    const user = await User.findById(session.id).lean();
    isFavorited = user?.favorites?.includes(id) || false;
    userTier = user?.kycTier ?? 1;

    initialCurrency = user?.displayCurrency?.assetId || "USD";
    initialLanguage = user?.preferences?.language || "en"; // 👈 FIXED: Default to ISO code
    
    const currencyMap: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
    currencySymbol = currencyMap[initialCurrency] || "$";

    initialTrades = await getOpenTradesAction();

    // 5. PROPERLY POPULATE THE WATCHLIST (handling custom DB assets)
    if (user && user.favorites && user.favorites.length > 0) {
      initialWatchlist = user.favorites.map((favId: string) => {
        // Check API Quotes first
        const quoteInfo = availableQuotes.find(q => q.id === favId);
        if (quoteInfo) {
          return {
            id: quoteInfo.id,
            // 👇 FIXED: Fiat uses Uppercase ID, Crypto uses Symbol + USD
            symbol: quoteInfo.category === "fiat" ? quoteInfo.id.toUpperCase() : `${quoteInfo.symbol}USD`,
            name: quoteInfo.name,
            price: quoteInfo.rate ? (1 / quoteInfo.rate) : 0,
            change: quoteInfo.price_change_percentage_24h || 0,
          };
        }

        // Check DB Assets second (Feeder Cache)
        const dbFav = dbAssets.find((a: any) => a.symbol.toLowerCase() === favId.toLowerCase());
        if (dbFav) {
          return {
            id: dbFav.symbol.toLowerCase(),
            symbol: `${dbFav.symbol}USD`,
            name: dbFav.name,
            price: dbFav.basePrice || 0,
            change: 0,
          };
        }

        // Fallback
        return {
          id: favId,
          symbol: favId.toUpperCase(),
          name: favId.toUpperCase(),
          price: 0,
          change: 0,
        };
      }).filter(Boolean) as WatchlistItem[];
    }
  }

  return (
    <AssetView 
      coin={coinData} 
      initialWatchlist={initialWatchlist}
      initialIsFavorited={isFavorited} 
      isLoggedIn={!!session} 
      userTier={userTier}
      availableQuotes={availableQuotes} 
      dbAssets={dbAssets} // 👈 PASSING DB ASSETS TO THE TERMINAL
      initialTrades={initialTrades}
      currencySymbol={currencySymbol}
      initialCurrency={initialCurrency}
      initialLanguage={initialLanguage}
    />
  );
}

// // app/markets/[id]/page.tsx
// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import Asset from "@/lib/models/Asset";
// import AssetView, { Quote } from "./AssetView";
// import { WatchlistItem } from "./ChartSidePanel";
// import { getOpenTradesAction } from "@/app/actions/trade";

// export const instant = false;

// const fallbackAssets: Record<string, any> = {
//   "bitcoin": { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 64230, price_change_percentage_24h: 2.4, total_volume: 35000000000, market_cap: 1200000000000, high_24h: 65000, low_24h: 63500, circulating_supply: 19600000 },
//   "ethereum": { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3450, price_change_percentage_24h: -1.2, total_volume: 15000000000, market_cap: 400000000000, high_24h: 3500, low_24h: 3400, circulating_supply: 120000000 },
// };

// const FIAT_QUOTES: Quote[] = [
//   { id: "usd", symbol: "$", name: "US Dollar", rate: 1, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "eur", symbol: "€", name: "Euro", rate: 0.92, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "gbp", symbol: "£", name: "British Pound", rate: 0.79, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "ngn", symbol: "₦", name: "Nigerian Naira", rate: 1500, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "jpy", symbol: "¥", name: "Japanese Yen", rate: 151.2, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "cad", symbol: "C$", name: "Canadian Dollar", rate: 1.35, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "aud", symbol: "A$", name: "Australian Dollar", rate: 1.52, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "chf", symbol: "Fr", name: "Swiss Franc", rate: 0.90, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "cny", symbol: "¥", name: "Chinese Yuan", rate: 7.23, category: "fiat", price_change_percentage_24h: 0 },
//   { id: "inr", symbol: "₹", name: "Indian Rupee", rate: 83.5, category: "fiat", price_change_percentage_24h: 0 },
// ];

// export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
  
//   let coinData;
//   let availableQuotes: Quote[] = [...FIAT_QUOTES];

//   await connectDB();

//   // 1. Fetch ALL active DB assets (Feeder Cache)
//   const dbAssets = await Asset.find({ isActive: true }).lean();

//   // 2. Check if the Admin has explicitly approved this asset in the DB
//   const dbAsset = dbAssets.find((a: any) => a.symbol.toLowerCase() === id.toLowerCase());

//   // 3. Fallback to API if it's not in DB
//   try {
//     const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?tickers=false&community_data=false&developer_data=false`, { next: { revalidate: 300 } });
//     if (!res.ok) throw new Error("API limit");
//     const data = await res.json();
    
//     coinData = {
//       id: data.id, 
//       symbol: data.symbol, 
//       name: data.name, 
//       current_price: data.market_data.current_price.usd,
//       price_change_percentage_24h: data.market_data.price_change_percentage_24h, 
//       total_volume: data.market_data.total_volume.usd,
//       market_cap: data.market_data.market_cap.usd,
//       high_24h: data.market_data.high_24h.usd,
//       low_24h: data.market_data.low_24h.usd,
//       circulating_supply: data.market_data.circulating_supply
//     };

//     const quotesRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`, { next: { revalidate: 300 } });
//     if (quotesRes.ok) {
//       const quotesData = await quotesRes.json();
      
//       const cryptoQuotes: Quote[] = quotesData.map((c: any) => ({
//         id: c.id,
//         symbol: c.symbol.toUpperCase(),
//         name: c.name,
//         rate: 1 / c.current_price,
//         category: ["dogecoin", "shiba-inu", "pepe", "bonk", "floki"].includes(c.id) ? "memes" : "crypto",
//         price_change_percentage_24h: c.price_change_percentage_24h || 0 // 👈 DYNAMIC 24H CHANGE
//       }));
      
//       availableQuotes = [...availableQuotes, ...cryptoQuotes];
//     }
//   } catch (error) {
//     coinData = fallbackAssets[id] || fallbackAssets["bitcoin"];
//   }

//   // 4. If DB Asset exists, OVERRIDE the API price and name with Admin's rules
//   if (dbAsset) {
//     coinData = {
//       ...coinData,
//       id: dbAsset.symbol.toLowerCase(),
//       symbol: dbAsset.symbol,
//       name: dbAsset.name,
//       current_price: dbAsset.basePrice || coinData?.current_price || 0,
//       category: dbAsset.category,
//     };
//   }

//   const session = await getServerSession();
//   let isFavorited = false;
//   let userTier = 0;
//   let initialTrades: any[] = [];
//   let currencySymbol = "$";
//   let initialCurrency = "USD";
//   let initialLanguage = "en"; // 👈 FIXED: Default to ISO code
//   let initialWatchlist: WatchlistItem[] = [];
  
//   if (session) {
//     const user = await User.findById(session.id).lean();
//     isFavorited = user?.favorites?.includes(id) || false;
//     userTier = user?.kycTier ?? 1;

//     initialCurrency = user?.displayCurrency?.assetId || "USD";
//     initialLanguage = user?.preferences?.language || "en"; // 👈 FIXED: Default to ISO code
    
//     const currencyMap: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
//     currencySymbol = currencyMap[initialCurrency] || "$";

//     initialTrades = await getOpenTradesAction();

//     // 5. PROPERLY POPULATE THE WATCHLIST (handling custom DB assets)
//     if (user && user.favorites && user.favorites.length > 0) {
//       initialWatchlist = user.favorites.map((favId: string) => {
//         // Check API Quotes first
//         const quoteInfo = availableQuotes.find(q => q.id === favId);
//         if (quoteInfo) {
//           return {
//             id: quoteInfo.id,
//             symbol: `${quoteInfo.symbol}USD`,
//             name: quoteInfo.name,
//             price: quoteInfo.rate ? (1 / quoteInfo.rate) : 0,
//             change: quoteInfo.price_change_percentage_24h || 0,
//           };
//         }

//         // Check DB Assets second (Feeder Cache)
//         const dbFav = dbAssets.find((a: any) => a.symbol.toLowerCase() === favId.toLowerCase());
//         if (dbFav) {
//           return {
//             id: dbFav.symbol.toLowerCase(),
//             symbol: `${dbFav.symbol}USD`,
//             name: dbFav.name,
//             price: dbFav.basePrice || 0,
//             change: 0,
//           };
//         }

//         // Fallback
//         return {
//           id: favId,
//           symbol: favId.toUpperCase(),
//           name: favId.toUpperCase(),
//           price: 0,
//           change: 0,
//         };
//       }).filter(Boolean) as WatchlistItem[];
//     }
//   }

//   return (
//     <AssetView 
//       coin={coinData} 
//       initialWatchlist={initialWatchlist}
//       initialIsFavorited={isFavorited} 
//       isLoggedIn={!!session} 
//       userTier={userTier}
//       availableQuotes={availableQuotes} 
//       dbAssets={dbAssets} // 👈 PASSING DB ASSETS TO THE TERMINAL
//       initialTrades={initialTrades}
//       currencySymbol={currencySymbol}
//       initialCurrency={initialCurrency}
//       initialLanguage={initialLanguage}
//     />
//   );
// }


// // app/markets/[id]/page.tsx
// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import Asset from "@/lib/models/Asset";
// import AssetView, { Quote } from "./AssetView";
// import { WatchlistItem } from "./ChartSidePanel"; // 👈 Import the type
// import { getOpenTradesAction } from "@/app/actions/trade";

// export const instant = false;

// const fallbackAssets: Record<string, any> = {
//   "bitcoin": { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 64230, price_change_percentage_24h: 2.4, total_volume: 35000000000, market_cap: 1200000000000, high_24h: 65000, low_24h: 63500, circulating_supply: 19600000 },
//   "ethereum": { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3450, price_change_percentage_24h: -1.2, total_volume: 15000000000, market_cap: 400000000000, high_24h: 3500, low_24h: 3400, circulating_supply: 120000000 },
// };

// const FIAT_QUOTES: Quote[] = [
//   { id: "usd", symbol: "$", name: "US Dollar", rate: 1, category: "fiat" },
//   { id: "eur", symbol: "€", name: "Euro", rate: 0.92, category: "fiat" },
//   { id: "gbp", symbol: "£", name: "British Pound", rate: 0.79, category: "fiat" },
//   { id: "ngn", symbol: "₦", name: "Nigerian Naira", rate: 1500, category: "fiat" },
//   { id: "jpy", symbol: "¥", name: "Japanese Yen", rate: 151.2, category: "fiat" },
//   { id: "cad", symbol: "C$", name: "Canadian Dollar", rate: 1.35, category: "fiat" },
//   { id: "aud", symbol: "A$", name: "Australian Dollar", rate: 1.52, category: "fiat" },
//   { id: "chf", symbol: "Fr", name: "Swiss Franc", rate: 0.90, category: "fiat" },
//   { id: "cny", symbol: "¥", name: "Chinese Yuan", rate: 7.23, category: "fiat" },
//   { id: "inr", symbol: "₹", name: "Indian Rupee", rate: 83.5, category: "fiat" },
// ];

// export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
  
//   let coinData;
//   let availableQuotes: Quote[] = [...FIAT_QUOTES];

//   await connectDB();

//   // 👇 1. Check if the Admin has explicitly approved this asset in the DB
//   const dbAsset = await Asset.findOne({ symbol: id.toUpperCase() }).lean();

//   // 👇 2. Fallback to API if it's not in DB (e.g., user manually typed a CoinGecko URL)
//   try {
//     const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?tickers=false&community_data=false&developer_data=false`, { next: { revalidate: 300 } });
//     if (!res.ok) throw new Error("API limit");
//     const data = await res.json();
    
//     coinData = {
//       id: data.id, 
//       symbol: data.symbol, 
//       name: data.name, 
//       current_price: data.market_data.current_price.usd,
//       price_change_percentage_24h: data.market_data.price_change_percentage_24h, 
//       total_volume: data.market_data.total_volume.usd,
//       market_cap: data.market_data.market_cap.usd,
//       high_24h: data.market_data.high_24h.usd,
//       low_24h: data.market_data.low_24h.usd,
//       circulating_supply: data.market_data.circulating_supply
//     };

//     const quotesRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`, { next: { revalidate: 300 } });
//     if (quotesRes.ok) {
//       const quotesData = await quotesRes.json();
      
//       const cryptoQuotes: Quote[] = quotesData.map((c: any) => ({
//         id: c.id,
//         symbol: c.symbol.toUpperCase(),
//         name: c.name,
//         rate: 1 / c.current_price,
//         category: ["dogecoin", "shiba-inu", "pepe", "bonk", "floki"].includes(c.id) ? "memes" : "crypto"
//       }));
      
//       availableQuotes = [...availableQuotes, ...cryptoQuotes];
//     }
//   } catch (error) {
//     coinData = fallbackAssets[id] || fallbackAssets["bitcoin"];
//   }

//   // 👇 3. If DB Asset exists, OVERRIDE the API price and name with Admin's rules
//   if (dbAsset) {
//     coinData = {
//       ...coinData,
//       id: dbAsset.symbol.toLowerCase(),
//       symbol: dbAsset.symbol,
//       name: dbAsset.name,
//       current_price: dbAsset.basePrice || coinData.current_price,
//       category: dbAsset.category,
//     };
//   }

//   const session = await getServerSession();
//   let isFavorited = false;
//   let userTier = 0;
//   let initialTrades: any[] = [];
//   let currencySymbol = "$";
//   let initialCurrency = "USD";
//   let initialLanguage = "English (US)";
  
//   // 👇 4. PROPERLY POPULATE THE WATCHLIST
//   let initialWatchlist: WatchlistItem[] = [];
  
//   if (session) {
//     const user = await User.findById(session.id).lean();
//     isFavorited = user?.favorites?.includes(id) || false;
//     userTier = user?.kycTier ?? 1;

//     initialCurrency = user?.displayCurrency?.assetId || "USD";
//     initialLanguage = user?.preferences?.language || "English (US)";
    
//     const currencyMap: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
//     currencySymbol = currencyMap[initialCurrency] || "$";

//     initialTrades = await getOpenTradesAction();

//     // Map DB favorites to the WatchlistItem format expected by AssetView
//     if (user && user.favorites && user.favorites.length > 0) {
//       initialWatchlist = user.favorites.map((favId: string) => {
//         // Find the quote details from the availableQuotes array
//         const quoteInfo = availableQuotes.find(q => q.id === favId);
        
//         if (quoteInfo) {
//           return {
//             id: quoteInfo.id,
//             symbol: `${quoteInfo.symbol}USD`, // e.g. BTCUSD
//             name: quoteInfo.name,
//             price: quoteInfo.rate ? (1 / quoteInfo.rate) : 0, // Convert rate back to USD price
//             change: 0, // We can optionally pull this from coinData if available
//           };
//         }

//         // Fallback if not found in quotes (e.g. custom DB asset)
//         return {
//           id: favId,
//           symbol: favId.toUpperCase(),
//           name: favId.toUpperCase(),
//           price: 0,
//           change: 0,
//         };
//       }).filter(Boolean) as WatchlistItem[];
//     }
//   }

//   return (
//     <AssetView 
//       coin={coinData} 
//       initialWatchlist={initialWatchlist} // 👈 Now properly populated
//       initialIsFavorited={isFavorited} 
//       isLoggedIn={!!session} 
//       userTier={userTier}
//       availableQuotes={availableQuotes} 
//       initialTrades={initialTrades}
//       currencySymbol={currencySymbol}
//       initialCurrency={initialCurrency}
//       initialLanguage={initialLanguage}
//     />
//   );
// }


// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import AssetView, { Quote } from "./AssetView";
// import { cacheLife } from "next/cache";
// import { getOpenTradesAction } from "@/app/actions/trade"; // 👈 ADDED

// export const instant = false;

// const fallbackAssets: Record<string, any> = {
//   "bitcoin": { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 64230, price_change_percentage_24h: 2.4, total_volume: 35000000000, market_cap: 1200000000000, high_24h: 65000, low_24h: 63500, circulating_supply: 19600000 },
//   "ethereum": { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3450, price_change_percentage_24h: -1.2, total_volume: 15000000000, market_cap: 400000000000, high_24h: 3500, low_24h: 3400, circulating_supply: 120000000 },
// };

// const FIAT_QUOTES: Quote[] = [
//   { id: "usd", symbol: "$", name: "US Dollar", rate: 1, category: "fiat" },
//   { id: "eur", symbol: "€", name: "Euro", rate: 0.92, category: "fiat" },
//   { id: "gbp", symbol: "£", name: "British Pound", rate: 0.79, category: "fiat" },
//   { id: "ngn", symbol: "₦", name: "Nigerian Naira", rate: 1500, category: "fiat" },
//   { id: "jpy", symbol: "¥", name: "Japanese Yen", rate: 151.2, category: "fiat" },
//   { id: "cad", symbol: "C$", name: "Canadian Dollar", rate: 1.35, category: "fiat" },
//   { id: "aud", symbol: "A$", name: "Australian Dollar", rate: 1.52, category: "fiat" },
//   { id: "chf", symbol: "Fr", name: "Swiss Franc", rate: 0.90, category: "fiat" },
//   { id: "cny", symbol: "¥", name: "Chinese Yuan", rate: 7.23, category: "fiat" },
//   { id: "inr", symbol: "₹", name: "Indian Rupee", rate: 83.5, category: "fiat" },
// ];

// export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
  
//   let coinData;
//   let availableQuotes: Quote[] = [...FIAT_QUOTES];

//   try {
//     const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?tickers=false&community_data=false&developer_data=false`, { next: { revalidate: 300 } });
//     if (!res.ok) throw new Error("API limit");
//     const data = await res.json();
    
//     coinData = {
//       id: data.id, 
//       symbol: data.symbol, 
//       name: data.name, 
//       current_price: data.market_data.current_price.usd,
//       price_change_percentage_24h: data.market_data.price_change_percentage_24h, 
//       total_volume: data.market_data.total_volume.usd,
//       market_cap: data.market_data.market_cap.usd,
//       high_24h: data.market_data.high_24h.usd,
//       low_24h: data.market_data.low_24h.usd,
//       circulating_supply: data.market_data.circulating_supply
//     };

//     const quotesRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`, { next: { revalidate: 300 } });
//     if (quotesRes.ok) {
//       const quotesData = await quotesRes.json();
      
//       const cryptoQuotes: Quote[] = quotesData.map((c: any) => ({
//         id: c.id,
//         symbol: c.symbol.toUpperCase(),
//         name: c.name,
//         rate: 1 / c.current_price,
//         category: ["dogecoin", "shiba-inu", "pepe", "bonk", "floki"].includes(c.id) ? "memes" : "crypto"
//       }));
      
//       availableQuotes = [...availableQuotes, ...cryptoQuotes];
//     }
//   } catch (error) {
//     coinData = fallbackAssets[id] || fallbackAssets["bitcoin"];
//   }

//   const session = await getServerSession();
//   let isFavorited = false;
//   let userTier = 0;
//   let initialTrades: any[] = [];
//   let currencySymbol = "$";
//   let initialCurrency = "USD";
//   let initialLanguage = "English (US)";
  
//   if (session) {
//     await connectDB();
//     const user = await User.findById(session.id).lean();
//     isFavorited = user?.favorites?.includes(id) || false;
//     userTier = user?.kycTier ?? 1;

//     // 👇 FETCH SETTINGS & TRADES
//     initialCurrency = user?.displayCurrency?.assetId || "USD";
//     initialLanguage = user?.preferences?.language || "English (US)";
    
//     const currencyMap: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
//     currencySymbol = currencyMap[initialCurrency] || "$";

//     initialTrades = await getOpenTradesAction();
//   }

//   return (
//     <AssetView 
//       coin={coinData} 
//       initialIsFavorited={isFavorited} 
//       isLoggedIn={!!session} 
//       userTier={userTier}
//       availableQuotes={availableQuotes} 
//       initialTrades={initialTrades}
//       currencySymbol={currencySymbol}
//       initialCurrency={initialCurrency}
//       initialLanguage={initialLanguage}
//     />
//   );
// }