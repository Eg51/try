// app/dashboard/page.tsx
import { getServerSession } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight, TrendingUp, ShieldCheck } from "lucide-react";
import { connection } from 'next/server';
import Link from "next/link";
export const instant = false;
export default async function DashboardPage() {
  // CRITICAL FOR NEXT.JS 16: Opt out of static prerendering
  await connection();
  
  const session = await getServerSession();
  if (!session) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* 1. Welcome & Tier Hero */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Balance Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 p-8 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-lime-400/20 blur-3xl rounded-full"></div>
          
          <div className="relative z-10">
            <p className="text-lime-800/70 dark:text-lime-200/50 text-sm font-medium mb-2">Total Portfolio Value</p>
            <div className="flex items-baseline gap-2 mb-6">
              <h1 className="text-5xl font-extrabold tracking-tight font-mono text-lime-950 dark:text-[#ecfdf5]">
                ₦ 4,250,000.00
              </h1>
              <span className="text-green-600 dark:text-green-500 text-sm font-medium flex items-center bg-green-500/10 px-2 py-1 rounded-md">
                <ArrowUpRight size={16} className="mr-1" /> +12.5%
              </span>
            </div>
            
            <div className="flex gap-3">
              <Link href="/dashboard/wallet">
                <Button variant="primary" className="bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-600/20">
                  Deposit Funds
                </Button>
              </Link>
              <Link href="/dashboard/wallet">
                <Button variant="secondary" className="border-lime-500/30 dark:border-lime-500/20 bg-white/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-bold rounded-xl">
                  Withdraw
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Gamified Tier Card */}
        <div className="rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 p-6 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(132,204,22,0.15)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lime-950 dark:text-[#ecfdf5]">Your Tier</h3>
              <ShieldCheck className="text-lime-600 dark:text-lime-400" size={24} />
            </div>
            <div className="text-4xl font-extrabold text-lime-600 dark:text-lime-400 font-mono mb-1">
              Tier {session.tier}
            </div>
            <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6 font-medium">
              Unlock Crypto & Meme Coins
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-full bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-3 shadow-inner">
              <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
            </div>
            <p className="text-xs text-lime-800/60 dark:text-lime-200/50 text-center font-bold">
              Complete 3 more tasks to reach Tier {session.tier + 1}
            </p>
            <Link href="/dashboard/rewards">
              <Button variant="ghost" className="w-full text-lime-600 dark:text-lime-400 hover:bg-lime-100 dark:hover:bg-[#121A14] font-bold rounded-xl">
                View Tasks
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Quick Markets (Mocked) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-lime-950 dark:text-[#ecfdf5]">Market Watch</h2>
          <Link href="/markets">
            <Button variant="ghost" className="text-sm text-lime-600 dark:text-lime-400 font-bold hover:bg-lime-100 dark:hover:bg-[#121A14]">
              View All
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true },
            { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false },
            { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true },
          ].map((market) => (
            <Link 
              key={market.symbol} 
              href={`/markets/${market.symbol.split('/')[0].toLowerCase()}`}
              className="block p-4 rounded-2xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 dark:border-lime-500/10 hover:border-lime-500/50 transition-colors cursor-pointer group shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lime-950 dark:text-[#ecfdf5] group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                    {market.name}
                  </h4>
                  <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-mono mt-0.5">{market.symbol}</p>
                </div>
                <TrendingUp className={market.up ? "text-green-500" : "text-red-500"} size={18} />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xl font-mono text-lime-950 dark:text-white font-bold">{market.price}</span>
                <span className={`text-sm font-bold ${market.up ? "text-green-500" : "text-red-500"}`}>
                  {market.change}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}