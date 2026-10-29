// app/dashboard/wallet/WalletClient.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowDownRight, ArrowUpRight, ShieldAlert, CheckCircle2, 
  Clock, Info, Landmark, CreditCard, Bitcoin, ShieldCheck, XCircle
} from "lucide-react";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { Button } from "@/components/ui/Button";

const PAYMENT_METHODS = [
  { id: "card", name: "Card", icon: <CreditCard size={20} />, fee: "0%", time: "Instant" },
  { id: "bank", name: "Bank", icon: <Landmark size={20} />, fee: "0%", time: "1-3 Days" },
  { id: "crypto", name: "Crypto", icon: <Bitcoin size={20} />, fee: "0.5%", time: "5-10 Mins" },
];

export default function WalletClient({ 
  tier, 
  usdBalance, 
  rawBalances, 
  initialTransactions 
}: { 
  tier: number, 
  usdBalance: number, 
  rawBalances: any[], 
  initialTransactions: any[] 
}) {
  const { openModal } = useDevModal();
  
  const [isDeposit, setIsDeposit] = useState(true); 
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("card");

  // Use the real transactions from the database
  const transactions = initialTransactions.length > 0 ? initialTransactions : [
    // Fallback mock data for UI testing if DB is empty
    { id: "TX-9021", type: "Deposit", amount: 500.00, method: "Visa", status: "completed", date: "Oct 24, 2026", up: true },
    { id: "TX-8955", type: "Withdrawal", amount: 1200.00, method: "Bank Transfer", status: "pending", date: "Oct 25, 2026", up: false },
    { id: "TX-8740", type: "Withdrawal", amount: 350.00, method: "Bank Transfer", status: "rejected", rejectionReason: "Name mismatch on bank account", date: "Oct 18, 2026", up: false },
  ];

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      openModal("Invalid Amount", "Please enter a valid amount greater than zero.", "warning");
      return;
    }

    if (!isDeposit && Number(amount) > usdBalance) {
      openModal("Insufficient Funds", "You cannot withdraw more than your available USD balance.", "error");
      return;
    }

    openModal(
      isDeposit ? "Deposit Initiated" : "Withdrawal Requested",
      `Your ${isDeposit ? "deposit" : "withdrawal"} of $${amount} via ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name} is being processed.`,
      "success"
    );
    setAmount("");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-lime-950 dark:text-white tracking-tight">Cash Management</h1>
        <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">Deposit, withdraw, and manage your funds safely.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTION FORM */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 blur-[80px] rounded-full pointer-events-none"></div>

            {/* 👇 THE TOGGLE SWITCH (Matches Login) 👇 */}
            <div className="relative flex p-1 mb-8 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner max-w-sm mx-auto">
              <motion.div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" 
                animate={{ x: isDeposit ? 0 : "100%" }} 
                transition={{ type: "spring", stiffness: 300, damping: 30 }} 
              />
              <button 
                onClick={() => setIsDeposit(true)} 
                className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isDeposit ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}
              >
                Deposit
              </button>
              <button 
                onClick={() => setIsDeposit(false)} 
                className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isDeposit ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}
              >
                Withdraw
              </button>
            </div>

            {/* REAL Balance Display */}
            <div className="text-center mb-8 relative z-10">
              <p className="text-sm font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest mb-1">
                {isDeposit ? "Current USD Balance" : "Available to Withdraw"}
              </p>
              <h2 className="text-4xl font-extrabold font-mono text-lime-950 dark:text-white">
                ${usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h2>
            </div>

            <form onSubmit={handleAction} className="space-y-6 relative z-10 max-w-md mx-auto">
              
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase mb-2">
                  {isDeposit ? "Select Deposit Method" : "Select Destination"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        selectedMethod === method.id 
                          ? "bg-lime-500/10 border-lime-500 text-lime-600 dark:text-lime-400 shadow-sm" 
                          : "bg-white dark:bg-[#121A14] border-lime-500/20 text-lime-800 dark:text-lime-200 hover:border-lime-500/50"
                      }`}
                    >
                      <div className="mb-1">{method.icon}</div>
                      <span className="text-[10px] font-bold text-center leading-tight">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Amount (USD)</label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-lime-600 dark:text-lime-400">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#f4fbf5] dark:bg-[#121A14] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-2xl pl-10 pr-4 py-4 text-2xl font-mono text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {["50", "100", "500", "1000"].map((val) => (
                    <button key={val} type="button" onClick={() => setAmount(val)} className="flex-1 py-1.5 rounded-lg bg-lime-500/10 text-lime-700 dark:text-lime-300 text-xs font-bold hover:bg-lime-500/20 transition-colors">
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee & Details Box */}
              <div className="p-4 rounded-xl bg-lime-500/5 border border-lime-500/10 space-y-2 text-xs font-medium text-lime-800/70 dark:text-lime-200/60">
                <div className="flex justify-between">
                  <span>Processing Fee</span>
                  <span className="text-green-500 font-bold">{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.fee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Time</span>
                  <span className="text-lime-950 dark:text-white font-bold">{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.time}</span>
                </div>
              </div>

              {/* AML Notice */}
              {!isDeposit && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
                  <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                    <strong>AML Policy:</strong> To prevent fraud, withdrawals must be sent to the same source account used for your initial deposit.
                  </p>
                </div>
              )}

              <Button type="submit" className={`w-full h-14 font-bold text-lg rounded-xl shadow-lg transition-all ${isDeposit ? "bg-lime-600 hover:bg-lime-700 shadow-lime-600/20 text-white" : "bg-white dark:bg-[#121A14] text-lime-950 dark:text-white border-2 border-lime-500/30 hover:bg-lime-50 dark:hover:bg-[#1a261d]"}`}>
                {isDeposit ? "Proceed to Deposit" : "Request Withdrawal"}
              </Button>

            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: LIMITS & ASSETS */}
        <div className="space-y-6">
          
          {/* YOUR REAL ASSETS LIST */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl">
            <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-lime-500" /> Your Assets
            </h3>
            <div className="space-y-3">
              {rawBalances.filter((b: any) => b.type === 'available' && b.balance > 0).map((asset: any) => (
                <div key={asset.assetId} className="flex items-center justify-between p-3 rounded-xl bg-lime-500/5 border border-lime-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lime-500/20 text-lime-600 dark:text-lime-400 flex items-center justify-center font-bold text-xs">
                      {asset.assetId.slice(0, 2)}
                    </div>
                    <span className="font-bold text-sm text-lime-950 dark:text-white">{asset.assetId}</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-lime-950 dark:text-white">
                    {asset.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {rawBalances.filter((b: any) => b.type === 'available' && b.balance > 0).length === 0 && (
                <p className="text-xs text-lime-800/60 dark:text-lime-200/50 text-center py-4">No assets found.</p>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-blue-500" /> Recent Transactions
              </h3>
            </div>
            <div className="divide-y divide-lime-500/5">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-lime-500/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      tx.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                      tx.up ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {tx.status === 'rejected' ? <XCircle size={18} /> : 
                       tx.up ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-lime-950 dark:text-white">{tx.type}</p>
                      <p className="text-[10px] text-lime-800/60 dark:text-lime-200/40 font-mono">{tx.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${
                      tx.status === 'rejected' ? 'text-red-500 line-through opacity-50' : 
                      tx.up ? 'text-green-500' : 'text-lime-950 dark:text-white'
                    }`}>
                      {tx.up ? '+' : '-'}${tx.amount.toLocaleString()}
                    </p>
                    <div className="flex flex-col items-end mt-0.5">
                      <p className={`text-[10px] font-bold flex items-center justify-end gap-1 ${
                        tx.status === 'completed' ? 'text-green-500' : 
                        tx.status === 'pending' ? 'text-amber-500' : 
                        'text-red-500'
                      }`}>
                        {tx.status === 'completed' && <CheckCircle2 size={10} />}
                        {tx.status === 'pending' && <Clock size={10} />}
                        {tx.status === 'rejected' && <XCircle size={10} />}
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </p>
                      {tx.status === 'rejected' && tx.rejectionReason && (
                        <p className="text-[9px] text-red-400/80 max-w-[120px] leading-tight mt-0.5">
                          {tx.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}