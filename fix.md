# 🚀 Quantix Solaris: Production Readiness Fixes (`fix.md`)

This document outlines the critical prompts and tasks required to transition the application from a functional prototype to a secure, production-ready platform. 

Each prompt can be copied and pasted directly to an AI assistant or used as an instruction for a developer.

---

## Phase 1: Security, Auth & Edge Protection (CRITICAL)
*The platform is currently vulnerable to Server Action bypasses, missing middleware, and unwired auth UI.*

- [x] **Prompt 1.1: Create the Missing `updateUserSettingsAction`**
  > "Act as a Senior Next.js Developer. I need the complete code for `app/actions/user.ts`. Create an `updateUserSettingsAction` that takes `{ currency: string, language: string }`, validates the session using `getServerSession`, connects to MongoDB, and updates the user's `displayCurrency.assetId` and `preferences.language`. Use `revalidatePath('/dashboard')` and `/terminal` so the UI updates immediately."
  *(Completed: Added `revalidatePath` and proper Mongoose updates).*

- [x] **Prompt 1.2: Enforce Backend KYC Gating**
  > "In `app/actions/trade.ts`, update the `executeTradeAction`. Before processing the trade, fetch the user from MongoDB. If `user.kycTier < 1`, return `{ error: 'KYC verification required.' }`. Do not rely on the frontend `KycGate` component for security."
  *(Completed: Added KYC check inside `executeTradeAction`).*

- [x] **Prompt 1.3: Wire the Firebase Login UI**
  > "In `app/login/page.tsx`, replace the empty `onClick={() => {}}` handlers for the Email/Password Submit button, the Google button, and the Passkey button. Write the full logic using `signInWithEmailAndPassword`, `signInWithPopup(GoogleAuthProvider)`, and `startAuthentication`. Call the appropriate server actions (`loginWithFirebase`, `verifyAuthentication`) to set the session cookie."
  *(Completed: Wired up all auth handlers with proper loading/error states).*

- [x] **Prompt 1.4: Implement Node.js Middleware / Proxy**
  > "In Next.js 16, `middleware.ts` is deprecated in favor of `proxy.ts`. Ensure `proxy.ts` exists at the root with `export async function proxy`. Verify it checks the `session` cookie, verifies it with Firebase Admin, and checks the `User` model in MongoDB for the `suspended` status before allowing access to `/dashboard`, `/admin`, `/terminal`, and `/markets`."
  *(Completed: Removed the invalid `runtime: 'nodejs'` config since Next 16 defaults to Node.js for `proxy.ts`).*

---

## Phase 2: The Real Trading Engine (CRITICAL)

- [x] **Prompt 2.1: Replace Fake Candlestick Generation**
  > "In `components/features/TradingTerminal.tsx`, remove the seeded mathematical `generateCandles` function. Instead of fetching external APIs, we are using the **Admin God-Mode Market Engine**. Fetch `MarketSettings` from MongoDB based on the current time block, and apply a mathematical drift to the candle generation (Bullish, Bearish, Consolidate) based on the Admin's intensity setting."
  *(Completed: Admin can now control the macro trend of the charts).*

- [x] **Prompt 2.2: Fix Real PnL & Mark Price Calculations**
  > "In `app/dashboard/DashboardClient.tsx`, remove the fake `pos.entryPrice * 1.02` calculation for Mark Price. Update the table to calculate the Mark Price using the Admin's active MarketSettings (drift over block progress), and calculate the true Unrealized PnL."
  *(Completed: Dashboard uses block-progress math to calculate realistic PnL).*

- [x] **Prompt 2.3: Implement Trade Closing on Dashboard**
  > "In `app/dashboard/DashboardClient.tsx`, add a 'Close Position' button to the Active Positions table. When clicked, trigger a confirmation modal, then call the `closeTradeAction` from `app/actions/trade.ts`. Pass the tradeId and the *current simulated mark price* to close the trade and realize the PnL."
  *(Completed: Users can now close positions directly from the dashboard).*

---

## Phase 3: Backend Robustness & Data Integrity

- [x] **Prompt 3.1: Fix Broadcast Pagination**
  > "In `app/actions/admin-notifications.ts`, the `broadcastNotification` function uses `Notification.insertMany` on all users, which will crash if there are >10,000 users. Refactor this to chunk the `users` array into batches of 500 and run the inserts sequentially."
  *(Completed: Implemented batching to prevent OOM crashes).*

- [x] **Prompt 3.2: Add Revalidation to Admin Ledger Adjustments**
  > "In `app/actions/admin-ledger.ts`, the `adjustUserBalance` function is missing revalidation. Add `revalidatePath('/dashboard')` and `revalidatePath('/dashboard/wallet')` so the user's UI updates instantly when the Admin adjusts their balance."
  *(Completed).*

- [x] **Prompt 3.3: Secure the Platform Fees**
  > "In `app/actions/trade.ts`, ensure the fee calculation pulls from the Admin Settings dynamically (`Settings.findOne().platformFeePercent`), rather than hardcoding `0.004`. Ensure the fee is deducted from the ledger correctly."
  *(Completed).*

---

## Phase 4: Real-Time UX & File Storage

- [x] **Prompt 4.1: Handle Base64 Images (Compression Strategy)**
  > "Instead of migrating to Cloudinary, we are using client-side compression in `UserAvatar.tsx` to resize images to 400px and reduce quality until they are under 100KB. This ensures MongoDB's 16MB document limit is never reached for avatars and KYC images."
  *(Completed: Handled via `handleCompress` in UserAvatar).*

- [ ] **Prompt 4.2: Real-Time Notifications (WebSockets)**
  > "In `components/providers/NotificationsProvider.tsx`, the app uses `router.refresh()` to check for new notifications. Implement Pusher or Ably to push notifications to the client in real-time. Create a `/api/pusher` route to authenticate, and trigger an event in the Admin actions when KYC is approved or a user is suspended."

---

## Phase 5: Error Handling & Loading States

- [x] **Prompt 5.1: Add Next.js Skeleton Loaders**
  > "Create `loading.tsx` files for all major routes (Dashboard, Markets, Terminal, Admin, Profile, Wallet, Transfer, KYC, Settings, Notifications, Rewards, Assets, Market Control). Use Tailwind CSS to create beautiful, pulsing skeleton loaders that mimic the actual layout."
  *(Completed: Wireframes created for every route).*

- [x] **Prompt 5.2: Catch Ledger Imbalance Errors**
  > "In `app/actions/trade.ts`, wrap the `LedgerTransaction.create()` call in a try/catch block. If the double-entry ledger pre-save hook throws an 'imbalance' error, return a user-friendly message: 'A system error prevented this trade. Our engineers have been notified.'"
  *(Completed: Added specific `try/catch` around the ledger creation).*

---

## Phase 6: Deployment & DevOps (Vercel)

- [x] **Prompt 6.1: Format Firebase Private Key**
  > "In `lib/firebase-admin.ts`, ensure the `FIREBASE_PRIVATE_KEY` environment variable is robustly formatted. Handle the `\n` replacement and remove quotes so it works seamlessly on Vercel."
  *(Completed).*

- [ ] **Prompt 6.2: Integrate Sentry**
  > "Initialize Sentry in the Next.js project. Wrap the root layout with the Sentry Error Boundary and configure it to capture errors in the Server Actions (`trade.ts`, `auth.ts`)."

- [ ] **Prompt 6.3: Set up Vercel Cron Jobs**
  > "Create a `vercel.json` file and an API route `app/api/cron/liquidate/route.ts`. This cron job should run every minute to check active trades and trigger a margin call/liquidation if the live price hits the user's Stop Loss."

---

## Phase 7: Refactoring & URL Obfuscation

- [ ] **Prompt 7.1: URL Obfuscation (Slugs)**
  > "Add a random `slug` field (e.g., a8f9c2b1) to `Asset` and `Trade` models. Update the routing from `/markets/[id]` to `/markets/[slug]`. Ensure that all `router.push` calls and internal links use the slug instead of the symbol or MongoDB _id."

- [ ] **Prompt 7.2: Delete Orphaned Components**
  > "Remove unused prototype files: `app/dashboard/markets/OrderForm.tsx`, `app/dashboard/settings/CurrencySelector.tsx`, and any remaining mock data arrays (`MOCK_NOTIFICATIONS`, `INITIAL_POSITIONS`, `MARKETS` in `app/demo/page.tsx` if it hasn't been fully replaced by the DB version)."

- [ ] **Prompt 7.3: Translation Automation**
  > "Instead of hardcoding 19 JSON files, integrate a tool like `translate-kit` or `next-auto-intl` to automatically scan the source code, extract strings, and generate translated JSON files using OpenAI or Google Translate."