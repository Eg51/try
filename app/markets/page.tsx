import { Suspense } from "react";
import { cacheLife } from "next/cache";
import MarketTable, { MarketCoin } from "./MarketTable";
import { Flame, ShieldCheck } from "lucide-react";
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

const WATERMARK_SYMBOLS = [
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "₤", "₦", "₱", "₲", "₵", "₡", "₸",
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦",
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🪙"
];

const FIAT_NAMES: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen", CAD: "Canadian Dollar", AUD: "Australian Dollar", CHF: "Swiss Franc", CNY: "Chinese Yuan", INR: "Indian Rupee", BRL: "Brazilian Real", RUB: "Russian Ruble", ZAR: "South African Rand", KRW: "South Korean Won", SGD: "Singapore Dollar", HKD: "Hong Kong Dollar", NZD: "New Zealand Dollar", SEK: "Swedish Krona", NOK: "Norwegian Krone", DKK: "Danish Krone", PLN: "Polish Zloty", CZK: "Czech Koruna", HUF: "Hungarian Forint", RON: "Romanian Leu", TRY: "Turkish Lira", AED: "UAE Dirham", SAR: "Saudi Riyal", QAR: "Qatari Riyal", KWD: "Kuwaiti Dinar", ILS: "Israeli Shekel", EGP: "Egyptian Pound", KES: "Kenyan Shilling", GHS: "Ghanaian Cedi", ZMW: "Zambian Kwacha", UGX: "Ugandan Shilling", TZS: "Tanzanian Shilling", RWF: "Rwandan Franc", MAD: "Moroccan Dirham", DZD: "Algerian Dinar", TND: "Tunisian Dinar", MXN: "Mexican Peso", ARS: "Argentine Peso", CLP: "Chilean Peso", COP: "Colombian Peso", PEN: "Peruvian Sol", UYU: "Uruguayan Peso", PYG: "Paraguayan Guarani", BOB: "Bolivian Boliviano", VES: "Venezuelan Bolivar", GTQ: "Guatemalan Quetzal", CRC: "Costa Rican Colon", DOP: "Dominican Peso", JMD: "Jamaican Dollar", TTD: "Trinidad Dollar", BBD: "Barbadian Dollar", BSD: "Bahamian Dollar", BZD: "Belize Dollar", HNL: "Honduran Lempira", NIO: "Nicaraguan Cordoba", PAB: "Panamanian Balboa", HTG: "Haitian Gourde",
};

const FIAT_FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150, CAD: 1.36, AUD: 1.52, CHF: 0.89, CNY: 7.2, INR: 83.5, BRL: 5.4, RUB: 92, ZAR: 18.5, KRW: 1350, SGD: 1.35, HKD: 7.8, NZD: 1.64, SEK: 10.5, NOK: 10.7, DKK: 6.9, PLN: 4.0, CZK: 23.2, HUF: 360, RON: 4.58, TRY: 32.5, AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, ILS: 3.7, EGP: 47, KES: 130, GHS: 15, ZMW: 26, UGX: 3800, TZS: 2600, RWF: 1300, MAD: 10, DZD: 134, TND: 3.1, MXN: 17, ARS: 900, CLP: 950, COP: 3900, PEN: 3.7, UYU: 39, PYG: 7300, BOB: 6.9, VES: 36, GTQ: 7.8, CRC: 520, DOP: 58, JMD: 155, TTD: 6.8, BBD: 2, BSD: 1, BZD: 2, HNL: 24.7, NIO: 36.8, PAB: 1, HTG: 132,
};

const FIAT_MARKETS: MarketCoin[] = Object.entries(FIAT_FALLBACK_RATES).map(([code, rate]) => ({
  id: code.toLowerCase(), symbol: code.toLowerCase(), name: FIAT_NAMES[code] ?? code, image: "", current_price: code === "USD" ? 1 : 1 / rate, price_change_percentage_24h: 0, total_volume: 0, market_cap: 0, category: "fiat",
}));

const MEME_IDS = new Set([
  "dogecoin", "shiba-inu", "pepe", "bonk", "floki", "dogwifcoin", "book-of-meme", "brett-based", "mog-coin", "popcat", "cat-in-a-dogs-world", "dogelon-mars", "samoyedcoin", "akita-inu", "kishu-inu", "saitama-inu", "babydoge-coin", "wojak", "jeo-boden", "memecoin-2", "dog-go-to-the-moon-rune", "hoge-finance", "pitbull", "roco-finance", "kabosu", "tamadoge", "doge-killer", "cheems", "elon", "shiba-predator", "saitama", "volt-inu", "kishimoto", "catecoin", "daddy-dog", "floki-inu", "sundog", "mumu-the-bull", "retardio", "fartcoin", "ai16z", "goatseus-maximus", "chill-guy", "sigma", "gigachad", "moo-deng",
]);

const FALLBACK_CRYPTO: MarketCoin[] = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", current_price: 64230, price_change_percentage_24h: 2.4, total_volume: 35000000000, market_cap: 1200000000000, category: "crypto" },
  { id: "ethereum", symbol: "eth", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", current_price: 3450, price_change_percentage_24h: -1.2, total_volume: 15000000000, market_cap: 400000000000, category: "crypto" },
  { id: "solana", symbol: "sol", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png", current_price: 145, price_change_percentage_24h: 5.1, total_volume: 3000000000, market_cap: 65000000000, category: "crypto" },
  { id: "binancecoin", symbol: "bnb", name: "BNB", image: "", current_price: 590, price_change_percentage_24h: 1.1, total_volume: 1800000000, market_cap: 88000000000, category: "crypto" },
  { id: "ripple", symbol: "xrp", name: "XRP", image: "", current_price: 0.52, price_change_percentage_24h: -0.4, total_volume: 1200000000, market_cap: 29000000000, category: "crypto" },
  { id: "cardano", symbol: "ada", name: "Cardano", image: "", current_price: 0.45, price_change_percentage_24h: 0.8, total_volume: 400000000, market_cap: 16000000000, category: "crypto" },
  { id: "avalanche-2", symbol: "avax", name: "Avalanche", image: "", current_price: 35, price_change_percentage_24h: 2.2, total_volume: 350000000, market_cap: 13000000000, category: "crypto" },
  { id: "polkadot", symbol: "dot", name: "Polkadot", image: "", current_price: 6.8, price_change_percentage_24h: -0.7, total_volume: 200000000, market_cap: 9500000000, category: "crypto" },
  { id: "chainlink", symbol: "link", name: "Chainlink", image: "", current_price: 14.2, price_change_percentage_24h: 1.9, total_volume: 300000000, market_cap: 8500000000, category: "crypto" },
  { id: "matic-network", symbol: "matic", name: "Polygon", image: "", current_price: 0.72, price_change_percentage_24h: -1.1, total_volume: 250000000, market_cap: 7000000000, category: "crypto" },
  { id: "tron", symbol: "trx", name: "TRON", image: "", current_price: 0.12, price_change_percentage_24h: 0.3, total_volume: 200000000, market_cap: 10500000000, category: "crypto" },
  { id: "litecoin", symbol: "ltc", name: "Litecoin", image: "", current_price: 82, price_change_percentage_24h: 0.6, total_volume: 180000000, market_cap: 6100000000, category: "crypto" },
  { id: "bitcoin-cash", symbol: "bch", name: "Bitcoin Cash", image: "", current_price: 420, price_change_percentage_24h: -0.2, total_volume: 160000000, market_cap: 8300000000, category: "crypto" },
  { id: "stellar", symbol: "xlm", name: "Stellar", image: "", current_price: 0.11, price_change_percentage_24h: 0.5, total_volume: 90000000, market_cap: 3200000000, category: "crypto" },
  { id: "cosmos", symbol: "atom", name: "Cosmos", image: "", current_price: 8.4, price_change_percentage_24h: -0.9, total_volume: 110000000, market_cap: 3300000000, category: "crypto" },
];

const FALLBACK_MEMES: MarketCoin[] = [
  { id: "dogecoin", symbol: "doge", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", current_price: 0.15, price_change_percentage_24h: 8.4, total_volume: 1200000000, market_cap: 20000000000, category: "memes" },
  { id: "shiba-inu", symbol: "shib", name: "Shiba Inu", image: "", current_price: 0.000024, price_change_percentage_24h: 5.2, total_volume: 500000000, market_cap: 14000000000, category: "memes" },
  { id: "pepe", symbol: "pepe", name: "Pepe", image: "", current_price: 0.000008, price_change_percentage_24h: 12.1, total_volume: 800000000, market_cap: 3300000000, category: "memes" },
  { id: "bonk", symbol: "bonk", name: "Bonk", image: "", current_price: 0.000022, price_change_percentage_24h: -3.4, total_volume: 250000000, market_cap: 1500000000, category: "memes" },
  { id: "floki", symbol: "floki", name: "FLOKI", image: "", current_price: 0.00018, price_change_percentage_24h: 4.6, total_volume: 180000000, market_cap: 1700000000, category: "memes" },
  { id: "dogwifcoin", symbol: "wif", name: "dogwifhat", image: "", current_price: 2.8, price_change_percentage_24h: 6.8, total_volume: 300000000, market_cap: 2800000000, category: "memes" },
  { id: "book-of-meme", symbol: "bome", name: "Book of Meme", image: "", current_price: 0.012, price_change_percentage_24h: -2.1, total_volume: 120000000, market_cap: 800000000, category: "memes" },
  { id: "brett-based", symbol: "brett", name: "Brett", image: "", current_price: 0.14, price_change_percentage_24h: 1.7, total_volume: 70000000, market_cap: 1300000000, category: "memes" },
  { id: "mog-coin", symbol: "mog", name: "Mog Coin", image: "", current_price: 0.0000021, price_change_percentage_24h: 9.3, total_volume: 60000000, market_cap: 800000000, category: "memes" },
  { id: "popcat", symbol: "popcat", name: "Popcat", image: "", current_price: 0.9, price_change_percentage_24h: 3.5, total_volume: 90000000, market_cap: 900000000, category: "memes" },
];

async function getFiatMarkets(): Promise<MarketCoin[]> {
  "use cache";
  cacheLife("hours");
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("FX API failed");
    const data = await res.json();
    const rates = data?.rates as Record<string, number> | undefined;
    if (!rates) throw new Error("No FX rates");
    return Object.entries(rates)
      .filter(([code, rate]) => code.length === 3 && typeof rate === "number" && rate > 0)
      .map(([code, rate]) => ({
        id: code.toLowerCase(), symbol: code.toLowerCase(), name: FIAT_NAMES[code] ?? code, image: "", current_price: code === "USD" ? 1 : 1 / rate, price_change_percentage_24h: 0, total_volume: 0, market_cap: 0, category: "fiat" as const,
      }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  } catch {
    return FIAT_MARKETS;
  }
}

async function getCryptoAndMemeMarkets(): Promise<MarketCoin[]> {
  "use cache";
  cacheLife("minutes");
  const fallback = [...FALLBACK_CRYPTO, ...FALLBACK_MEMES];
  try {
    const topUrl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
    const memeUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${Array.from(MEME_IDS).join(",")}&order=market_cap_desc&sparkline=false`;

    const [topRes, memeRes] = await Promise.allSettled([fetch(topUrl), fetch(memeUrl)]);

    let raw: any[] = [];
    if (topRes.status === "fulfilled" && topRes.value.ok) raw.push(...(await topRes.value.json()));
    if (memeRes.status === "fulfilled" && memeRes.value.ok) raw.push(...(await memeRes.value.json()));
    if (raw.length === 0) throw new Error("CoinGecko failed");

    const deduped = new Map<string, any>();
    for (const coin of raw) { if (coin?.id) deduped.set(coin.id, coin); }

    return Array.from(deduped.values()).map((coin: any) => ({
      id: coin.id, symbol: coin.symbol, name: coin.name, image: coin.image ?? "", current_price: coin.current_price ?? 0, price_change_percentage_24h: coin.price_change_percentage_24h ?? 0, total_volume: coin.total_volume ?? 0, market_cap: coin.market_cap ?? 0, category: MEME_IDS.has(coin.id) ? "memes" : "crypto",
    }));
  } catch {
    return fallback;
  }
}

async function getMarketsData(): Promise<MarketCoin[]> {
  const [fiat, cryptoAndMemes] = await Promise.all([getFiatMarkets(), getCryptoAndMemeMarkets()]);
  return [...fiat, ...cryptoAndMemes];
}

export default async function MarketsPage() {
  // 1. Fetch Market Data (Cached)
  const coins = await getMarketsData();

  // 2. Fetch Session & User Tier
  const session = await getServerSession();
  let userTier = 0; // 0 means Demo User

  if (session) {
    await connectDB();
    // 👇 Option B applied here
    const user = await User.findById(session.id).lean();
    userTier = user?.kycTier ?? 1; // Use kycTier, fallback to 1
  }

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300">
      
      {/* DYNAMIC BANNER BASED ON LOGIN STATE */}
      {!session ? (
        <div className="relative z-50 bg-lime-600 text-white text-center py-2 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md">
          <Flame className="text-amber-500" size={16} /> DEMO MODE - No real funds are at risk
        </div>
      ) : (
        <div className="relative z-50 bg-blue-600 text-white text-center py-2 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md">
          <ShieldCheck className="text-blue-200" size={16} /> LIVE ACCOUNT - Tier {userTier} Access
        </div>
      )}

      {/* ... Rest of your MarketsPage JSX ... */}
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5]">
            Global Markets
          </h1>
          <p className="text-lime-800/70 dark:text-lime-200/50 mt-2 font-medium">
            {!session 
              ? "Explore live prices. Sign up to execute trades and unlock full features." 
              : `Welcome back. You are trading with Tier ${userTier} limits.`}
          </p>
        </div>

        <Suspense fallback={<div className="h-96 animate-pulse bg-white/40 dark:bg-[#0a0f0b]/60 rounded-3xl border border-lime-500/20" />}>
          <MarketTable initialCoins={coins} isLoggedIn={!!session} userTier={userTier} />
        </Suspense>
      </div>
    </div>
  );
}
// export default async function MarketsPage() {
//   const coins = await getMarketsData();
//   const session = await getServerSession();
//   let userTier = 0; // 0 means Demo User

//   if (session) {
//     await connectDB();
//     const user = await User.findById(session.id).lean();
//     userTier = user?.tier || 1;
//   }

//   return (
//     <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300">
      
//       {!session ? (
//         <div className="relative z-50 bg-lime-600 text-white text-center py-2 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md">
//           <Flame className="text-amber-500" size={16} /> DEMO MODE - No real funds are at risk
//         </div>
//       ) : (
//         <div className="relative z-50 bg-blue-600 text-white text-center py-2 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md">
//           <ShieldCheck className="text-blue-200" size={16} /> LIVE ACCOUNT - Tier {userTier} Access
//         </div>
//       )}

//       <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 p-4 place-items-center opacity-10 dark:opacity-5">
//         {Array.from({ length: 48 }).map((_, i) => {
//           const symbol = WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length];
//           return (
//             <span key={i} className="text-4xl md:text-6xl font-bold text-lime-900 dark:text-lime-100" style={{ transform: `rotate(${((i * 15) % 60) - 30}deg)` }}>
//               {symbol}
//             </span>
//           );
//         })}
//       </div>

//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12">
//         <div className="mb-8">
//           <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5]">
//             Global Markets
//           </h1>
//           <p className="text-lime-800/70 dark:text-lime-200/50 mt-2 font-medium">
//             {!session 
//               ? "Explore live prices. Sign up to execute trades and unlock full features." 
//               : `Welcome back. You are trading with Tier ${userTier} limits.`}
//           </p>
//         </div>

//         <Suspense fallback={<div className="h-96 animate-pulse bg-white/40 dark:bg-[#0a0f0b]/60 rounded-3xl border border-lime-500/20" />}>
//           <MarketTable initialCoins={coins} isLoggedIn={!!session} userTier={userTier} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }