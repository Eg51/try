// app/dashboard/markets/page.tsx
import { ChevronDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderForm } from "./OrderForm";
export const instant = false;

export default function MarketsPage() {
  const currentPair = { base: "BTC", quote: "USD", price: "64,230.00", change: "+2.4%" };
  
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      
      {/* Top Bar: Pair Selector */}
      <div className="flex items-center justify-between bg-surface-800 border border-surface-700 rounded-xl p-3 shrink-0">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 hover:bg-surface-700 px-3 py-2 rounded-lg transition-colors">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white z-10 border border-surface-800">₿</div>
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold text-white border border-surface-800">$</div>
            </div>
            <span className="font-bold text-lg ml-1">{currentPair.base}/{currentPair.quote}</span>
            <ChevronDown size={16} className="text-text-muted" />
          </button>
          
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-text-primary">${currentPair.price}</span>
            <span className="text-sm font-medium text-success bg-success/10 px-2 py-1 rounded-md flex items-center">
              <TrendingUp size={14} className="mr-1" /> {currentPair.change}
            </span>
          </div>
        </div>
        
        <div className="hidden md:flex gap-2">
          <Button variant="ghost" className="text-text-secondary hover:text-text-primary">Limit</Button>
          <Button variant="ghost" className="text-text-secondary hover:text-text-primary">Market</Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        
        {/* Chart Area (Takes up 3/4 space on desktop) */}
        <div className="lg:col-span-3 bg-surface-800 border border-surface-700 rounded-xl flex flex-col overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 flex gap-2 text-xs font-mono">
             <span className="text-text-muted">O <span className="text-success">64,100</span></span>
             <span className="text-text-muted">H <span className="text-success">64,500</span></span>
             <span className="text-text-muted">L <span className="text-danger">63,800</span></span>
             <span className="text-text-muted">C <span className="text-success">64,230</span></span>
          </div>
          
          {/* Mock Chart Background Grid */}
          <div className="flex-1 w-full h-full bg-[linear-gradient(to_right,#181c25_1px,transparent_1px),linear-gradient(to_bottom,#181c25_1px,transparent_1px)] bg-[size:4rem_4rem] flex items-center justify-center">
             <p className="text-text-muted text-sm font-mono bg-surface-900/80 p-2 rounded backdrop-blur-sm">
                Charting Engine Placeholder (TradingView Lightweight Charts)
             </p>
          </div>
        </div>

        {/* Right Column: Order Ticket & Book */}
        <div className="flex flex-col gap-4 min-h-0">
          
          {/* The interactive Order Form */}
          <OrderForm />

          {/* Order Book Shell */}
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 flex-1 flex flex-col min-h-[200px]">
             <div className="flex justify-between text-xs text-text-muted mb-2 px-1">
               <span>Price (USD)</span>
               <span>Amount (BTC)</span>
             </div>
             
             {/* Mock Asks */}
             <div className="flex-1 flex flex-col justify-end space-y-1 mb-2">
               {[64250, 64240, 64235, 64232].map((p, i) => (
                 <div key={i} className="flex justify-between text-xs font-mono text-danger px-1 relative cursor-pointer hover:bg-surface-700">
                   <div className="absolute inset-y-0 right-0 bg-danger/10" style={{ width: `${20 + i * 15}%` }}></div>
                   <span className="relative z-10">{p.toFixed(2)}</span>
                   <span className="relative z-10">{(0.5 - i * 0.08).toFixed(4)}</span>
                 </div>
               ))}
             </div>

             {/* Spread */}
             <div className="flex justify-between items-center py-1 border-y border-surface-700 text-sm font-bold font-mono text-success px-1">
               <span>64230.00</span>
               <span className="text-[10px] text-text-muted font-sans font-normal uppercase tracking-wider">Spread</span>
             </div>

             {/* Mock Bids */}
             <div className="flex-1 space-y-1 mt-2">
               {[64225, 64220, 64215, 64210].map((p, i) => (
                 <div key={i} className="flex justify-between text-xs font-mono text-success px-1 relative cursor-pointer hover:bg-surface-700">
                   <div className="absolute inset-y-0 right-0 bg-success/10" style={{ width: `${65 - i * 10}%` }}></div>
                   <span className="relative z-10">{p.toFixed(2)}</span>
                   <span className="relative z-10">{(1.2 + i * 0.15).toFixed(4)}</span>
                 </div>
               ))}
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}