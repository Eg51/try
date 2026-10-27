import { Suspense } from "react";
import MarketTable, { MarketCoin } from "./MarketTable";

const WATERMARK_SYMBOLS = ["$", "€", "£", "¥", "₦", "₹", "₿", "Ξ", "Ð", "Ł", "₮", "₳", "₱", "₩", "₪", "₫", "₴", "₭", "₮", "₯"];

async function getMarketsData(): Promise<MarketCoin[]> {
  const fallbackData: MarketCoin[] = [
    { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", current_price: 64230, price_change_percentage_24h: 2.4, total_volume: 35000000000, market_cap: 1200000000000, category: "crypto" },
    { id: "ethereum", symbol: "eth", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", current_price: 3450, price_change_percentage_24h: -1.2, total_volume: 15000000000, market_cap: 400000000000, category: "crypto" },
    { id: "solana", symbol: "sol", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png", current_price: 145, price_change_percentage_24h: 5.1, total_volume: 3000000000, market_cap: 65000000000, category: "crypto" },
    { id: "dogecoin", symbol: "doge", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", current_price: 0.15, price_change_percentage_24h: 8.4, total_volume: 1200000000, market_cap: 20000000000, category: "memes" },
    { id: "eur", symbol: "eur", name: "Euro / USD", image: "", current_price: 1.08, price_change_percentage_24h: 0.1, total_volume: 500000000, market_cap: 0, category: "fiat" },
  ];

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false", { next: { revalidate: 300 } });
    if (!res.ok) throw new Error("API limit");
    const data = await res.json();
    
    const formattedData: MarketCoin[] = data.map((coin: any) => ({
      id: coin.id, 
      symbol: coin.symbol, 
      name: coin.name, 
      image: coin.image, // <-- ADDED IMAGE
      current_price: coin.current_price, 
      price_change_percentage_24h: coin.price_change_percentage_24h, 
      total_volume: coin.total_volume, 
      market_cap: coin.market_cap,
      category: ["dogecoin", "shiba-inu", "pepe", "bonk", "floki"].includes(coin.id) ? "memes" : "crypto"
    }));
    
    return [...fallbackData.filter(c => c.category === "fiat"), ...formattedData];
  } catch (error) {
    return fallbackData;
  }
}

export default async function MarketsPage() {
  const coins = await getMarketsData();

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300">
      
      {/* BACKGROUND WATERMARKS (CSS Grid - No Overlap) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 p-4 place-items-center opacity-10 dark:opacity-5">
        {Array.from({ length: 48 }).map((_, i) => {
          const symbol = WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length];
          return (
            <span key={i} className="text-4xl md:text-6xl font-bold text-lime-900 dark:text-lime-100"
                  style={{ transform: `rotate(${(i * 15) % 60 - 30}deg)` }}>
              {symbol}
            </span>
          );
        })}
      </div>

      <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5]">Global Markets</h1>
          <p className="text-lime-800/70 dark:text-lime-200/50 mt-2 font-medium">Live prices for Crypto, Fiat, and Meme coins.</p>
        </div>

        <Suspense fallback={<div className="h-96 animate-pulse bg-white/40 dark:bg-[#0a0f0b]/60 rounded-3xl border border-lime-500/20" />}>
          <MarketTable initialCoins={coins} />
        </Suspense>
      </div>
    </div>
  );
}
// import { Suspense } from "react";
// import MarketTable, { MarketCoin } from "./MarketTable";

// // Cache the API response for 5 minutes to avoid CoinGecko rate limits
// async function getMarketsData(): Promise<MarketCoin[]> {
//   const fallbackData: MarketCoin[] = [
//     { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 64230, price_change_percentage_24h: 2.4, total_volume: 35000000000, market_cap: 1200000000000, category: "crypto" },
//     { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 3450, price_change_percentage_24h: -1.2, total_volume: 15000000000, market_cap: 400000000000, category: "crypto" },
//     { id: "solana", symbol: "sol", name: "Solana", current_price: 145, price_change_percentage_24h: 5.1, total_volume: 3000000000, market_cap: 65000000000, category: "crypto" },
//     { id: "dogecoin", symbol: "doge", name: "Dogecoin", current_price: 0.15, price_change_percentage_24h: 8.4, total_volume: 1200000000, market_cap: 20000000000, category: "memes" },
//     { id: "shiba-inu", symbol: "shib", name: "Shiba Inu", current_price: 0.000025, price_change_percentage_24h: -3.2, total_volume: 500000000, market_cap: 15000000000, category: "memes" },
//     { id: "pepe", symbol: "pepe", name: "Pepe", current_price: 0.000008, price_change_percentage_24h: 12.5, total_volume: 300000000, market_cap: 5000000000, category: "memes" },
//     { id: "eur", symbol: "eur", name: "Euro / USD", current_price: 1.08, price_change_percentage_24h: 0.1, total_volume: 500000000, market_cap: 0, category: "fiat" },
//     { id: "gbp", symbol: "gbp", name: "British Pound / USD", current_price: 1.27, price_change_percentage_24h: -0.2, total_volume: 200000000, market_cap: 0, category: "fiat" },
//     { id: "ngn", symbol: "ngn", name: "Naira / USD", current_price: 0.00065, price_change_percentage_24h: 1.5, total_volume: 10000000, market_cap: 0, category: "fiat" },
//   ];

//   try {
//     const res = await fetch(
//       "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false",
//       { next: { revalidate: 300 } } // Caches data for 5 mins
//     );

//     if (!res.ok) throw new Error("API limit reached");
//     const data = await res.json();

//     // Map API data to our type and inject categories
//     const formattedData: MarketCoin[] = data.map((coin: any) => {
//       let category = "crypto";
//       if (["dogecoin", "shiba-inu", "pepe", "bonk", "floki"].includes(coin.id)) category = "memes";
      
//       return {
//         id: coin.id,
//         symbol: coin.symbol,
//         name: coin.name,
//         current_price: coin.current_price,
//         price_change_percentage_24h: coin.price_change_percentage_24h,
//         total_volume: coin.total_volume,
//         market_cap: coin.market_cap,
//         category,
//       };
//     });

//     // Append Fiat currencies manually since CoinGecko markets API is crypto-only
//     const fiatCurrencies: MarketCoin[] = [
//       { id: "eur", symbol: "eur", name: "Euro", current_price: 1.08, price_change_percentage_24h: 0.1, total_volume: 500000000, market_cap: 0, category: "fiat" },
//       { id: "gbp", symbol: "gbp", name: "British Pound", current_price: 1.27, price_change_percentage_24h: -0.2, total_volume: 200000000, market_cap: 0, category: "fiat" },
//       { id: "ngn", symbol: "ngn", name: "Nigerian Naira", current_price: 0.00065, price_change_percentage_24h: 1.5, total_volume: 10000000, market_cap: 0, category: "fiat" },
//     ];

//     return [...fiatCurrencies, ...formattedData];
//   } catch (error) {
//     console.warn("Using fallback data due to API error/rate limit.");
//     return fallbackData;
//   }
// }

// export default async function MarketsPage() {
//   const coins = await getMarketsData();

//   return (
//     <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300">
      
//       {/* BACKGROUND AURORA GLOWS */}
//       <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
//       <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12">
//         <div className="mb-8">
//           <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5]">Global Markets</h1>
//           <p className="text-lime-800/70 dark:text-lime-200/50 mt-2 font-medium">Live prices for Crypto, Fiat, and Meme coins. Data is cached safely to prevent API limits.</p>
//         </div>

//         <Suspense fallback={<div className="h-96 animate-pulse bg-white/40 dark:bg-[#0a0f0b]/60 rounded-3xl border border-lime-500/20" />}>
//           <MarketTable initialCoins={coins} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }