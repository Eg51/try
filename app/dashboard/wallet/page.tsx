// app/dashboard/wallet/page.tsx
import { getUserBalances } from "@/app/actions/wallet";
import { Button } from "@/components/ui/Button";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
export const instant = false;
export default async function WalletPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { success, balances } = await getUserBalances();

  // Calculate total portfolio value in USD (for display)
  const totalUsd = balances.find((b) => b.assetId === "USD")?.balance || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Wallet</h1>
          <p className="text-text-secondary mt-1">Manage your assets and view transaction history.</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-brand-500 text-black hover:bg-brand-400">
            <ArrowDownLeft size={16} className="mr-2" /> Deposit
          </Button>
          <Button variant="secondary" className="border-surface-700 bg-surface-800 hover:bg-surface-700">
            <ArrowUpRight size={16} className="mr-2" /> Withdraw
          </Button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-surface-800 to-surface-900 border border-surface-700 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/5 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-text-secondary mb-1">Total Estimated Balance</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-4xl font-bold font-mono tracking-tight">
              ${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h2>
            <span className="text-sm font-medium text-text-muted">USD</span>
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <WalletIcon size={18} className="text-brand-500" /> Your Assets
        </h3>
        
        <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
          {!success || balances.filter(b => b.type === 'available').length === 0 ? (
            <div className="p-8 text-center text-text-muted">No assets found. Deposit funds to get started.</div>
          ) : (
            <div className="divide-y divide-surface-700">
              {balances.filter(b => b.type === 'available').map((asset) => (
                <div key={asset.assetId} className="flex items-center justify-between p-4 hover:bg-surface-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-900 border border-surface-700 flex items-center justify-center font-bold text-sm">
                      {asset.assetId.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{asset.assetId}</p>
                      <p className="text-xs text-text-muted">Available Balance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-lg">
                      {asset.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-text-muted">≈ ${asset.assetId === 'USD' ? asset.balance.toFixed(2) : '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}