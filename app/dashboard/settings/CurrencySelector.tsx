// app/dashboard/settings/CurrencySelector.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayCurrency } from "@/app/actions/settings";

const CURRENCIES = [
  { id: "USD", name: "US Dollar ($)" },
  { id: "CAD", name: "Canadian Dollar (C$)" },
  { id: "EUR", name: "Euro (€)" },
  { id: "GBP", name: "British Pound (£)" },
  { id: "BTC", name: "Bitcoin (₿)" },
  { id: "ETH", name: "Ethereum (Ξ)" },
  { id: "DOGE", name: "Dogecoin (Ð)" },
];

export function CurrencySelector({ currentCurrency }: { currentCurrency: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(currentCurrency);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCurrency = e.target.value;
    setSelected(newCurrency);
    setIsLoading(true);

    const result = await updateDisplayCurrency({ assetId: newCurrency });
    
    if (result.success) {
      router.refresh(); // Refresh the layout to show the new symbol
    } else {
      alert(result.error);
      setSelected(currentCurrency); // Revert on failure
    }
    setIsLoading(false);
  }

  return (
    <div className="relative max-w-xs">
      <select
        value={selected}
        onChange={handleChange}
        disabled={isLoading}
        className="w-full bg-surface-900 border border-surface-700 rounded-lg p-3 text-text-primary focus:border-brand-500 outline-none appearance-none cursor-pointer disabled:opacity-50"
      >
        {CURRENCIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {isLoading && (
        <div className="absolute right-10 top-3.5 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
}