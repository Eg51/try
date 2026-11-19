// lib/rate-limit.ts
import { redis } from './redis';

// 1. Check if the user is currently blocked
export async function checkRateLimit(identifier: string, limit: number = 10, windowSeconds: number = 60) {
  const key = `ratelimit:${identifier}`;
  const currentCount = await redis.get<number>(key) || 0;
  
  if (currentCount >= limit) {
    return { success: false, limit, remaining: 0 };
  }
  return { success: true, limit, remaining: limit - currentCount };
}

// 2. Increment the counter ONLY when a login fails
export async function incrementFailedAttempt(identifier: string, windowSeconds: number = 900) {
  const key = `ratelimit:${identifier}`;
  const newCount = await redis.incr(key);
  if (newCount === 1) {
    await redis.expire(key, windowSeconds);
  }
}

// 3. Clear the counter when a login succeeds
export async function resetRateLimit(identifier: string) {
  const key = `ratelimit:${identifier}`;
  await redis.del(key);
}




// // lib/rate-limit.ts
// import { redis } from './redis';

// export async function checkRateLimit(identifier: string, limit: number = 10, windowSeconds: number = 60) {
//   const key = `ratelimit:${identifier}`;
  
//   const currentCount = await redis.incr(key);
  
//   if (currentCount === 1) {
//     // If it's the first request, set the expiration window
//     await redis.expire(key, windowSeconds);
//   }

//   if (currentCount > limit) {
//     return { success: false, limit, remaining: 0 };
//   }

//   return { success: true, limit, remaining: limit - currentCount };
// }