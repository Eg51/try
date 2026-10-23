# Quantix Solaris - Build Session Notes
**Date:** 2026-10-21
**Status:** Phase 1 (Foundation & Backend Core) Complete.

---

## 1. Project Overview & Architecture
**Goal:** Build a highly gamified, international-standard trading platform (Commodities, Crypto, Meme Coins, Forex) to master Next.js + MongoDB full-stack development.
**Vibe:** Dark-first, precision typography, "TradingView Pro × Linear" aesthetic.

**Tech Stack:**
- **Frontend:** Next.js 16.4 (App Router, Turbopack), React 19, TypeScript.
- **Styling:** Tailwind CSS v4, Lucide Icons.
- **Auth:** Firebase Auth (Google) + WebAuthn (future) mapped to MongoDB sessions.
- **Database:** MongoDB (Mongoose).
- **Cache/Order Book:** Upstash Redis.
- **Validation:** Zod.

**Core Architecture Rules:**
1. **Single Database:** Do not use multiple MongoDB URIs. Use collections (`users`, `ledger`, `orders`) to separate domains.
2. **Base Accounting Unit:** USD (integer minor units/cents). User display currency is a view-layer conversion.
3. **Double-Entry Ledger:** Balances are never updated directly; they are appended via immutable transactions.
4. **Server-Side Invariants:** The client never calculates final trade prices, fees, or tier permissions. The server validates everything.

---

## 2. The UI/UX & Component Rules
- **Rendering Rules:** Static shells + Dynamic holes (`<Suspense>`). Cache is opt-in. User data is never cached at the CDN.
- **Prop Rules:** Primitives (Buttons) get wide props. Features (OrderTicket) get narrow props + children. Everything crossing Server -> Client must be serializable.
- **Design System:** Dark mode default. Gold accent (`#E8B54B`). Deep charcoal surfaces.
- **Error Handling:** Friendly meme vectors in a modal for errors. 12 core error codes (`NETWORK_OFFLINE`, `AUTH_EXPIRED`, etc.).

---

## 3. Database Schema (MongoDB/Mongoose)
We established the core models using Mongoose. All money is stored as integers (cents).

### A. User Model (`lib/models/User.ts`)
Tracks identity, roles, and tier.
- `role`: `'user' | 'admin'`
- `kycTier`: `0 | 1 | 2 | 3`
- `displayCurrency`: `{ assetId: string, selectedAt: Date }` (e.g., CAD, ETH, DOGE)
- `lastSeenAt`: Updated on login/refresh to track active sessions.

### B. Ledger Model (`lib/models/Ledger.ts`)
The financial heart of the app.
- **LedgerAccount:** Represents a user's wallet for a specific asset. Tracks `cachedBalance` and `version`.
- **LedgerTransaction:** Append-only. Contains an array of `entries`. 
  - Has a Mongoose `pre('save')` hook that mathematically guarantees `sum(debits) === sum(credits)`.
  - Uses `idempotencyKey` to prevent double-spending if a request is duplicated.

---

## 4. Files & Code Built So Far

### Backend Utility (`lib/`)
- **`db.ts`**: Global MongoDB connection caching to prevent exhausting connections on Vercel serverless functions.
- **`firebase-admin.ts`**: Initializes the Firebase Admin SDK using environment variables for secure token verification.
- **`redis.ts`**: Initializes the Upstash Redis client for rate limiting and (future) order book.
- **`session.ts`**: The security boundary. Verifies the `httpOnly` session cookie via Firebase Admin, then fetches the user from MongoDB.
- **`rate-limit.ts`**: Redis-based API rate limiter (e.g., max 10 requests per 60 seconds).

### Server Actions (`app/actions/auth.ts`)
- **`loginWithFirebase`**: Receives the Firebase ID token from the client. Verifies it using Firebase Admin. Finds or creates the user in MongoDB. Bootstraps their Ledger Accounts (USD, BTC, etc.). Issues a secure `httpOnly` session cookie.
- **`logout`**: Deletes the session cookie.

### UI Components (`components/`)
- **`Button.tsx`**: 3-tier variants (primary, secondary, ghost). Built with `clsx` and `tailwind-merge`.
- **`Input.tsx`**: Secure input with `autoComplete="off"` and error states.
- **`ErrorModal.tsx`**: The friendly error boundary (mapped to codes like `NETWORK_OFFLINE`, `AUTH_EXPIRED`).

### Pages (`app/`)
- **`login/page.tsx`**: Client-side component that triggers Google Auth via Firebase, grabs the token, and calls `loginWithFirebase`.

---

## 5. Environment Variables (`env.local`)
Required keys:
```env
MONGODB_URI="..."
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
NEXT_PUBLIC_FIREBASE_API_KEY="..."
# (plus other client-side firebase keys)
# Quantix Solaris — Session Notes & Build Log

**Project:** Highly gamified, international-standard trading platform (Commodities, Crypto, Meme Coins, Forex).
**Status:** Core MVP Complete. Authentication, Trading, Admin & Gamification Flows operational.

---

## 1. Project Aim & Vision
To build a production-grade, full-stack trading application that mimics the quality of institutional platforms (like Webull/TradingView) while incorporating deep gamification. The goal is to master Next.js 16 + MongoDB architecture, security, and state management.

**Core Design Philosophies:**
- **Dark-First UI:** Premium, precision typography, high-contrast champagne gold accents.
- **Secure by Design:** Server-side validation, HttpOnly cookies, Zero client-side trust.
- **Double-Entry Accounting:** Financial integrity is paramount. Balances are derived, never mutated.
- **Gamified Progression:** Users unlock higher KYC tiers (and asset classes) by completing tasks and earning XP.

---

## 2. Tech Stack
- **Frontend:** Next.js 16.4.2 (App Router, Turbopack), React 19, Tailwind CSS v4.
- **Backend:** Next.js Server Actions, Firebase Admin SDK.
- **Database:** MongoDB (Mongoose).
- **Auth:** Firebase (Google OAuth) + MongoDB (Email/Password via bcryptjs) + WebAuthn (Biometrics).
- **Cache/Rate Limiting:** Upstash Redis.
- **Validation:** Zod.

---

## 3. Database Schema (MongoDB)
We use a single database (`quantix-dev` / `quantix-prod`) with the following collections:

1.  **`users`**: Core identity. Tracks `role` (user/admin), `status` (active/suspended), `kycTier` (0-3), `displayCurrency`, `xp`, `coins`, and `completedTasks`.
2.  **`ledgeraccounts`**: The "wallets". Tracks `cachedBalance` (in minor units/cents), `assetId` (USD, BTC, ETH), and `type` (available, escrow).
3.  **`ledgertransactions`**: Append-only immutable history. Contains `entries` (debits/credits). Has a pre-save hook that ensures transactions balance to zero.
4.  **`kycsubmissions`**: Tracks ID uploads, requested tier, and approval/rejection status.
5.  **`authenticators`**: Stores WebAuthn public keys, credential IDs, and counters for biometric login.

---

## 4. Core Architecture & Implementation Details

### A. The Authentication Flow (The Hybrid Model)
- **Email/Password:** Handled by MongoDB (`bcryptjs`). On success, the Server Action mints a Firebase **Custom Token**.
- **Google Login:** Handled by Firebase Client SDK (`signInWithPopup` in dev, `signInWithRedirect` in prod).
- **WebAuthn (Biometrics):** Handled via `@simplewebauthn` and stored in MongoDB. On success, the Server Action mints a Firebase Custom Token.
- **The Bridge:** For Email/WebAuthn, the client receives the Custom Token, logs into Firebase, generates an **ID Token**, and sends it back to the server.
- **Session:** The server verifies the ID Token and sets a secure, `httpOnly` Session Cookie.

### B. The Rendering & Security Rules (Next.js 16)
- **`proxy.ts`**: The middleware. Protects `/dashboard` and `/admin`. Verifies the session cookie and checks if `user.role === 'admin'` before allowing access.
- **Session Revocation Check**: `verifySessionCookie(cookie, true)` is used to ensure banned users are kicked out immediately.
- **Next.js 16 Cache Components**: We **cannot** use `export const dynamic = 'force-dynamic'`. Instead, `await connection()` is used at the top of the `DashboardLayout` to force dynamic rendering without breaking the cache compiler.

### C. The Trading Engine
- **`placeOrderAction`**: Validates input with Zod. Fetches the user's ledger accounts. Checks for sufficient balance. Uses atomic `$inc` updates to deduct USD and add BTC (or vice versa), then writes an immutable `LedgerTransaction`.
- **Display Currency**: Base accounting unit is USD cents. The `displayCurrency` field in the user model is a view-layer preference (e.g., showing DOGE or CAD equivalents).

---

## 5. Features Built So Far

### User Facing (`/dashboard`)
- **Overview**: Gamified tier progress, balance display.
- **Markets**: Terminal shell with mock TradingView chart, order book, and a functional order ticket connected to the Ledger.
- **Wallet**: Displays actual balances from the `ledgeraccounts` collection.
- **Rewards**: Task list (`lib/gamification.ts`). Claiming tasks adds XP/Coins and upgrades KYC tiers.
- **Settings**: Change display currency, enable WebAuthn/Biometrics.
- **KYC**: Submission form for Tier upgrades.

### Admin Facing (`/admin`)
- **Command Center**: "While you were away" stats, recent ledger activity feed.
- **KYC Queue**: Review pending ID submissions and approve/reject them.
- **User Management**: Table to view all users, suspend accounts, or promote to Admin.

---

## 6. Key Fixes & Lessons Learned (The Gotchas)

1.  **Next.js 16 Async Cookies**: `cookies()` is now a Promise. Must use `await cookies()`.
2.  **WebAuthn v14 API**: Breaking changes in v14. `userID` must be a `Uint8Array`. `registrationInfo` wraps the data in a `credential` object. Authentication response expects `credential.id` and `credential.publicKey`.
3.  **Firebase Custom Tokens**: You cannot pass a Custom Token directly into `createSessionCookie()`. You must send it to the client, exchange it for an ID Token via `signInWithCustomToken`, and send *that* back.
4.  **Prerender Crashes**: `Date.now()` in Firebase Admin crashes Next.js 16's static prerenderer. Fixed by using `await connection()`.

---

## 7. Immediate Next Steps (To-Do)

1.  **The Leaderboard**: Rank users by XP or trading volume on the dashboard.
2.  **The Badges System**: Implement the 1000+ gamified badges from the original HTML prototype. Create `lib/models/Badge.ts` and a UI grid.
3.  **Real File Uploads**: Replace the mock KYC S3 URL with a real Cloudinary/S3 integration using UploadThing.
4.  **Deployment to Vercel**: Provision `quantix-prod` on MongoDB Atlas and Upstash. Add all `.env` keys to Vercel Dashboard. Note: Google Login will automatically switch to `signInWithRedirect` in production.
# Quantix Solaris — Session Notes & Build Log

**Project:** Highly gamified, international-standard trading platform (Commodities, Crypto, Meme Coins, Forex).
**Status:** Core MVP Complete. Auth, Trading, Admin, KYC, and Gamification are fully operational. Production build is now passing.

---

## 1. Project Aim & Vision
To build a production-grade, full-stack trading application that mimics the quality of institutional platforms (like Webull/TradingView) while incorporating deep gamification. The goal is to master Next.js 16 + MongoDB architecture, security, and state management.

**Core Design Philosophies:**
- **Dark-First UI:** Premium, precision typography, high-contrast champagne gold accents.
- **Secure by Design:** Server-side validation, HttpOnly cookies, Zero client-side trust.
- **Double-Entry Accounting:** Financial integrity is paramount. Balances are derived, never mutated.
- **Gamified Progression:** Users unlock higher KYC tiers (and asset classes) by completing tasks and earning XP.

---

## 2. Tech Stack
- **Frontend:** Next.js 16.4.2 (App Router, Turbopack), React 19, Tailwind CSS v4.
- **Backend:** Next.js Server Actions, Firebase Admin SDK.
- **Database:** MongoDB (Mongoose).
- **Auth:** Firebase (Google OAuth) + MongoDB (Email/Password via bcryptjs) + WebAuthn (Biometrics).
- **Cache/Rate Limiting:** Upstash Redis.
- **Validation:** Zod.

---

## 3. Database Schema (MongoDB)
Single database (`quantix-dev` / `quantix-prod`) with the following collections:

1.  **`users`**: Core identity. Tracks `role` (user/admin), `status` (active/suspended), `kycTier` (0-3), `displayCurrency`, `xp`, `coins`, and `completedTasks`.
2.  **`ledgeraccounts`**: The "wallets". Tracks `cachedBalance` (in minor units/cents), `assetId` (USD, BTC, ETH), and `type` (available, escrow).
3.  **`ledgertransactions`**: Append-only immutable history. Contains `entries` (debits/credits). Has a pre-save hook that ensures transactions balance to zero.
4.  **`kycsubmissions`**: Tracks ID uploads, requested tier, and approval/rejection status.
5.  **`authenticators`**: Stores WebAuthn public keys, credential IDs, and counters for biometric login.

---

## 4. Core Architecture & Implementation Details

### A. The Authentication Flow (The Hybrid Model)
- **Email/Password:** Handled by MongoDB (`bcryptjs`). On success, the Server Action mints a Firebase **Custom Token**.
- **Google Login:** Handled by Firebase Client SDK (`signInWithPopup` in dev, `signInWithRedirect` in prod).
- **WebAuthn (Biometrics):** Handled via `@simplewebauthn` and stored in MongoDB. On success, the Server Action mints a Firebase Custom Token.
- **The Bridge:** For Email/WebAuthn, the client receives the Custom Token, logs into Firebase, generates an **ID Token**, and sends it back to the server.
- **Session:** The server verifies the ID Token and sets a secure, `httpOnly` Session Cookie.
- **Revocation Check:** `verifySessionCookie(cookie, true)` is kept active to ensure banned users are immediately kicked out.

### B. Next.js 16 Cache Components (CRITICAL ARCHITECTURE RULE)
Because we are on Next.js 16, the framework aggressively tries to statically prerender pages. This breaks dynamic pages that rely on `cookies()`, sessions, or database calls.
- **The Fix:** Every dynamic `page.tsx` file **MUST** include `export const instant = false;` at the top of the file.
- **Layouts:** Every dynamic `layout.tsx` file **MUST** include `await connection();` at the top of the component function. 
- **Do not use:** `export const dynamic = 'force-dynamic'` (This is deprecated in Next.js 16 Cache Components).

### C. The Trading Engine
- **`placeOrderAction`**: Validates input with Zod. Fetches the user's ledger accounts. Checks for sufficient balance. Uses atomic `$inc` updates to deduct USD and add BTC (or vice versa), then writes an immutable `LedgerTransaction`.
- **Display Currency:** Base accounting unit is USD cents. The `displayCurrency` field in the user model is a view-layer preference (e.g., showing DOGE or CAD equivalents).

---

## 5. Features Built So Far

### User Facing (`/dashboard`)
- **Overview**: Gamified tier progress, balance display.
- **Markets**: Terminal shell with mock TradingView chart, order book, and a functional order ticket connected to the Ledger.
- **Wallet**: Displays actual balances from the `ledgeraccounts` collection.
- **Settings**: Change display currency, enable WebAuthn/Biometrics.
- **KYC**: Submission form for Tier upgrades.
*(Note: The Rewards page was planned but not yet built/added to the routing system).*

### Admin Facing (`/admin`)
- **Command Center**: "While you were away" stats, recent ledger activity feed.
- **KYC Queue**: Review pending ID submissions and approve/reject them.
- **User Management**: Table to view all users, suspend accounts, or promote to Admin.

---

## 6. Key Fixes & Lessons Learned (The Gotchas)

1.  **Next.js 16 Async Cookies**: `cookies()` is a Promise. Must use `await cookies()`.
2.  **WebAuthn v14 API**: Breaking changes. `userID` must be a `Uint8Array`. `registrationInfo` wraps data in `credential`. The authentication response expects `credential.id` and `credential.publicKey`.
3.  **Firebase Custom Tokens**: Cannot pass a Custom Token directly into `createSessionCookie()`. Must send it to client -> `signInWithCustomToken` -> get ID Token -> send back.
4.  **Next.js 16 Prerender Crashes**: `Date.now()` in Firebase Admin crashes the static prerenderer. Fixed by using `export const instant = false;` and `await connection()`.
5.  **Email Missing in Custom Tokens**: When generating a custom token, explicitly pass `{ email: user.email }` as the second argument to `adminAuth.createCustomToken()` so the ID token has the email attached.

---

## 7. Immediate Next Steps (To-Do)

1.  **The Leaderboard**: Rank users by XP or trading volume on the dashboard.
2.  **The Rewards Page**: Build the `/dashboard/rewards` page if not already done.
3.  **The Badges System**: Implement the 1000+ gamified badges from the original HTML prototype. Create `lib/models/Badge.ts` and a UI grid.
4.  **Real File Uploads**: Replace the mock KYC S3 URL with a real Cloudinary/S3 integration using UploadThing.
5.  **Deployment to Vercel**: Provision `quantix-prod` on MongoDB Atlas and Upstash. Add all `.env` keys to Vercel Dashboard.