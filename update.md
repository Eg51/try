# Quantix Solaris — Project Context & Update Log

## 1. Project Rules (Strict Adherence Required)
*   **UI/Design**: Must strictly follow the "Light Glassy Lime" & "Premium Dark Forest" design system (Poppins, JetBrains Mono, glassmorphism, lime accents).
*   **Data**: All data must be fetched from and saved to the MongoDB database. No mock data is allowed in production code.
*   **Code Quality**: No logic omissions. No placeholders. Code must be TypeScript error-free, build error-free (`npm run build`), and hydration error-free.
*   **Logic Changes**: If logic must be changed, the AI *must* explicitly state the current logic, why it's being changed, and what the new logic is before providing the code.

## 2. Tech Stack
*   **Framework**: Next.js 16 (App Router, Server Actions, Turbopack)
*   **Database**: MongoDB (Mongoose)
*   **Auth**: Firebase Admin (Session Cookies) + WebAuthn / Passkeys
*   **Styling**: Tailwind CSS v4, Framer Motion
*   **Cache/Rate Limiting**: Upstash Redis

---

## 3. What We Have Completed So Far

### Phase 1: Security, Middleware & Encryption
*   **Encryption**: Created `lib/encryption.ts` (AES-256-GCM). Added Mongoose `pre('save')` hooks to `User.ts` and `Kyc.ts`.
*   **Proxy / Middleware**: Next.js 16 uses `proxy.ts` (middleware is deprecated). Removed the invalid `runtime: 'nodejs'` config (it's default in Next 16). It properly blocks unauthenticated users on `/dashboard`, `/admin`, `/terminal`, and `/markets`.
*   **KYC Gating**: Added backend check in `executeTradeAction` (`if (user.kycTier < 1) return { error: "KYC required." }`).
*   **Settings Action**: Created `app/actions/user.ts` (`updateUserSettingsAction`) with proper `revalidatePath` calls.
*   **Build Fixes**: Resolved Next.js 16 `/_not-found` prerender errors using `export const instant = false` and `useTour` provider ordering.

### Phase 2: Admin "God-Mode" Market Control
*   **Database & UI**: Created `MarketSettings.ts` and `app/admin/market-control/page.tsx`.
*   **Terminal Integration**: `TradingTerminal.tsx` fetches settings every 60s and applies a mathematical drift to candles.
*   **Dashboard Sync**: `DashboardClient.tsx` and `FavorablePairsCard.tsx` dynamically render SVGs based on the Admin's active trend.

### Phase 3: Backend Robustness & Notifications
*   **Real Notifications**: Created `Notification.ts` and `app/actions/notifications.ts`. Triggers added to KYC approvals and user suspensions.
*   **Broadcast System**: Created `app/admin/notifications/page.tsx` with **Pagination Batching** (chunks of 500) to prevent OOM crashes.
*   **Ledger Revalidation**: `adjustUserBalance` now calls `revalidatePath('/dashboard')` and `/dashboard/wallet`.
*   **Trade Closing**: Implemented real PnL, block-progress math, and a "Close Position" button on the Dashboard.

### Phase 4: Profile, Settings & Modals (UI/UX Polish)
*   **Profile Page**: Integrated real `UserAvatar`, added `updateProfileNameAction`, wired "Manage Passkeys" and "Display Currency" to the correct routes/modals.
*   **Settings Discrepancy Fixed**: `app/dashboard/settings/page.tsx` now uses the glassmorphism design and focuses purely on Security (WebAuthn). All Preferences (Language, Currency, Theme) are deferred to the Global `SettingsModal`.
*   **UserAvatar Portal Fix**: Wrapped the Avatar dropdowns in a `createPortal` so they no longer get clipped by `overflow-hidden` containers.
*   **Header Navigation**: Fixed the "Profile" menu link in `HeaderActions.tsx` to properly route via `useRouter` if no callback is passed.

### Phase 5: Skeleton Loaders (Wireframes)
*   Created realistic, glassmorphism wireframe skeletons (`loading.tsx`) for **ALL** major routes:
    *   `app/loading.tsx` (Landing)
    *   `app/dashboard/loading.tsx`
    *   `app/dashboard/wallet/loading.tsx`
    *   `app/dashboard/transfer/loading.tsx`
    *   `app/dashboard/rewards/loading.tsx`
    *   `app/dashboard/notifications/loading.tsx`
    *   `app/dashboard/kyc/loading.tsx`
    *   `app/dashboard/profile/loading.tsx`
    *   `app/dashboard/settings/loading.tsx`
    *   `app/markets/loading.tsx`
    *   `app/markets/[id]/loading.tsx`
    *   `app/terminal/loading.tsx`
    *   `app/admin/loading.tsx`
    *   `app/admin/users/loading.tsx`
    *   `app/admin/kyc/loading.tsx`
    *   `app/admin/kyc/[id]/loading.tsx`
    *   `app/admin/ledger/loading.tsx`
    *   `app/admin/notifications/loading.tsx`
    *   `app/admin/settings/loading.tsx`
    *   `app/admin/market-control/loading.tsx`
    *   `app/admin/assets/loading.tsx`

---

## 4. What Is Missing / Next Steps

### Prompt 6.1: URL Obfuscation (Slugs)
*   **Problem**: URLs expose data (e.g., `/markets/bitcoin`). 
*   **Fix**: Add a random `slug` field to `Asset` and `Trade` models. Update routes to use `/[slug]` instead of `[id]` or `[symbol]`.

### Prompt 4.2: Real-Time Notifications (WebSockets)
*   **Problem**: The bell icon requires `router.refresh()` to show new notifications.
*   **Fix**: Integrate Pusher or Ably to push events from Admin actions instantly.

### Prompt 5.2: Ledger Imbalance Error Catch
*   **Problem**: If the double-entry math fails, the app crashes.
*   **Fix**: Wrap `LedgerTransaction.create()` in try/catch and return a user-friendly message. *(Note: Partially completed, needs final review).*

### Prompt 7.1: Delete Orphaned Components
*   **Fix**: Remove prototype files like `app/dashboard/markets/OrderForm.tsx`, `CurrencySelector.tsx`, and old mock data arrays. 

### Translation Automation (Deferred)
*   **Task**: Instead of hardcoding 19 JSON files, integrate a tool like `translate-kit` or `next-auto-intl` to automatically generate translation files based on the English source code.

---

## 5. Immediate Next Action
Since the UI is now heavily polished with Skeleton Loaders and unified Modals, let's tackle **Prompt 6.1 (URL Obfuscation - Slugs)**. 

This involves modifying the `Asset` and `Trade` models to generate random strings (e.g., `a8f9c2b1`) and updating all routing to use those instead of human-readable IDs.