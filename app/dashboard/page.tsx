// app/dashboard/page.tsx
import { getServerSession } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight, TrendingUp, ShieldCheck } from "lucide-react";
import { connection } from 'next/server';

export const instant = false;
export default async function DashboardPage() {
  await connection(); // <--- ADD THIS EXACT LINE HERE
  
  const session = await getServerSession();
  if (!session) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* 1. Welcome & Tier Hero */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-surface-800 border border-surface-700 p-8 shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-500/10 blur-3xl rounded-full"></div>
          
          <div className="relative z-10">
            <p className="text-text-secondary text-sm font-medium mb-2">Total Portfolio Value</p>
            <div className="flex items-baseline gap-2 mb-6">
              <h1 className="text-5xl font-bold tracking-tight font-mono">₦ 4,250,000.00</h1>
              <span className="text-success text-sm font-medium flex items-center bg-success/10 px-2 py-1 rounded-md">
                <ArrowUpRight size={16} className="mr-1" /> +12.5%
              </span>
            </div>
            
            <div className="flex gap-3">
              <Button variant="primary" className="bg-brand-500 text-black hover:bg-brand-400">Deposit Funds</Button>
              <Button variant="secondary" className="border-surface-700 bg-surface-900 hover:bg-surface-700">Withdraw</Button>
            </div>
          </div>
        </div>

        {/* Gamified Tier Card */}
        <div className="rounded-2xl bg-gradient-to-b from-surface-800 to-surface-900 border border-surface-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Your Tier</h3>
              <ShieldCheck className="text-brand-500" size={24} />
            </div>
            <div className="text-4xl font-bold text-brand-500 font-mono mb-1">Tier {session.tier}</div>
            <p className="text-sm text-text-muted mb-4">Unlock Crypto & Meme Coins</p>
          </div>
          
          <div className="space-y-3">
            <div className="w-full bg-surface-900 rounded-full h-2 overflow-hidden border border-surface-700">
              <div className="bg-brand-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(232,181,75,0.5)]"></div>
            </div>
            <p className="text-xs text-text-muted text-center">Complete 3 more tasks to reach Tier {session.tier + 1}</p>
            <Button variant="ghost" className="w-full text-brand-500 hover:text-brand-400 hover:bg-brand-500/10">View Tasks</Button>
          </div>
        </div>
      </section>

      {/* 2. Quick Markets (Mocked) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Market Watch</h2>
          <Button variant="ghost" className="text-sm text-brand-500">View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true },
            { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false },
            { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true },
          ].map((market) => (
            <div key={market.symbol} className="p-4 rounded-xl bg-surface-800 border border-surface-700 hover:border-brand-500/50 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-text-primary">{market.name}</h4>
                  <p className="text-xs text-text-muted font-mono">{market.symbol}</p>
                </div>
                <TrendingUp className={market.up ? "text-success" : "text-danger"} size={18} />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xl font-mono">{market.price}</span>
                <span className={`text-sm font-medium ${market.up ? "text-success" : "text-danger"}`}>{market.change}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}