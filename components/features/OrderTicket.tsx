// components/features/OrderTicket.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { placeOrderAction } from "@/app/actions/trade";

interface OrderTicketProps {
  pairId: string;
  baseAsset: string;
  quoteAsset: string;
  currentPrice: number; // Display only. Server will re-fetch real price.
}

export function OrderTicket({ pairId, baseAsset, quoteAsset, currentPrice }: OrderTicketProps) {
  const [quantity, setQuantity] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    // SECURITY: We only send the raw inputs. The server calculates the total, fees, and checks balance.
    const result = await placeOrderAction({
      pairId,
      side: "buy",
      type: "market",
      quantity: Number(quantity),
    });

    if (result.error) {
      setError(result.error);
    } else {
      setQuantity("");
      // Trigger success modal/toast
    }
    setIsPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 border rounded-md border-[var(--border)] bg-[var(--surface)]">
      <h3 className="text-sm font-semibold text-[var(--text-1)]">Buy {baseAsset}</h3>
      
      <div>
        <label className="text-xs text-[var(--text-2)]">Quantity</label>
        <Input 
          type="number" 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)} 
          placeholder="0.00"
          min="0"
          step="any"
          required
        />
      </div>

      <div className="text-xs text-[var(--text-3)]">
        Estimated Price: ~{currentPrice} {quoteAsset}
      </div>

      {error && <div className="text-xs text-red-500">{error}</div>}

      <Button type="submit" disabled={isPending || !quantity}>
        {isPending ? "Processing..." : `Buy ${baseAsset}`}
      </Button>
    </form>
  );
}