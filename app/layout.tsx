// app/layout.tsx
import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DevModalProvider } from "@/components/providers/DevModalProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CommandPalette } from "@/components/ui/CommandPalette";

const poppins = Poppins({ 
  weight: ["400", "500", "600", "700", "800"], 
  variable: "--font-poppins", 
  subsets: ["latin"] 
});

const jetbrainsMono = JetBrains_Mono({ 
  variable: "--font-jetbrains-mono", 
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  title: "Quantix Solaris | Premium Trading",
  description: "Modern trading platform for commodities and crypto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}> 
      <body className="min-h-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ToastProvider>
            <DevModalProvider>
              {children}
              <CommandPalette />
            </DevModalProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}