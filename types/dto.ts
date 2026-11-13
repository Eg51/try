// types/dto.ts
export type SafeUser = {
  id: string; 
  displayName: string;
  email: string;
  tier: 0 | 1 | 2 | 3;
  displayCurrency: string;
  role: 'user' | 'admin';
};