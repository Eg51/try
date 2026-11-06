# Quantix Solaris — Project Context & Update Log

## 1. Project Rules (Strict Adherence Required)
*   **UI/Design**: Must strictly follow the "Light Glassy Lime" & "Premium Dark Forest" design system (Poppins, JetBrains Mono, glassmorphism, lime accents).
*   **Data**: All data must be fetched from and saved to the MongoDB database. No mock data is allowed in production code.
*   **Code Quality**: No logic omissions. No placeholders (e.g., `// ... rest of code`). Code must be TypeScript error-free, build error-free (`npm run build`), and hydration error-free.
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
*   **Encryption**: Created `lib/encryption.ts` (AES-256-GCM). Added Mongoose `pre('save')` (using `async` functions to avoid TS errors) and `post('init')` hooks to `User.ts` and `Kyc.ts`.
*   **Proxy / Middleware**: Next.js 16 uses `proxy.ts` (middleware is deprecated). Removed the invalid `runtime: 'nodejs'` config (it's default in Next 16). It now properly blocks unauthenticated users on `/dashboard`, `/admin`, `/terminal`, and `/markets`.
*   **Global Settings**: Created `components/providers/UIProvider.tsx` to globally manage `SettingsModal`. 
*   **Context Ordering Fix**: Swapped `TourProvider` and `UIProvider` in `app/layout.tsx` so `SettingsModal` can access `useTour()`.
*   **KYC Gating**: Added backend check in `executeTradeAction` (`if (user.kycTier < 1) return { error: "KYC required." }`).
*   **Settings Action**: Created `app/actions/user.ts` (`updateUserSettingsAction`) with proper `revalidatePath` calls to prevent UI crashes.

### Phase 2: Admin "God-Mode" Market Control
*   **Database**: Created `lib/models/MarketSettings.ts` (4 time blocks, trend, intensity).
*   **Admin UI**: Created `app/admin/market-control/page.tsx` and `MarketControlCard.tsx`.
*   **Terminal Integration**: `TradingTerminal.tsx` fetches settings every 60s and applies a mathematical drift to candles.
*   **Dashboard Sync**: `DashboardClient.tsx` and `FavorablePairsCard.tsx` dynamically render SVG sparklines based on the Admin's active trend.

### Phase 3: Real Notifications & Broadcasts
*   **Database & Actions**: Created `Notification.ts` and `app/actions/notifications.ts`.
*   **Triggers**: Admin KYC approvals/rejections and user suspensions now generate DB notifications.
*   **Broadcast System**: Created `app/admin/notifications/page.tsx` and `BroadcastForm.tsx` for system-wide alerts.

### Phase 4: Real Trading Loop & PnL
*   **Real Data**: `app/actions/dashboard.ts` fetches real balances, trades, and ledger activity.
*   **Real PnL**: `DashboardClient.tsx` now calculates Mark Price and PnL using a block-progress algorithm (`basePrice * (1 + drift * progress)`) so prices drift realistically over the 4-hour block based on Admin intensity.
*   **Close Position**: Added "Close Position" button to the Dashboard table. Wired to `closeTradeAction` to update the ledger and refresh the UI.
*   **Auth UI**: Wired Email, Google, and Passkey buttons in `app/login/page.tsx`. 
*   **WebAuthn**: Updated `webauthn.ts` to use discriminated unions for error handling. Updated `WebAuthnSetup.tsx` to show real errors.

### Phase 5: UI Polish & Build Fixes
*   **404 Page**: Created `app/not-found.tsx` with exact physics-based watermarks and Aurora glows. Added "Go Back" logic with fallback.
*   **Side Navigation**: Created `components/ui/SideNavigation.tsx`. Includes drag-and-drop, auto-snapping to left/right edges, scroll mode selection (Gentle, Swift, Section), and history navigation (Back/Forward).
*   **Prerender Fix**: Added `export const instant = false` to `app/layout.tsx` to fix `/_not-found` build errors caused by `next-intl` cookies.

---

## 4. What Is Missing / Next Steps (CRITICAL)

### Prompt 3.1: Broadcast Pagination (OOM Prevention)
*   **Problem**: `broadcastNotification` uses `Notification.insertMany` on all users at once. If there are >10,000 users, this will crash the Node server.
*   **Fix**: Refactor to chunk the `users` array into batches of 500 and run the inserts sequentially.

### Prompt 3.2: Admin Ledger Revalidation
*   **Problem**: `adjustUserBalance` (Admin) does not refresh the user's dashboard.
*   **Fix**: Add `revalidatePath('/dashboard')` and `revalidatePath('/dashboard/wallet')` inside the action.

### Prompt 4.1: Migrate Base64 to Cloudinary/S3
*   **Problem**: KYC documents and Avatars are stored as Base64 strings in MongoDB. This will crash the DB at 16MB.
*   **Fix**: Create a Server Action to upload images to Cloudinary/S3 and save only the URL in MongoDB.

### Prompt 4.2: Real-Time Notifications (WebSockets)
*   **Problem**: The bell icon requires `router.refresh()` to show new notifications.
*   **Fix**: Integrate Pusher or Ably to push events from Admin actions instantly.

### Prompt 5.1: Skeleton Loaders
*   **Problem**: There is a white flash while server components fetch data.
*   **Fix**: Create `loading.tsx` in `/dashboard`, `/markets`, and `/terminal` with pulsing glassmorphism skeletons.

### Prompt 5.2: Ledger Imbalance Error Catch
*   **Problem**: If the double-entry math fails, the app crashes.
*   **Fix**: Wrap `LedgerTransaction.create()` in try/catch and return a user-friendly message.

### Prompt 6.1: URL Obfuscation (Slugs)
*   **Problem**: URLs expose data (e.g., `/markets/bitcoin`).
*   **Fix**: Add a random `slug` field to `Asset` and `Trade` models. Route to `/[slug]`.

### Prompt 7.1: Delete Orphaned Components
*   **Fix**: Remove `proxy.ts` (since we now know Next 16 uses `proxy.ts` instead of `middleware.ts`, wait... verify this), `OrderForm.tsx`, and old mock data arrays (`MOCK_NOTIFICATIONS`, etc.).

---

## 5. Immediate Next Action
Let's tackle **Prompt 3.1 (Broadcast Pagination)** and **Prompt 3.2 (Admin Ledger Revalidation)**. These are quick backend fixes that ensure the Admin God-Mode features don't crash the server.