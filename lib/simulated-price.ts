// lib/simulated-price.ts
import { TrendType } from "./models/MarketSettings";

export type MarketBlock = { trend: TrendType; intensity: number };

/**
 * Calculates the progress through the current 4-hour block (0.0 to 1.0)
 */
export function getBlockProgress(): number {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentHour = hour + minute / 60;
  
  let start: number, end: number;
  if (hour < 7) { start = 0; end = 7; }
  else if (hour < 12) { start = 7; end = 12; }
  else if (hour < 18) { start = 12; end = 18; }
  else { start = 18; end = 24; }
  
  return Math.min(1, Math.max(0, (currentHour - start) / (end - start)));
}

/**
 * Calculates the simulated price based on base price, trend, intensity, and block progress.
 */
export function calculateSimulatedPrice(basePrice: number, block: MarketBlock): number {
  let drift = 0;
  const intensityMultiplier = block.intensity / 100;
  
  if (block.trend === "bullish") drift = intensityMultiplier;
  else if (block.trend === "bearish") drift = -intensityMultiplier;

  const progress = getBlockProgress();
  
  return basePrice * (1 + drift * progress);
}

/**
 * Determines which block is currently active based on the server's time.
 */
export function getActiveBlock(settings: any): MarketBlock {
  const hour = new Date().getHours();
  let activeBlock = settings.block4;
  
  if (hour >= 0 && hour < 7) activeBlock = settings.block1;
  else if (hour >= 7 && hour < 12) activeBlock = settings.block2;
  else if (hour >= 12 && hour < 18) activeBlock = settings.block3;

  return {
    trend: activeBlock.trend as TrendType,
    intensity: activeBlock.intensity || 5,
  };
}