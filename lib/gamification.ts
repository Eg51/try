// lib/gamification.ts
export type Task = {
  id: string;
  title: string;
  description: string;
  xp: number;
  coins: number;
  type: 'daily' | 'onboarding' | 'trading';
};

export const TASKS: Task[] = [
  { id: "profile", title: "Complete your profile", description: "Add a display name and set your currency.", xp: 100, coins: 50, type: "onboarding" },
  { id: "first_trade", title: "Execute your first trade", description: "Buy or sell any asset in the terminal.", xp: 250, coins: 100, type: "onboarding" },
  { id: "wallet_check", title: "Check your wallet", description: "Visit the wallet page to view your balances.", xp: 50, coins: 20, type: "onboarding" },
  { id: "first_deposit", title: "Fund your account", description: "Receive your first deposit via the ledger.", xp: 150, coins: 75, type: "trading" },
  { id: "web_authn", title: "Enable Biometrics", description: "Set up FaceID/TouchID for secure login.", xp: 300, coins: 150, type: "onboarding" },
];

// Tier thresholds based on XP
export const TIER_THRESHOLDS = {
  1: 0,      // Tier 1: Default for verified users
  2: 500,    // Tier 2: Unlocks Crypto trading (requires 500 XP)
  3: 1500,   // Tier 3: Unlocks Meme coins & Forex (requires 1500 XP)
};