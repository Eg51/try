// components/providers/KycProvider.tsx
"use client";

import { createContext, useContext, useState } from "react";

type Tier = 0 | 1 | 2 | 3;

interface KycContextType {
  tier: Tier;
  setTier: (tier: Tier) => void;
  isSkipped: boolean;
  skipKyc: () => void;
}

const KycContext = createContext<KycContextType | undefined>(undefined);

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function KycProvider({
  children,
  initialTier = 0,
  initialSkipped = false,
}: {
  children: React.ReactNode;
  initialTier?: Tier;
  initialSkipped?: boolean;
}) {
  const [tier, setTierState] = useState<Tier>(initialTier);
  const [isSkipped, setIsSkipped] = useState<boolean>(initialSkipped);

  const setTier = (newTier: Tier) => {
    setTierState(newTier);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_tier", newTier.toString());
      writeCookie("user_tier", newTier.toString(), 60 * 60 * 24 * 365);
    }
    if (newTier > 0) {
      setIsSkipped(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("kyc_skipped");
      }
      clearCookie("kyc_skipped");
    }
  };

  const skipKyc = () => {
    setIsSkipped(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("kyc_skipped", "true");
      writeCookie("kyc_skipped", "true", 60 * 60 * 24 * 365);
    }
  };

  // No `return null` — render on server with defaults from props
  return (
    <KycContext.Provider value={{ tier, setTier, isSkipped, skipKyc }}>
      {children}
    </KycContext.Provider>
  );
}

export const useKyc = () => {
  const context = useContext(KycContext);
  if (!context) throw new Error("useKyc must be used within KycProvider");
  return context;
};