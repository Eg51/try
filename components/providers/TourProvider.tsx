// components/providers/TourProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type TourStep = {
  id: string;
  title: string;
  text: string;
};

type TourContextType = {
  steps: TourStep[];
  setSteps: (steps: TourStep[]) => void;
  isTourOpen: boolean;
  startTour: () => void;
  closeTour: () => void;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const startTour = () => {
    if (steps.length > 0) setIsTourOpen(true);
  };

  const closeTour = () => setIsTourOpen(false);

  return (
    <TourContext.Provider value={{ steps, setSteps, isTourOpen, startTour, closeTour }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) throw new Error("useTour must be used within TourProvider");
  return context;
};