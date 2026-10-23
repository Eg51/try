# Quantix Solaris — Auth Design System

**Theme:** "Light Glassy Lime" (Light) & "Premium Dark Forest" (Dark)
**Framework:** Next.js 16 + Tailwind CSS v4
**Animations:** Framer Motion
**Typography:** Poppins (Primary), JetBrains Mono (Numbers)

---

## 1. Color Palette

The design system relies on a dual-theme approach using Tailwind CSS v4. The dark mode is not pure black; it uses a deep, atmospheric forest charcoal to reduce eye strain and make the lime accents glow.

### ☀️ Light Mode ("Light Glassy Lime")
| Token | Hex Code | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#f0fdf4` | `bg-[#f0fdf4]` | Main page background (Mint White) |
| **Glass Card** | `#f4fbf5` (90% opacity) | `bg-[#f4fbf5]/90` | Form container |
| **Primary Accent** | `#65a30d` | `bg-lime-600` | Submit buttons, active states |
| **Text Primary** | `#052e16` | `text-lime-950` | Headings, user input |
| **Text Secondary** | `#4d7c0f` | `text-lime-700` | Subtitles, placeholders |
| **Border/Outline** | `#a3e635` (30% opacity) | `border-lime-500/30` | Input borders, dividers |

### 🌙 Dark Mode ("Premium Dark Forest")
| Token | Hex Code | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#050806` | `dark:bg-[#050806]` | Main page background (Deep Forest) |
| **Glass Card** | `#0a0f0b` (90% opacity) | `dark:bg-[#0a0f0b]/90` | Form container |
| **Primary Accent** | `#65a30d` | `dark:bg-lime-600` | Submit buttons (glows against dark) |
| **Text Primary** | `#ecfdf5` | `dark:text-[#ecfdf5]` | Headings, user input |
| **Text Secondary** | `#a3e635` (60% opacity)| `dark:text-lime-300/60` | Subtitles, placeholders |
| **Border/Outline** | `#84cc16` (20% opacity) | `dark:border-lime-500/20` | Input borders, dividers |

> **Tailwind v4 Configuration Rule:** Ensure `@custom-variant dark (&:where(.dark, .dark *));` is present in your `globals.css` for dark mode to trigger correctly based on the `.dark` class.

---

## 2. Typography

*   **Primary Font:** `Poppins` (Weights: 400, 500, 600, 700, 800). Applied globally via `font-sans`.
*   **Monospace Font:** `JetBrains Mono` (Used for numbers/tables, though not prominent on the auth screen, it's ready for the dashboard).
*   **Headings:** `text-2xl font-extrabold tracking-tight` (e.g., "Welcome Back").
*   **Body/Subtitles:** `text-sm font-medium`.

---

## 3. Core Components

### A. The Glassmorphism Card
The central container for the auth forms. It uses a heavy backdrop blur to create a frosted glass effect, layered over the animated background.

*   **Classes:** `bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]`
*   **Animation:** Uses Framer Motion `layout` to smoothly animate its height when switching between Login and Signup forms.

### B. Floating Label Inputs
Designed to prevent placeholder overlap and look highly premium. The label sits inside the input and "floats" up to the top border on focus or when filled.

*   **The Trick:** The `<input>` and the floating `<label>` share the *exact same background color* as the card (`bg-[#f4fbf5] dark:bg-[#0a0f0b]`). When the label moves up, it masks the border line, creating a perfect cutout effect.
*   **Input Classes:** `peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 focus:outline-none focus:border-lime-500 transition-colors`
*   **Label Classes:** `absolute left-3 top-4 transition-all duration-200 peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1`

### C. Buttons
*   **Primary (Log In / Sign Up):** Solid Lime. `w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-600/20`.
*   **Secondary (Google / Passkey):** Glass outline. `border border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white rounded-xl h-11 shadow-sm`.
*   **Ghost (Try Demo):** Transparent with hover effect. `text-lime-700 dark:text-lime-400 font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl`.

### D. The Toggle Switch (Log In / Sign Up)
A pill-shaped toggle with a sliding background.
*   **Track:** `bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20`
*   **Slider (Framer Motion):** `absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md`
*   **Animation:** `animate={{ x: isLogin ? 0 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}`

---

## 4. Background Effects

### A. Deterministic Watermarks
To provide a "trading" vibe without cluttering the UI, we use floating currency symbols (`$, €, £, ¥, ₦, ₿, Ξ, Ð`).
*   **Implementation:** Generated via `useMemo` using a mathematical formula (no `Math.random()`) to prevent hydration mismatches between the server and client.
*   **Styling:** `absolute text-5xl md:text-7xl font-bold text-lime-900/[0.04] dark:text-lime-100/[0.02]`. They are rotated and scaled variably.

### B. Aurora Glows
Soft, blurry orbs in the background to give the glass something colorful to refract.
*   **Light Mode:** `bg-lime-300/40` and `bg-green-300/30`.
*   **Dark Mode:** `bg-lime-900/10` and `bg-green-900/10`.
*   **Blur:** `blur-[120px]`.

---

## 5. The Guided Tour (Gamification)

To help new users, a gamified guided tour is implemented using Framer Motion.
*   **Trigger:** Clicking the `HelpCircle` icon in the top right, or via the Welcome Modal.
*   **Spotlight Effect:** Instead of just highlighting an element, we use a full-screen `div` with a massive `box-shadow` and a CSS `clip-path` to "cut a hole" in the dark overlay. This ensures the focused element is 100% crisp and unblurred.
*   **Steps:** 11 distinct steps covering Theme Toggle, Profile, Tabs, Inputs, Submit, Demo, Google, and Passkey.
*   **Tooltip:** Positioned dynamically (above or below the element) using `getBoundingClientRect()`. Includes "Prev", "Next", and "Skip" buttons.
