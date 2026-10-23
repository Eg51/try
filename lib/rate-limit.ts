// lib/rate-limit.ts
import { redis } from './redis';

export async function checkRateLimit(identifier: string, limit: number = 10, windowSeconds: number = 60) {
  const key = `ratelimit:${identifier}`;
  
  const currentCount = await redis.incr(key);
  
  if (currentCount === 1) {
    // If it's the first request, set the expiration window
    await redis.expire(key, windowSeconds);
  }

  if (currentCount > limit) {
    return { success: false, limit, remaining: 0 };
  }

  return { success: true, limit, remaining: limit - currentCount };
}