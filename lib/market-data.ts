// lib/market-data.ts
import connectDB from "@/lib/db";
import Asset from "@/lib/models/Asset";

const FIAT_FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150, CAD: 1.36, AUD: 1.52, CHF: 0.89, CNY: 7.2, INR: 83.5, NGN: 1500,
  // ... add the rest of your fallback rates here if needed
};

export async function getAllMarketAssets() {
  await connectDB();
  
  // 1. Fetch DB Assets (Feeder Cache overrides)
  const dbAssets = await Asset.find({}).lean();
  const dbAssetMap = new Map(dbAssets.map((a: any) => [a.symbol.toUpperCase(), a]));

  // 2. Fetch CoinGecko & FX
  let apiData: any[] = [];
  try {
    const [fxRes, cgRes] = await Promise.allSettled([
      fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } }),
      fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false", { next: { revalidate: 300 } })
    ]);

    if (fxRes.status === "fulfilled" && fxRes.value.ok) {
      const fxData = await fxRes.value.json();
      Object.entries(fxData.rates).forEach(([code, rate]) => {
        if (code.length === 3 && typeof rate === "number") {
          apiData.push({
            id: code.toLowerCase(), symbol: code.toUpperCase(), name: code, image: "", 
            current_price: code === "USD" ? 1 : 1 / rate, category: "fiat",
            price_change_percentage_24h: 0, market_cap: 0, total_volume: 0
          });
        }
      });
    }

    if (cgRes.status === "fulfilled" && cgRes.value.ok) {
      const cgData = await cgRes.value.json();
      cgData.forEach((c: any) => {
        apiData.push({
          id: c.id, symbol: c.symbol.toUpperCase(), name: c.name, image: c.image,
          current_price: c.current_price, category: ["dogecoin", "shiba-inu", "pepe"].includes(c.id) ? "memes" : "crypto",
          price_change_percentage_24h: c.price_change_percentage_24h || 0,
          market_cap: c.market_cap, total_volume: c.total_volume
        });
      });
    }
  } catch (err) {
    console.error("Failed to fetch API assets", err);
  }

  // 3. Merge API + DB
  const merged = apiData.map(apiAsset => {
    const dbAsset = dbAssetMap.get(apiAsset.symbol);
    if (dbAsset) {
      if (!dbAsset.isActive) return null; // Admin Delisted
      return {
        ...apiAsset,
        name: dbAsset.name || apiAsset.name,
        current_price: dbAsset.basePrice !== undefined ? dbAsset.basePrice : apiAsset.current_price,
        isAdminApproved: true,
      };
    }
    return { ...apiAsset, isAdminApproved: false };
  }).filter(Boolean);

  // Sort approved first, then by market cap
  return merged.sort((a: any, b: any) => {
    if (a.isAdminApproved === b.isAdminApproved) return (b.market_cap || 0) - (a.market_cap || 0);
    return a.isAdminApproved ? -1 : 1;
  });
}