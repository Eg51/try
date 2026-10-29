"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Tier = 0 | 1 | 2 | 3;

interface KycContextType {
  tier: Tier;
  setTier: (tier: Tier) => void;
  isSkipped: boolean;
  skipKyc: () => void;
}

const KycContext = createContext<KycContextType | undefined>(undefined);

export function KycProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTierState] = useState<Tier>(0);
  const [isSkipped, setIsSkipped] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTier = localStorage.getItem("user_tier");
    const savedSkip = localStorage.getItem("kyc_skipped");
    
    if (savedTier) setTierState(parseInt(savedTier) as Tier);
    if (savedSkip === "true") setIsSkipped(true);
  }, []);

  const setTier = (newTier: Tier) => {
    setTierState(newTier);
    localStorage.setItem("user_tier", newTier.toString());
    if (newTier > 0) {
      setIsSkipped(false);
      localStorage.removeItem("kyc_skipped");
    }
  };

  const skipKyc = () => {
    setIsSkipped(true);
    localStorage.setItem("kyc_skipped", "true");
  };

  if (!mounted) return null;

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