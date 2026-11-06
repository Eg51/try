// app/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";
import { UIProvider } from "@/components/providers/UIProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DevModalProvider } from "@/components/providers/DevModalProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { TourProvider } from "@/components/providers/TourProvider";
import { ClientThemeColorSync } from "@/components/providers/ClientThemeColorSync";
import { CommandPalette } from "@/components/ui/CommandPalette";
import TourGuide from "@/components/ui/TourGuide";
import SideNavigation from "@/components/ui/SideNavigation"; // 👈 Imported SideNavigation

export const instant = false;

export const metadata: Metadata = {
  title: "Premium Trading",
  description: "Modern trading platform for commodities and crypto.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className="h-full antialiased">
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
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ToastProvider>
              <DevModalProvider>
                {/* 👇 TourProvider FIRST — provides useTour() context */}
                <TourProvider>
                  {/* 👇 UIProvider SECOND — renders SettingsModal which uses useTour() */}
                  <UIProvider>
                    {children}
                    <CommandPalette />
                    <TourGuide />
                    <SideNavigation /> {/* 👈 Added SideNavigation here */}
                    <ClientThemeColorSync />
                  </UIProvider>
                </TourProvider>
              </DevModalProvider>
            </ToastProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}