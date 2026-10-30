// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DevModalProvider } from "@/components/providers/DevModalProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { TourProvider } from "@/components/providers/TourProvider"; 
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ToastProvider>
            <DevModalProvider>
              <TourProvider>
                {children}
                <CommandPalette />
                <TourGuide />
              </TourProvider>
            </DevModalProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}