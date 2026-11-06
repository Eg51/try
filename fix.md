# 🚀 Quantix Solaris: Production Readiness Fixes (`fix.md`)

This document outlines the critical prompts and tasks required to transition the application from a functional prototype to a secure, production-ready platform. 

Each prompt can be copied and pasted directly to an AI assistant or used as an instruction for a developer.

---

## Phase 1: Security, Auth & Edge Protection (CRITICAL)
*The platform is currently vulnerable to Server Action bypasses, missing middleware, and unwired auth UI.*

- [ ] **Prompt 1.1: Create the Missing `updateUserSettingsAction`**
  > "Act as a Senior Next.js Developer. I need the complete code for `app/actions/user.ts`. Create an `updateUserSettingsAction` that takes `{ currency: string, language: string }`, validates the session using `getServerSession`, connects to MongoDB, and updates the user's `displayCurrency.assetId` and `preferences.language`. Use `revalidatePath('/dashboard')` and `/terminal` so the UI updates immediately."

- [ ] **Prompt 1.2: Enforce Backend KYC Gating**
  > "In `app/actions/trade.ts`, update the `executeTradeAction`. Before processing the trade, fetch the user from MongoDB. If `user.kycTier < 1`, return `{ error: 'KYC verification required.' }`. Do not rely on the frontend `KycGate` component for security."

- [ ] **Prompt 1.3: Wire the Firebase Login UI**
  > "In `app/login/page.tsx`, replace the empty `onClick={() => {}}` handlers for the Email/Password Submit button, the Google button, and the Passkey button. Write the full logic using `signInWithEmailAndPassword`, `signInWithPopup(GoogleAuthProvider)`, and `startAuthentication`. Call the appropriate server actions (`loginWithFirebase`, `verifyAuthentication`) to set the session cookie."

- [ ] **Prompt 1.4: Implement Node.js Middleware**
  > "Rename `proxy.ts` to `middleware.ts`. Add `export const config = { matcher: ['/dashboard/:path*', '/admin/:path*', '/terminal/:path*'], runtime: 'nodejs' }`. Ensure the middleware checks the `session` cookie, verifies it with Firebase Admin, and checks the `User` model in MongoDB for the `suspended` status before allowing access."

---

## Phase 2: The Real Trading Engine (CRITICAL)
*The app currently generates fake candles and executes trades at static database prices.*

- [ ] **Prompt 2.1: Replace Fake Candlestick Generation**
  > "In `components/features/TradingTerminal.tsx`, remove the seeded mathematical `generateCandles` function. Replace it with a real data fetch. Fetch historical OHLCV data from an API (like Binance or CoinGecko) based on the selected timeframe, and use it to render the SVG chart."

- [ ] **Prompt 2.2: Fix Real PnL & Mark Price Calculations**
  > "In `app/dashboard/DashboardClient.tsx`, remove the fake `pos.entryPrice * 1.02` calculation for Mark Price. Update the table to fetch the *live* current price for each asset (from `dbAssets` or a new API), calculate the real Mark Price, and calculate the true Unrealized PnL: `(Current Price - Entry Price) * Amount` for Longs, and `(Entry Price - Current Price) * Amount` for Shorts."

- [ ] **Prompt 2.3: Implement Trade Closing on Dashboard**
  > "In `app/dashboard/DashboardClient.tsx`, add a 'Close Position' button to the Active Positions table. When clicked, trigger a confirmation modal, then call the `closeTradeAction` from `app/actions/trade.ts`. Pass the tradeId and the *current live price* to close the trade and realize the PnL."

---

## Phase 3: Backend Robustness & Data Integrity
*Preventing database crashes and ensuring data is synchronized across the platform.*

- [ ] **Prompt 3.1: Fix Broadcast Pagination**
  > "In `app/actions/admin-notifications.ts`, the `broadcastNotification` function uses `Notification.insertMany` on all users, which will crash if there are >10,000 users. Refactor this to chunk the `users` array into batches of 500 and run the inserts sequentially."

- [ ] **Prompt 3.2: Add Revalidation to Admin Ledger Adjustments**
  > "In `app/actions/admin-ledger.ts`, the `adjustUserBalance` function is missing revalidation. Add `revalidatePath('/dashboard')` and `revalidatePath('/dashboard/wallet')` so the user's UI updates instantly when the Admin adjusts their balance."

- [ ] **Prompt 3.3: Secure the Platform Fees**
  > "In `app/actions/trade.ts`, ensure the fee calculation pulls from the Admin Settings dynamically (`Settings.findOne().platformFeePercent`), rather than hardcoding `0.004`. Ensure the fee is deducted from the ledger correctly."

---

## Phase 4: Real-Time UX & File Storage
*Making the app feel like a modern Web3/Fintech platform.*

- [ ] **Prompt 4.1: Migrate Base64 Images to Cloudinary/S3**
  > "In `components/dashboard/UserAvatar.tsx` and `app/dashboard/kyc/KycClient.tsx`, the app currently stores Base64 strings in MongoDB. This will crash the DB at 16MB. Write a Server Action to upload these images to Cloudinary (or AWS S3) and save only the secure URL in the MongoDB document."

- [ ] **Prompt 4.2: Real-Time Notifications**
  > "In `components/providers/NotificationsProvider.tsx`, the app uses `router.refresh()` to check for new notifications. Implement Pusher or Ably to push notifications to the client in real-time. Create a `/api/pusher` route to authenticate, and trigger an event in the Admin actions when KYC is approved or a user is suspended."

---

## Phase 5: Error Handling & Loading States
*Preventing the app from feeling "frozen" during data fetching.*

- [ ] **Prompt 5.1: Add Next.js Skeleton Loaders**
  > "Create a `loading.tsx` file in `app/dashboard/`, `app/markets/`, and `app/terminal/`. Use Tailwind CSS to create beautiful, pulsing skeleton loaders that mimic the dashboard cards and market tables. This prevents the white flash while the server components fetch data."

- [ ] **Prompt 5.2: Catch Ledger Imbalance Errors**
  > "In `app/actions/trade.ts`, wrap the `LedgerTransaction.create()` call in a try/catch block. If the double-entry ledger pre-save hook throws an 'imbalance' error, return a user-friendly message: 'A system error prevented this trade. Our engineers have been notified.'"

---

## Phase 6: Deployment & DevOps (Vercel)
*Preparing the app for live traffic.*

- [ ] **Prompt 6.1: Format Firebase Private Key**
  > "Create a utility function in `lib/firebase-admin.ts` that robustly formats the `FIREBASE_PRIVATE_KEY` environment variable. Ensure it handles the `\n` replacement and removes quotes so it works seamlessly on Vercel."

- [ ] **Prompt 6.2: Integrate Sentry**
  > "Initialize Sentry in the Next.js project. Wrap the root layout with the Sentry Error Boundary and configure it to capture errors in the Server Actions (`trade.ts`, `auth.ts`)."

- [ ] **Prompt 6.3: Set up Vercel Cron Jobs**
  > "Create a `vercel.json` file and an API route `app/api/cron/liquidate/route.ts`. This cron job should run every minute to check active trades and trigger a margin call/liquidation if the live price hits the user's Stop Loss."

---

## Phase 7: Refactoring & Cleanup
*Removing obsolete code from the prototype phase.*

- [ ] **Prompt 7.1: Delete Orphaned Components**
  > "Remove unused files: `app/dashboard/markets/OrderForm.tsx`, `app/dashboard/markets/page.tsx`, and any mock data arrays (`MOCK_NOTIFICATIONS`, `INITIAL_POSITIONS`, `MARKETS`) that are no longer being imported."

- [ ] **Prompt 7.2: Clean up `proxy.ts`**
  > "Ensure `proxy.ts` is deleted from the root directory now that `middleware.ts` has been implemented."