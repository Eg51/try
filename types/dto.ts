// types/dto.ts
export type SafeUser = {
  id: string; // Stringified ObjectId
  displayName: string;
  tier: 0 | 1 | 2 | 3;
  displayCurrency: string;
  role: 'user' | 'admin';
};