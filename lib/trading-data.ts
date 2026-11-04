// lib/trading-data.ts

export interface AssetData {
  name: string;
  unit: string;
  base: number;
  region?: string;
  color: string;
  type: 'commodity' | 'fiat' | 'crypto' | 'meme';
}

export const COMMODITIES: Record<string, AssetData> = {
  // ==========================================
  // 1. LOCAL COMMODITIES (Existing)
  // ==========================================
  CHR: { name: 'Charcoal', unit: 'bag', base: 42.50, region: 'Enugu', color: '#f59e0b', type: 'commodity' },
  BLF: { name: 'Bitterleaf', unit: 'bundle', base: 18.20, region: 'Onitsha', color: '#10b981', type: 'commodity' },
  SCN: { name: 'Scrap iron', unit: 'tonne', base: 285.00, region: 'Kano', color: '#78716c', type: 'commodity' },
  ENO: { name: 'Condemned oil', unit: 'barrel', base: 62.40, region: 'P/H', color: '#1e293b', type: 'commodity' },
  PLM: { name: 'Palm oil', unit: 'litre', base: 2.85, region: 'Benin', color: '#ea580c', type: 'commodity' },
  GRI: { name: 'Garri', unit: 'kg', base: 1.45, region: 'Ibadan', color: '#ca8a04', type: 'commodity' }, 

  // ==========================================
  // 2. FIAT CURRENCIES
  // ==========================================
  USD: { name: 'US Dollar', unit: 'USD', base: 1.00, color: '#10b981', type: 'fiat' },
  EUR: { name: 'Euro', unit: 'EUR', base: 1.08, color: '#3b82f6', type: 'fiat' },
  GBP: { name: 'British Pound', unit: 'GBP', base: 1.27, color: '#8b5cf6', type: 'fiat' },
  NGN: { name: 'Nigerian Naira', unit: 'NGN', base: 0.00066, color: '#22c55e', type: 'fiat' },
  JPY: { name: 'Japanese Yen', unit: 'JPY', base: 0.0064, color: '#ef4444', type: 'fiat' },

  // ==========================================
  // 3. MAJOR CRYPTO
  // ==========================================
  BTC: { name: 'Bitcoin', unit: 'BTC', base: 64230.00, color: '#f59e0b', type: 'crypto' },
  ETH: { name: 'Ethereum', unit: 'ETH', base: 3450.00, color: '#627eea', type: 'crypto' },
  SOL: { name: 'Solana', unit: 'SOL', base: 145.00, color: '#14f195', type: 'crypto' },
  BNB: { name: 'Binance Coin', unit: 'BNB', base: 590.00, color: '#f3ba2f', type: 'crypto' },
  XRP: { name: 'Ripple', unit: 'XRP', base: 0.52, color: '#23292f', type: 'crypto' },
  ADA: { name: 'Cardano', unit: 'ADA', base: 0.45, color: '#0033ad', type: 'crypto' },

  // ==========================================
  // 4. MEME COINS
  // ==========================================
  DOGE: { name: 'Dogecoin', unit: 'DOGE', base: 0.15, color: '#c2a633', type: 'meme' },
  SHIB: { name: 'Shiba Inu', unit: 'SHIB', base: 0.000024, color: '#f00500', type: 'meme' },
  PEPE: { name: 'Pepe', unit: 'PEPE', base: 0.000008, color: '#4caf50', type: 'meme' },
  BONK: { name: 'Bonk', unit: 'BONK', base: 0.000022, color: '#f97316', type: 'meme' },
  FLOKI: { name: 'Floki', unit: 'FLOKI', base: 0.00018, color: '#fbbf24', type: 'meme' },
  WIF: { name: 'dogwifhat', unit: 'WIF', base: 2.80, color: '#d4a373', type: 'meme' },
};