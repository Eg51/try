// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DevModalProvider } from "@/components/providers/DevModalProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { TourProvider } from "@/components/providers/TourProvider";
import { ClientThemeColorSync } from "@/components/providers/ClientThemeColorSync";
import { CommandPalette } from "@/components/ui/CommandPalette";
import TourGuide from "@/components/ui/TourGuide";

export const metadata: Metadata = {
  title: "Premium Trading",
  description: "Modern trading platform for commodities and crypto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          <ToastProvider>
            <DevModalProvider>
              <TourProvider>
                {children}
                <CommandPalette />
                <TourGuide />
                <ClientThemeColorSync />
              </TourProvider>
            </DevModalProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
// // app/layout.tsx
// import type { Metadata } from "next";
// import { cookies } from "next/headers";
// import "./globals.css";
// import { ThemeProvider } from "@/components/providers/ThemeProvider";
// import { DevModalProvider } from "@/components/providers/DevModalProvider";
// import { ToastProvider } from "@/components/providers/ToastProvider";
// import { TourProvider } from "@/components/providers/TourProvider";
// import { KycProvider } from "@/components/providers/KycProvider";
// import { ClientThemeColorSync } from "@/components/providers/ClientThemeColorSync";
// import { CommandPalette } from "@/components/ui/CommandPalette";
// import TourGuide from "@/components/ui/TourGuide";

// export const metadata: Metadata = {
//   title: "Premium Trading",
//   description: "Modern trading platform for commodities and crypto.",
// };

// type Tier = 0 | 1 | 2 | 3;

// export default async function RootLayout({ children }: { children: React.ReactNode }) {
//   const cookieStore = await cookies();

//   const themeCookie = cookieStore.get("theme")?.value;
//   const defaultTheme =
//     themeCookie === "light" || themeCookie === "dark" || themeCookie === "system"
//       ? themeCookie
//       : "system";

//   const rawTier = Number(cookieStore.get("user_tier")?.value ?? 0);
//   const initialTier: Tier = (rawTier >= 0 && rawTier <= 3 ? rawTier : 0) as Tier;
//   const initialSkipped = cookieStore.get("kyc_skipped")?.value === "true";

//   return (
//     <html lang="en" suppressHydrationWarning className="h-full antialiased">
//       <head>
//         <link rel="preconnect" href="https://fonts.googleapis.com" />
//         <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
//         <link
//           href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&family=Poppins:wght@400;500;600;700;800&display=swap"
//           rel="stylesheet"
//         />
//       </head>
//       <body className="min-h-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white transition-colors duration-300">
//         <ThemeProvider
//           attribute="class"
//           defaultTheme={defaultTheme}
//           enableSystem
//           disableTransitionOnChange
//           storageKey="theme"
//         >
//           <ToastProvider>
//             <DevModalProvider>
//               <TourProvider>
//                 <KycProvider initialTier={initialTier} initialSkipped={initialSkipped}>
//                   {children}
//                   <CommandPalette />
//                   <TourGuide />
//                   <ClientThemeColorSync />
//                 </KycProvider>
//               </TourProvider>
//             </DevModalProvider>
//           </ToastProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }
// // app/layout.tsx
// import type { Metadata } from "next";
// import { cookies } from "next/headers";
// import dynamic from "next/dynamic";
// import "./globals.css";
// import { ThemeProvider } from "@/components/providers/ThemeProvider";
// import { DevModalProvider } from "@/components/providers/DevModalProvider";
// import { ToastProvider } from "@/components/providers/ToastProvider";
// import { TourProvider } from "@/components/providers/TourProvider";
// import { KycProvider } from "@/components/providers/KycProvider";
// import { CommandPalette } from "@/components/ui/CommandPalette";
// import TourGuide from "@/components/ui/TourGuide";

// // Client-only — touches document.head, must not run during prerender
// const ThemeColorSync = dynamic(
//   () => import("@/components/providers/ThemeColorSync").then((m) => m.ThemeColorSync),
//   { ssr: false }
// );

// export const metadata: Metadata = {
//   title: "Premium Trading",
//   description: "Modern trading platform for commodities and crypto.",
// };

// type Tier = 0 | 1 | 2 | 3;

// export default async function RootLayout({ children }: { children: React.ReactNode }) {
//   // Read persisted state on the server so prerendering is deterministic
//   const cookieStore = await cookies();

//   const themeCookie = cookieStore.get("theme")?.value;
//   const defaultTheme =
//     themeCookie === "light" || themeCookie === "dark" || themeCookie === "system"
//       ? themeCookie
//       : "system";

//   const rawTier = Number(cookieStore.get("user_tier")?.value ?? 0);
//   const initialTier: Tier = (rawTier >= 0 && rawTier <= 3 ? rawTier : 0) as Tier;
//   const initialSkipped = cookieStore.get("kyc_skipped")?.value === "true";

//   return (
//     <html lang="en" suppressHydrationWarning className="h-full antialiased">
//       <head>
//         <link rel="preconnect" href="https://fonts.googleapis.com" />
//         <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
//         <link
//           href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&family=Poppins:wght@400;500;600;700;800&display=swap"
//           rel="stylesheet"
//         />
//       </head>
//       <body className="min-h-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white transition-colors duration-300">
//         <ThemeProvider
//           attribute="class"
//           defaultTheme={defaultTheme}
//           enableSystem
//           disableTransitionOnChange
//           storageKey="theme"
//         >
//           <ToastProvider>
//             <DevModalProvider>
//               <TourProvider>
//                 <KycProvider initialTier={initialTier} initialSkipped={initialSkipped}>
//                   {children}
//                   <CommandPalette />
//                   <TourGuide />
//                   <ThemeColorSync />
//                 </KycProvider>
//               </TourProvider>
//             </DevModalProvider>
//           </ToastProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }