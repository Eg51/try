# Quantix Solaris — Master Project Context & Update Log

## 1. Project Aim, Rules & Architecture
**Goal:** Build a highly gamified, international-standard trading platform (Commodities, Crypto, Meme Coins, Forex) to master Next.js 16 + MongoDB full-stack development.
**Vibe:** Dark-first, precision typography, "TradingView Pro × Linear" aesthetic.

**Strict Adherence Rules:**
*   **UI/Design:** Must strictly follow the "Light Glassy Lime" & "Premium Dark Forest" design system (Poppins, JetBrains Mono, glassmorphism, lime accents).
*   **Data:** All data must be fetched from and saved to the MongoDB database. No mock data.
*   **Code Quality:** No logic omissions. No placeholders. Code must be TypeScript error-free and build error-free.
*   **Base Accounting:** USD (integer minor units/cents). User display currency is a view-layer conversion.
*   **Server-Side Invariants:** The client never calculates final trade prices, fees, or tier permissions.

## 2. Tech Stack
*   **Framework:** Next.js 16 (App Router, Server Actions, Turbopack).
*   **Database:** MongoDB (Mongoose).
*   **Auth:** Firebase Admin (Session Cookies) + WebAuthn / Passkeys + Custom Email/Password (bcryptjs).
*   **Styling:** Tailwind CSS v4, Framer Motion.
*   **Cache/Rate Limiting:** Upstash Redis.
*   **Validation:** Zod.

## 3. CRITICAL Next.js 16 Rules
*   **Async Cookies:** `cookies()` is a Promise. Must use `await cookies()`.
*   **Cache/Prerender:** `export const dynamic = 'force-dynamic'` is deprecated. Use `export const instant = false;` at the top of dynamic pages.
*   **Layouts:** Every dynamic `layout.tsx` must have `await connection();` at the top of the component function.
*   **Hydration:** Avoid `Math.random()` or `Date.now()` in the initial render. Use `useMemo` for deterministic backgrounds (like the Watermarks).

## 4. The UI/UX Design System
*   **Light Mode:** Background `#f0fdf4`, Glass Card `#f4fbf5/90`, Primary `#65a30d` (lime-600), Text `#052e16`.
*   **Dark Mode:** Background `#050806`, Glass Card `#0a0f0b/90`, Primary `#65a30d`, Text `#ecfdf5`.
*   **Components:**
    *   **Glass Card:** `backdrop-blur-2xl border border-lime-500/20 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)]`.
    *   **Floating Label Inputs:** Labels share the exact background color of the card to create a border-masking cutout effect when they float up.
    *   **Buttons:** Solid lime for primary, glass outline for secondary.

---

## 5. Database Schema (MongoDB)
1.  **`users`**: Tracks `role` (user/admin), `status`, `kycTier` (0-3), `displayCurrency`, `xp`, `coins`, `completedTasks`, **`deviceIds` (array)**, **`resetPasswordToken`**, **`resetPasswordExpires`**, **`failedOtpAttempts`**, **`isResetBlocked`**.
2.  **`ledgeraccounts`**: Tracks `cachedBalance` (in cents), `assetId`, `type`.
3.  **`ledgertransactions`**: Append-only immutable history. Pre-save hook ensures sum(debits) === sum(credits).
4.  **`kycsubmissions`**: Tracks ID uploads, requested tier, and status. Sensitive PII is encrypted via `lib/encryption.ts` (AES-256-GCM).
5.  **`authenticators`**: Stores WebAuthn public keys, credential IDs, and counters.

---

## 6. Core Architecture & Recent Fixes (Phases 1 - 6)

### Phase 1-5: Core Features & UI Polish
*   **Ledger & Trading:** Implemented `placeOrderAction` with atomic `$inc` updates, fee calculation, and system accounts.
*   **KYC:** AES-256-GCM encryption applied to `User` and `Kyc` models via Mongoose hooks.
*   **Admin "God-Mode":** Market Control allows changing trends (bullish/bearish) that dynamically affect simulated prices in the Terminal and Dashboard.
*   **Notifications:** Real-time notification model, batching (500 at a time) for broadcasts to prevent OOM crashes.
*   **Skeletons:** Realistic glassmorphism `loading.tsx` wireframes created for all major routes.

### Phase 6: Authentication, Security & Admin Routing (LATEST FIXES)
**Files Modified:** `app/actions/auth.ts`, `app/login/page.tsx`, `proxy.ts`, `components/KycGuard.tsx`, `components/KycGate.tsx`, `lib/models/User.ts`, `lib/device.ts`.

*   **Admin Routing:**
    *   Backend actions (`loginWithEmail`, `loginWithFirebase`, `registerWithEmail`) now return `{ success: true, customToken, role }`.
    *   Frontend `handleSuccess(role)` routes to `/admin` if `role === 'admin'`, else routes to `/dashboard`.
    *   `proxy.ts` blocks admins from accessing `/dashboard` (redirects to `/admin`) and blocks users from `/admin`.
*   **Device Limiting & Security:**
    *   Created `lib/device.ts` to generate an HTTP-only `device_id` cookie (valid 1 year).
    *   **Signups:** Max 2 accounts per device.
    *   **Logins:** Max 3 accounts per device. Admins are restricted to 1 device.
*   **Strict Rate Limiting (Upstash Redis):**
    *   Admins: Max 3 login attempts / 15 mins.
    *   Users: Max 5 login attempts / 15 mins.
    *   Password Resets: Max 3 requests / hour per IP.
*   **Strict Password Reset (OTP Flow):**
    *   Generates a 6-digit OTP via `crypto.randomInt`. Hashes it before saving to DB.
    *   Expires in exactly 3 minutes.
    *   **Cooldown:** Users cannot request a new OTP until the 3 minutes expire.
    *   **Permanent Block:** After 2 failed OTP attempts, `isResetBlocked` becomes `true`. The user is permanently locked out of resets until an admin intervenes.
    *   Passwords hashed with `bcrypt` (12 rounds). Firebase sessions revoked (`revokeRefreshTokens`) upon successful reset.
*   **UI/UX Fixes:**
    *   **Autofill Bug:** Floating label inputs now check `isFloating` (React state) and target `peer-[&:-webkit-autofill]` to ensure Chrome autofill doesn't overlap text.
    *   **Glowing Errors:** `FloatingInput` accepts an `hasError` prop. Missing/invalid fields pulse with a red border and shadow.
    *   **Graceful Forms:** Added `noValidate` to forms. Native browser tooltips are disabled. Validation is handled manually, triggering the custom `ErrorModal`.
    *   **Admin KYC Bypass:** `KycGuard` and `KycGate` now accept an `isAdmin` prop. Admins bypass the forced KYC redirects and gating.

---

## 7. Immediate Next Steps (To-Do)
1.  **Admin UI Responsiveness & Design System Sync:**
    *   Fix `/admin` layout to strictly use the "Premium Dark Forest" glassmorphism (currently looks flat gray/black).
    *   Add personalized greeting: "Good Morning/Afternoon, [Admin Name]" (using `TimeGreeting` logic).
    *   Make the admin sidebar and dashboard fully responsive (mobile drawer/hamburger).
2.  **Admin Site Analytics Tab:**
    *   Create an `/admin/analytics` page.
    *   Add a widget to the Command Center for site traffic, active users over time, and volume charts.
3.  **URL Obfuscation (Slugs):**
    *   Add a random `slug` field to `Asset` and `Trade` models. Update routes to use `/[slug]` instead of `[id]` or `[symbol]`.
4.  **Real-Time Notifications (WebSockets):**
    *   Integrate Pusher/Ably to push events instantly instead of relying on `router.refresh()`.
5.  **Real File Uploads:**
    *   Replace Base64 KYC images with a real Cloudinary/S3 integration using UploadThing.