// app/dashboard/markets/OrderForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { placeOrderAction } from "@/app/actions/trade";

export function OrderForm() {
  const router = useRouter();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("64230.00");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const numericPrice = parseFloat(price.replace(/,/g, ""));
    const numericAmount = parseFloat(amount);

    if (isNaN(numericPrice) || isNaN(numericAmount)) {
      setError("Please enter valid numbers.");
      setIsLoading(false);
      return;
    }

    const result = await placeOrderAction({
      pair: "BTC-USD",
      side,
      price: numericPrice,
      amount: numericAmount,
    });

    if (result.error) {
      setError(result.error);
    } else {
      // Success! Clear the form and refresh the page to update balances
      setAmount("");
      router.refresh();
      alert(result.message); // In production, use your ErrorModal/SuccessModal
    }
    setIsLoading(false);
  }

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 flex-1 flex flex-col">
      {/* Buy / Sell Toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-surface-900 rounded-lg mb-4">
        <button 
          onClick={() => setSide("buy")}
          className={`py-2 rounded-md font-semibold text-sm transition-colors ${side === "buy" ? "bg-success/10 text-success shadow-sm" : "text-text-muted hover:text-text-primary"}`}
        >
          Buy
        </button>
        <button 
          onClick={() => setSide("sell")}
          className={`py-2 rounded-md font-semibold text-sm transition-colors ${side === "sell" ? "bg-danger/10 text-danger shadow-sm" : "text-text-muted hover:text-text-primary"}`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
        {error && <div className="p-2 text-xs text-danger bg-danger/10 rounded border border-danger/20">{error}</div>}

        <div>
          <label className="text-xs text-text-muted mb-1 block">Price (USD)</label>
          <div className="relative">
            <input 
              type="text" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-surface-900 border border-surface-700 rounded-lg py-2.5 px-3 text-right font-mono text-sm focus:outline-none focus:border-brand-500 transition-colors" 
            />
            <span className="absolute left-3 top-2.5 text-xs text-text-muted font-semibold">USD</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted mb-1 block">Amount</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-surface-900 border border-surface-700 rounded-lg py-2.5 px-3 text-right font-mono text-sm focus:outline-none focus:border-brand-500 transition-colors" 
            />
            <span className="absolute left-3 top-2.5 text-xs text-text-muted font-semibold">BTC</span>
          </div>
        </div>

        <div className="pt-2 space-y-1">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Total</span>
            <span className="font-mono text-text-secondary">
              {amount && price ? (parseFloat(amount) * parseFloat(price.replace(/,/g, ""))).toFixed(2) : "0.00"} USD
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <Button 
            type="submit" 
            disabled={isLoading || !amount}
            className={`w-full font-bold ${side === "buy" ? "bg-success hover:bg-success/90 text-black" : "bg-danger hover:bg-danger/90 text-white"}`}
          >
            {isLoading ? "Processing..." : `${side === "buy" ? "Buy" : "Sell"} BTC`}
          </Button>
        </div>
      </form>
    </div>
  );
}