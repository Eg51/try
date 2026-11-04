// components/dashboard/AnimatedSearch.tsx
"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

const SEARCH_ITEMS = [
  "Bitcoin",
  "Settings",
  "Ethereum",
  "Wallet",
  "Rewards",
  "Solana",
  "Deposit",
  "History",
];

export default function AnimatedSearch() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SEARCH_ITEMS.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative group w-full">
      <Search 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 group-focus-within:text-lime-500 transition-colors" 
        size={16} 
      />
      <input 
        type="text" 
        placeholder={`Search ${SEARCH_ITEMS[index]}...`} 
        className="w-full bg-transparent border border-lime-500/20 rounded-full pl-10 pr-4 py-1.5 sm:py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-all"
      />
    </div>
  );
}