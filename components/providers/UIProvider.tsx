// components/providers/UIProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import SettingsModal from "@/components/SettingsModal";

interface UIContextType {
  openSettings: (currency?: string, language?: string) => void;
  closeSettings: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English (US)");

  const openSettings = (initialCurrency = "USD", initialLanguage = "English (US)") => {
    setCurrency(initialCurrency);
    setLanguage(initialLanguage);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <UIContext.Provider value={{ openSettings, closeSettings }}>
      {children}
      
      {/* We mount the modal here exactly once */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={closeSettings} 
        initialCurrency={currency}
        initialLanguage={language}
      />
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within UIProvider");
  return context;
};