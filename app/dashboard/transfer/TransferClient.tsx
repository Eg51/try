// app/dashboard/transfer/TransferClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CreditCard, Landmark, Bitcoin, Lock, Copy, CheckCircle2,
  AlertTriangle, QrCode, Loader2, X, Download, ShieldCheck, ChevronRight
} from "lucide-react";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useTour } from "@/components/providers/TourProvider";

type Mode = "deposit" | "withdraw";
type Method = "card" | "bank" | "crypto";

const formatCurrency = (value: string) => {
  let cleanValue = value.replace(/[^0-9.]/g, '');
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }
  const [integerPart, decimalPart] = cleanValue.split('.');
  if (!integerPart) return decimalPart ? `.${decimalPart}` : '';
  const formattedInteger = parseInt(integerPart, 10).toLocaleString('en-US');
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
  }
  return formattedInteger;
};

export default function TransferClient({ tier = 0 }: { tier?: number }) {
  const [mode, setMode] = useState<Mode>("deposit");
  const [method, setMethod] = useState<Method>("bank");
  
  const [amountStr, setAmountStr] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const { openModal } = useDevModal();
  const { addNotification } = useNotifications();
  const { setSteps } = useTour();

  useEffect(() => {
    setSteps([
      { id: "tour-transfer-header", title: "Account Overview", text: "This shows your current available balance and KYC verification status." },
      { id: "tour-transfer-toggle", title: "Deposit or Withdraw", text: "Use this toggle to switch between depositing funds into your account or withdrawing them." },
      { id: "tour-transfer-method", title: "Payment Method", text: "Select how you want to complete your transaction. Each method has different fees and processing times." },
      { id: "tour-transfer-amount", title: "Transaction Amount", text: "Enter the amount here. You can also use the quick-select buttons for common amounts." },
      { id: "tour-transfer-submit", title: "Confirm & Proceed", text: "Once you've filled in all the details, click here to proceed with your transaction." },
    ]);
  }, [setSteps]);

  const isWithdraw = mode === "withdraw";
  const amount = parseFloat(amountStr) || 0;
  
  const fees = useMemo(() => {
    let fee = 0;
    let time = "Instant";

    if (method === "card") { fee = amount * 0.029; time = "Instant"; }
    else if (method === "bank") { fee = amount * 0.01; time = "1-3 Days"; }
    else if (method === "crypto") { fee = 2.50; time = "10-30 Mins"; }

    return {
      fee,
      time,
      total: isWithdraw ? amount - fee : amount + fee,
    };
  }, [amount, method, isWithdraw]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, ''); 
    setAmountStr(rawValue);
    setDisplayAmount(formatCurrency(rawValue));
  };

  const handleQuickAmount = (val: number) => {
    setAmountStr(val.toString());
    setDisplayAmount(formatCurrency(val.toString()));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      openModal("Invalid Amount", "Please enter a valid amount.", "warning");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      
      const txData = {
        id: `TX-${Math.floor(Math.random() * 1000000)}`,
        date: new Date().toLocaleString(),
        mode,
        method,
        amount,
        fee: fees.fee,
        total: fees.total,
      };
      setReceiptData(txData);

      addNotification({
        type: "wallet",
        title: `${mode === "deposit" ? "Deposit" : "Withdrawal"} Successful`,
        message: `Your ${mode} of $${amount.toFixed(2)} via ${method.toUpperCase()} was processed.`,
        href: "/dashboard/transfer",
        meta: [
          { label: "Amount", value: `$${amount.toFixed(2)}`, tone: mode === "deposit" ? "up" : "down" },
          { label: "Method", value: method.toUpperCase(), tone: "neutral" }
        ]
      });

    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 relative px-2 sm:px-4">
      
      {/* 👇 REMOVED `y` ANIMATION TO PREVENT SCROLL SHIFTING 👇 */}
      <motion.div 
        id="tour-transfer-header"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="w-full bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="text-center md:text-left w-full md:w-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">Transfer Funds</h1>
          <p className="text-xs sm:text-sm font-medium text-lime-800/60 dark:text-lime-200/50 mt-1 max-w-xs mx-auto md:mx-0">
            Manage your deposits and withdrawals securely.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:flex md:items-center md:gap-6 md:w-auto justify-center md:justify-end border-t border-lime-500/10 md:border-t-0 pt-4 md:pt-0">
          <div className="text-center md:text-right">
            <p className="text-[10px] sm:text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider mb-1">Available Balance</p>
            <p className="text-xl sm:text-2xl font-extrabold text-lime-950 dark:text-white font-mono">$0.00</p>
          </div>
          
          <div className="h-10 w-px bg-lime-500/20 hidden md:block"></div>
          
          <div className="text-center md:text-right">
            <p className="text-[10px] sm:text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider mb-1">KYC Status</p>
            <Link href="/dashboard/kyc" className="inline-flex items-center justify-center md:justify-end gap-1 text-xs sm:text-sm font-bold text-lime-600 dark:text-lime-400 hover:underline">
              <ShieldCheck size={14} className="sm:w-4 sm:h-4" /> Tier {tier} <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 👇 REMOVED `y` ANIMATION HERE TOO 👇 */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.1 }} 
        className="w-full bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-10"
      >
        
        <div id="tour-transfer-toggle" className="flex justify-center mb-8 sm:mb-10 w-full">
          <div className="flex w-full p-1.5 bg-lime-100/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full shadow-inner">
            <button
              onClick={() => { setMode("deposit"); setMethod("bank"); }}
              className={`flex-1 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all ${
                mode === "deposit" ? "bg-lime-600 text-white shadow-md" : "text-lime-800/60 dark:text-lime-200/60 hover:text-lime-950 dark:hover:text-white"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => { setMode("withdraw"); setMethod("crypto"); }}
              className={`flex-1 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all ${
                mode === "withdraw" ? "bg-lime-600 text-white shadow-md" : "text-lime-800/60 dark:text-lime-200/60 hover:text-lime-950 dark:hover:text-white"
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
          
          {!isWithdraw && (
            <div id="tour-transfer-method">
              <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-3 text-center">
                Select Deposit Method
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl border transition-all ${
                    method === "card" ? "bg-lime-500/10 border-lime-500 shadow-md" : "bg-white/50 dark:bg-[#121A14]/50 border-lime-500/20 hover:border-lime-500/50"
                  }`}
                >
                  <CreditCard size={24} className={`sm:w-7 sm:h-7 ${method === "card" ? "text-lime-500" : "text-gray-400"}`} />
                  <span className="mt-1 sm:mt-2 text-[10px] sm:text-sm font-bold text-lime-950 dark:text-white">Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("bank")}
                  className={`flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl border transition-all ${
                    method === "bank" ? "bg-lime-500/10 border-lime-500 shadow-md" : "bg-white/50 dark:bg-[#121A14]/50 border-lime-500/20 hover:border-lime-500/50"
                  }`}
                >
                  <Landmark size={24} className={`sm:w-7 sm:h-7 ${method === "bank" ? "text-lime-500" : "text-gray-400"}`} />
                  <span className="mt-1 sm:mt-2 text-[10px] sm:text-sm font-bold text-lime-950 dark:text-white">Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("crypto")}
                  className={`flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl border transition-all ${
                    method === "crypto" ? "bg-lime-500/10 border-lime-500 shadow-md" : "bg-white/50 dark:bg-[#121A14]/50 border-lime-500/20 hover:border-lime-500/50"
                  }`}
                >
                  <Bitcoin size={24} className={`sm:w-7 sm:h-7 ${method === "crypto" ? "text-lime-500" : "text-gray-400"}`} />
                  <span className="mt-1 sm:mt-2 text-[10px] sm:text-sm font-bold text-lime-950 dark:text-white">Crypto</span>
                </button>
              </div>
            </div>
          )}

          {isWithdraw && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <div>
                <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">Meme Coin Withdrawals Only</p>
                <p className="text-[10px] sm:text-xs text-amber-600/80 dark:text-amber-200/60 mt-1">
                  Withdrawals are currently restricted to meme coins. Provide your destination wallet details below.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {method === "card" && !isWithdraw && (
              <motion.div key="card-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-2">Card Details</p>
                <div>
                  <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Cardholder Name</label>
                  <input type="text" placeholder="John Doe" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Card Number (PAN)</label>
                  <div className="relative mt-1">
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl pl-4 pr-24 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <div className="w-8 h-5 sm:w-10 sm:h-6 bg-blue-600 rounded flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">VISA</div>
                      <div className="w-8 h-5 sm:w-10 sm:h-6 bg-red-500 rounded flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">MC</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Expiry Date</label>
                    <input type="text" placeholder="MM/YY" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">CVV</label>
                    <input type="password" placeholder="123" maxLength={4} className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
                  </div>
                </div>
              </motion.div>
            )}

            {method === "bank" && !isWithdraw && (
              <motion.div key="bank-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-2">Bank Details</p>
                <div>
                  <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Bank Name</label>
                  <select className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none cursor-pointer">
                    <option value="">Select Bank...</option>
                    <option>Providus Bank</option>
                    <option>Access Bank</option>
                    <option>GTBank</option>
                    <option>First Bank</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Account Name</label>
                  <input type="text" placeholder="John Doe" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Account Number</label>
                  <input type="text" placeholder="0000000000" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
                </div>
              </motion.div>
            )}

            {method === "crypto" && (
              <motion.div key="crypto-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-2">
                  {isWithdraw ? "Destination Wallet" : "Crypto Deposit"}
                </p>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Asset</label>
                    <select className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none cursor-pointer">
                      <option>USDT</option>
                      <option>BTC</option>
                      <option>ETH</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Network</label>
                    <select className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none cursor-pointer">
                      <option>ERC-20</option>
                      <option>BEP-20</option>
                      <option>Solana</option>
                      <option>Bitcoin</option>
                    </select>
                  </div>
                </div>

                {isWithdraw ? (
                  <div>
                    <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Wallet Address</label>
                    <input type="text" placeholder="Enter your destination address" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-2xl">
                    <QrCode size={48} className="sm:w-16 sm:h-16 text-lime-950 dark:text-white mb-3 sm:mb-4" />
                    <p className="text-[10px] font-bold text-lime-800/50 dark:text-lime-200/40 uppercase mb-3">Your Deposit Address</p>
                    <div className="flex items-center gap-2 sm:gap-3 bg-lime-500/10 px-3 sm:px-4 py-2 sm:py-3 rounded-xl w-full max-w-sm justify-between">
                      <code className="text-xs sm:text-sm font-mono text-lime-950 dark:text-white truncate">0x71C...976F3</code>
                      <button type="button" onClick={() => handleCopy("0x71C...976F3")} className="text-lime-600 dark:text-lime-400 hover:text-lime-700 shrink-0">
                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Memo / Tag (Optional)</label>
                  <input type="text" placeholder="If required by exchange" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div id="tour-transfer-amount" className="pt-2">
            <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-3">
              Amount ({method === "crypto" ? "USD Equivalent" : "USD"})
            </p>
            <div className="relative">
              <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-bold text-lime-800/50 dark:text-lime-200/40">$</span>
              <input 
                type="text" 
                placeholder="0.00" 
                value={displayAmount}
                onChange={handleAmountChange}
                className="w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-2xl pl-10 sm:pl-12 pr-4 py-4 sm:py-5 text-xl sm:text-2xl font-bold text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono shadow-inner" 
              />
            </div>
            
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              {[50, 100, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="flex-1 py-1.5 sm:py-2 bg-lime-500/10 text-lime-700 dark:text-lime-300 font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-lime-500/20 transition-colors"
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/10 rounded-2xl p-4 sm:p-5 space-y-2 sm:space-y-3">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-lime-800/60 dark:text-lime-200/50">
              <span>Processing Fee</span>
              <span className="text-lime-600 dark:text-lime-400">{fees.fee === 0 ? "0%" : `$${fees.fee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-bold text-lime-800/60 dark:text-lime-200/50">
              <span>Estimated Time</span>
              <span>{fees.time}</span>
            </div>
          </div>

          <button id="tour-transfer-submit" type="submit" disabled={isSubmitting} className="w-full py-4 sm:py-5 bg-[#5d9e17] text-white rounded-2xl font-bold text-base sm:text-lg hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : `Proceed to ${isWithdraw ? "Withdraw" : "Deposit"}`}
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {receiptData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
              <div className="bg-lime-500 p-6 text-center text-white relative">
                <button onClick={() => setReceiptData(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={20} /></button>
                <CheckCircle2 size={48} className="mx-auto mb-2 opacity-90" />
                <h3 className="text-xl font-extrabold">Transaction Receipt</h3>
                <p className="text-xs font-medium opacity-80 mt-1">Status: Completed</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="text-center pb-4 border-b border-dashed border-lime-500/20">
                  <p className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Amount</p>
                  <p className="text-3xl font-extrabold text-lime-950 dark:text-white font-mono mt-1">
                    {receiptData.mode === "deposit" ? "+" : "-"}${receiptData.amount.toFixed(2)}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/60"><span>Transaction ID</span> <span className="font-mono text-lime-950 dark:text-white">{receiptData.id}</span></div>
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/60"><span>Method</span> <span className="font-mono text-lime-950 dark:text-white uppercase">{receiptData.method}</span></div>
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/60"><span>Fee</span> <span className="font-mono text-lime-950 dark:text-white">${receiptData.fee.toFixed(2)}</span></div>
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/60"><span>Date</span> <span className="font-mono text-lime-950 dark:text-white">{receiptData.date}</span></div>
                </div>

                <button onClick={() => setReceiptData(null)} className="w-full mt-4 py-3 bg-lime-600 text-white rounded-xl font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20 flex items-center justify-center gap-2">
                  <Download size={18} /> Download PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// // app/dashboard/transfer/TransferClient.tsx
// "use client";

// import { useState, useMemo, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Link from "next/link";
// import {
//   CreditCard, Landmark, Bitcoin, Lock, Copy, CheckCircle2,
//   AlertTriangle, QrCode, Loader2, X, Download, ShieldCheck, ChevronRight
// } from "lucide-react";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useNotifications } from "@/components/providers/NotificationsProvider";
// import { useTour } from "@/components/providers/TourProvider"; // 👈 Imported Tour Hook

// type Mode = "deposit" | "withdraw";
// type Method = "card" | "bank" | "crypto";

// // 👇 Place Value Formatter (Stops cursor jumping)
// const formatCurrency = (value: string) => {
//   let cleanValue = value.replace(/[^0-9.]/g, '');
//   const parts = cleanValue.split('.');
//   if (parts.length > 2) {
//     cleanValue = parts[0] + '.' + parts.slice(1).join('');
//   }
//   const [integerPart, decimalPart] = cleanValue.split('.');
//   if (!integerPart) return decimalPart ? `.${decimalPart}` : '';
//   const formattedInteger = parseInt(integerPart, 10).toLocaleString('en-US');
//   if (decimalPart !== undefined) {
//     return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
//   }
//   return formattedInteger;
// };

// export default function TransferClient({ tier = 0 }: { tier?: number }) {
//   const [mode, setMode] = useState<Mode>("deposit");
//   const [method, setMethod] = useState<Method>("bank");
  
//   const [amountStr, setAmountStr] = useState("");
//   const [displayAmount, setDisplayAmount] = useState("");
  
//   const [copied, setCopied] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [receiptData, setReceiptData] = useState<any>(null);

//   const { openModal } = useDevModal();
//   const { addNotification } = useNotifications();
//   const { setSteps } = useTour(); // 👈 Get setSteps from TourProvider

//   // 👇 1. CONFIGURE TOUR STEPS
//   useEffect(() => {
//     setSteps([
//       { id: "tour-transfer-header", title: "Account Overview", text: "This shows your current available balance and KYC verification status." },
//       { id: "tour-transfer-toggle", title: "Deposit or Withdraw", text: "Use this toggle to switch between depositing funds into your account or withdrawing them." },
//       { id: "tour-transfer-method", title: "Payment Method", text: "Select how you want to complete your transaction. Each method has different fees and processing times." },
//       { id: "tour-transfer-amount", title: "Transaction Amount", text: "Enter the amount here. You can also use the quick-select buttons for common amounts." },
//       { id: "tour-transfer-submit", title: "Confirm & Proceed", text: "Once you've filled in all the details, click here to proceed with your transaction." },
//     ]);
//   }, [setSteps]);

//   const isWithdraw = mode === "withdraw";
//   const amount = parseFloat(amountStr) || 0;
  
//   const fees = useMemo(() => {
//     let fee = 0;
//     let time = "Instant";

//     if (method === "card") { fee = amount * 0.029; time = "Instant"; }
//     else if (method === "bank") { fee = amount * 0.01; time = "1-3 Days"; }
//     else if (method === "crypto") { fee = 2.50; time = "10-30 Mins"; }

//     return {
//       fee,
//       time,
//       total: isWithdraw ? amount - fee : amount + fee,
//     };
//   }, [amount, method, isWithdraw]);

//   const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const rawValue = e.target.value.replace(/,/g, ''); 
//     setAmountStr(rawValue);
//     setDisplayAmount(formatCurrency(rawValue));
//   };

//   const handleQuickAmount = (val: number) => {
//     setAmountStr(val.toString());
//     setDisplayAmount(formatCurrency(val.toString()));
//   };

//   const handleCopy = (text: string) => {
//     navigator.clipboard.writeText(text);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (amount <= 0) {
//       openModal("Invalid Amount", "Please enter a valid amount.", "warning");
//       return;
//     }

//     setIsSubmitting(true);
//     setTimeout(() => {
//       setIsSubmitting(false);
      
//       const txData = {
//         id: `TX-${Math.floor(Math.random() * 1000000)}`,
//         date: new Date().toLocaleString(),
//         mode,
//         method,
//         amount,
//         fee: fees.fee,
//         total: fees.total,
//       };
//       setReceiptData(txData);

//       addNotification({
//         type: "wallet",
//         title: `${mode === "deposit" ? "Deposit" : "Withdrawal"} Successful`,
//         message: `Your ${mode} of $${amount.toFixed(2)} via ${method.toUpperCase()} was processed.`,
//         href: "/dashboard/transfer",
//         meta: [
//           { label: "Amount", value: `$${amount.toFixed(2)}`, tone: mode === "deposit" ? "up" : "down" },
//           { label: "Method", value: method.toUpperCase(), tone: "neutral" }
//         ]
//       });

//     }, 1500);
//   };

//   return (
//     <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 relative px-2 sm:px-4">
      
//       {/* FULL WIDTH GLASS BANNER */}
//       <motion.div 
//         id="tour-transfer-header" // 👈 Added Tour ID
//         initial={{ opacity: 0, y: -20 }} 
//         animate={{ opacity: 1, y: 0 }} 
//         className="w-full bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
//       >
//         <div className="text-center md:text-left w-full md:w-auto">
//           <h1 className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">Transfer Funds</h1>
//           <p className="text-xs sm:text-sm font-medium text-lime-800/60 dark:text-lime-200/50 mt-1 max-w-xs mx-auto md:mx-0">
//             Manage your deposits and withdrawals securely.
//           </p>
//         </div>
        
//         {/* Responsive Stats Section */}
//         <div className="grid grid-cols-2 gap-4 w-full md:flex md:items-center md:gap-6 md:w-auto justify-center md:justify-end border-t border-lime-500/10 md:border-t-0 pt-4 md:pt-0">
//           <div className="text-center md:text-right">
//             <p className="text-[10px] sm:text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider mb-1">Available Balance</p>
//             <p className="text-xl sm:text-2xl font-extrabold text-lime-950 dark:text-white font-mono">$0.00</p>
//           </div>
          
//           <div className="h-10 w-px bg-lime-500/20 hidden md:block"></div>
          
//           <div className="text-center md:text-right">
//             <p className="text-[10px] sm:text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider mb-1">KYC Status</p>
//             <Link href="/dashboard/kyc" className="inline-flex items-center justify-center md:justify-end gap-1 text-xs sm:text-sm font-bold text-lime-600 dark:text-lime-400 hover:underline">
//               <ShieldCheck size={14} className="sm:w-4 sm:h-4" /> Tier {tier} <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
//             </Link>
//           </div>
//         </div>
//       </motion.div>

//       {/* MAIN FORM CONTAINER */}
//       <motion.div 
//         initial={{ opacity: 0, y: 20 }} 
//         animate={{ opacity: 1, y: 0 }} 
//         transition={{ delay: 0.1 }} 
//         className="w-full bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-10"
//       >
        
//         {/* WIDER MODE TOGGLE */}
//         <div id="tour-transfer-toggle" className="flex justify-center mb-8 sm:mb-10 w-full"> {/* 👈 Added Tour ID */}
//           <div className="flex w-full p-1.5 bg-lime-100/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full shadow-inner">
//             <button
//               onClick={() => { setMode("deposit"); setMethod("bank"); }}
//               className={`flex-1 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all ${
//                 mode === "deposit" ? "bg-lime-600 text-white shadow-md" : "text-lime-800/60 dark:text-lime-200/60 hover:text-lime-950 dark:hover:text-white"
//               }`}
//             >
//               Deposit
//             </button>
//             <button
//               onClick={() => { setMode("withdraw"); setMethod("crypto"); }}
//               className={`flex-1 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all ${
//                 mode === "withdraw" ? "bg-lime-600 text-white shadow-md" : "text-lime-800/60 dark:text-lime-200/60 hover:text-lime-950 dark:hover:text-white"
//               }`}
//             >
//               Withdraw
//             </button>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
          
//           {/* SELECT METHOD */}
//           {!isWithdraw && (
//             <div id="tour-transfer-method"> {/* 👈 Added Tour ID */}
//               <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-3 text-center">
//                 Select Deposit Method
//               </p>
//               <div className="grid grid-cols-3 gap-2 sm:gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setMethod("card")}
//                   className={`flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl border transition-all ${
//                     method === "card" ? "bg-lime-500/10 border-lime-500 shadow-md" : "bg-white/50 dark:bg-[#121A14]/50 border-lime-500/20 hover:border-lime-500/50"
//                   }`}
//                 >
//                   <CreditCard size={24} className={`sm:w-7 sm:h-7 ${method === "card" ? "text-lime-500" : "text-gray-400"}`} />
//                   <span className="mt-1 sm:mt-2 text-[10px] sm:text-sm font-bold text-lime-950 dark:text-white">Card</span>
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setMethod("bank")}
//                   className={`flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl border transition-all ${
//                     method === "bank" ? "bg-lime-500/10 border-lime-500 shadow-md" : "bg-white/50 dark:bg-[#121A14]/50 border-lime-500/20 hover:border-lime-500/50"
//                   }`}
//                 >
//                   <Landmark size={24} className={`sm:w-7 sm:h-7 ${method === "bank" ? "text-lime-500" : "text-gray-400"}`} />
//                   <span className="mt-1 sm:mt-2 text-[10px] sm:text-sm font-bold text-lime-950 dark:text-white">Bank</span>
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setMethod("crypto")}
//                   className={`flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl border transition-all ${
//                     method === "crypto" ? "bg-lime-500/10 border-lime-500 shadow-md" : "bg-white/50 dark:bg-[#121A14]/50 border-lime-500/20 hover:border-lime-500/50"
//                   }`}
//                 >
//                   <Bitcoin size={24} className={`sm:w-7 sm:h-7 ${method === "crypto" ? "text-lime-500" : "text-gray-400"}`} />
//                   <span className="mt-1 sm:mt-2 text-[10px] sm:text-sm font-bold text-lime-950 dark:text-white">Crypto</span>
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* WITHDRAW WARNING */}
//           {isWithdraw && (
//             <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4">
//               <AlertTriangle className="text-amber-500 shrink-0" size={20} />
//               <div>
//                 <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">Meme Coin Withdrawals Only</p>
//                 <p className="text-[10px] sm:text-xs text-amber-600/80 dark:text-amber-200/60 mt-1">
//                   Withdrawals are currently restricted to meme coins. Provide your destination wallet details below.
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* DETAILED INPUT FIELDS BASED ON METHOD */}
//           <AnimatePresence mode="wait">
            
//             {method === "card" && !isWithdraw && (
//               <motion.div key="card-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
//                 <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-2">Card Details</p>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Cardholder Name</label>
//                   <input type="text" placeholder="John Doe" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500" />
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Card Number (PAN)</label>
//                   <div className="relative mt-1">
//                     <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl pl-4 pr-24 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                     <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
//                       <div className="w-8 h-5 sm:w-10 sm:h-6 bg-blue-600 rounded flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">VISA</div>
//                       <div className="w-8 h-5 sm:w-10 sm:h-6 bg-red-500 rounded flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">MC</div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-3 sm:gap-4">
//                   <div>
//                     <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Expiry Date</label>
//                     <input type="text" placeholder="MM/YY" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                   </div>
//                   <div>
//                     <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">CVV</label>
//                     <input type="password" placeholder="123" maxLength={4} className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {method === "bank" && !isWithdraw && (
//               <motion.div key="bank-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
//                 <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-2">Bank Details</p>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Bank Name</label>
//                   <select className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none cursor-pointer">
//                     <option value="">Select Bank...</option>
//                     <option>Providus Bank</option>
//                     <option>Access Bank</option>
//                     <option>GTBank</option>
//                     <option>First Bank</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Account Name</label>
//                   <input type="text" placeholder="John Doe" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500" />
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Account Number</label>
//                   <input type="text" placeholder="0000000000" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//               </motion.div>
//             )}

//             {method === "crypto" && (
//               <motion.div key="crypto-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
//                 <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-2">
//                   {isWithdraw ? "Destination Wallet" : "Crypto Deposit"}
//                 </p>
                
//                 <div className="grid grid-cols-2 gap-3 sm:gap-4">
//                   <div>
//                     <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Asset</label>
//                     <select className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none cursor-pointer">
//                       <option>USDT</option>
//                       <option>BTC</option>
//                       <option>ETH</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Network</label>
//                     <select className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none cursor-pointer">
//                       <option>ERC-20</option>
//                       <option>BEP-20</option>
//                       <option>Solana</option>
//                       <option>Bitcoin</option>
//                     </select>
//                   </div>
//                 </div>

//                 {isWithdraw ? (
//                   <div>
//                     <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Wallet Address</label>
//                     <input type="text" placeholder="Enter your destination address" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                   </div>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-2xl">
//                     <QrCode size={48} className="sm:w-16 sm:h-16 text-lime-950 dark:text-white mb-3 sm:mb-4" />
//                     <p className="text-[10px] font-bold text-lime-800/50 dark:text-lime-200/40 uppercase mb-3">Your Deposit Address</p>
//                     <div className="flex items-center gap-2 sm:gap-3 bg-lime-500/10 px-3 sm:px-4 py-2 sm:py-3 rounded-xl w-full max-w-sm justify-between">
//                       <code className="text-xs sm:text-sm font-mono text-lime-950 dark:text-white truncate">0x71C...976F3</code>
//                       <button type="button" onClick={() => handleCopy("0x71C...976F3")} className="text-lime-600 dark:text-lime-400 hover:text-lime-700 shrink-0">
//                         {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Memo / Tag (Optional)</label>
//                   <input type="text" placeholder="If required by exchange" className="w-full mt-1 bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl px-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* AMOUNT INPUT */}
//           <div id="tour-transfer-amount" className="pt-2"> {/* 👈 Added Tour ID */}
//             <p className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-widest mb-3">
//               Amount ({method === "crypto" ? "USD Equivalent" : "USD"})
//             </p>
//             <div className="relative">
//               <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-bold text-lime-800/50 dark:text-lime-200/40">$</span>
//               <input 
//                 type="text" 
//                 placeholder="0.00" 
//                 value={displayAmount}
//                 onChange={handleAmountChange}
//                 className="w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-2xl pl-10 sm:pl-12 pr-4 py-4 sm:py-5 text-xl sm:text-2xl font-bold text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono shadow-inner" 
//               />
//             </div>
            
//             <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
//               {[50, 100, 500, 1000].map((val) => (
//                 <button
//                   key={val}
//                   type="button"
//                   onClick={() => handleQuickAmount(val)}
//                   className="flex-1 py-1.5 sm:py-2 bg-lime-500/10 text-lime-700 dark:text-lime-300 font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-lime-500/20 transition-colors"
//                 >
//                   ${val}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* FEE & TIME SUMMARY */}
//           <div className="bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/10 rounded-2xl p-4 sm:p-5 space-y-2 sm:space-y-3">
//             <div className="flex justify-between text-xs sm:text-sm font-bold text-lime-800/60 dark:text-lime-200/50">
//               <span>Processing Fee</span>
//               <span className="text-lime-600 dark:text-lime-400">{fees.fee === 0 ? "0%" : `$${fees.fee.toFixed(2)}`}</span>
//             </div>
//             <div className="flex justify-between text-xs sm:text-sm font-bold text-lime-800/60 dark:text-lime-200/50">
//               <span>Estimated Time</span>
//               <span>{fees.time}</span>
//             </div>
//           </div>

//           {/* SUBMIT BUTTON */}
//           <button id="tour-transfer-submit" type="submit" disabled={isSubmitting} className="w-full py-4 sm:py-5 bg-[#5d9e17] text-white rounded-2xl font-bold text-base sm:text-lg hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
//             {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : `Proceed to ${isWithdraw ? "Withdraw" : "Deposit"}`}
//           </button>
//         </form>
//       </motion.div>

//       {/* RECEIPT MODAL OVERLAY */}
//       <AnimatePresence>
//         {receiptData && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
//             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
//               <div className="bg-lime-500 p-6 text-center text-white relative">
//                 <button onClick={() => setReceiptData(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={20} /></button>
//                 <CheckCircle2 size={48} className="mx-auto mb-2 opacity-90" />
//                 <h3 className="text-xl font-extrabold">Transaction Receipt</h3>
//                 <p className="text-xs font-medium opacity-80 mt-1">Status: Completed</p>
//               </div>
              
//               <div className="p-6 space-y-4">
//                 <div className="text-center pb-4 border-b border-dashed border-lime-500/20">
//                   <p className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Amount</p>
//                   <p className="text-3xl font-extrabold text-lime-950 dark:text-white font-mono mt-1">
//                     {receiptData.mode === "deposit" ? "+" : "-"}${receiptData.amount.toFixed(2)}
//                   </p>
//                 </div>
                
//                 <div className="space-y-2 text-sm">
//                   <div className="flex justify-between text-lime-800/70 dark:text-lime-200/60"><span>Transaction ID</span> <span className="font-mono text-lime-950 dark:text-white">{receiptData.id}</span></div>
//                   <div className="flex justify-between text-lime-800/70 dark:text-lime-200/60"><span>Method</span> <span className="font-mono text-lime-950 dark:text-white uppercase">{receiptData.method}</span></div>
//                   <div className="flex justify-between text-lime-800/70 dark:text-lime-200/60"><span>Fee</span> <span className="font-mono text-lime-950 dark:text-white">${receiptData.fee.toFixed(2)}</span></div>
//                   <div className="flex justify-between text-lime-800/70 dark:text-lime-200/60"><span>Date</span> <span className="font-mono text-lime-950 dark:text-white">{receiptData.date}</span></div>
//                 </div>

//                 <button onClick={() => setReceiptData(null)} className="w-full mt-4 py-3 bg-lime-600 text-white rounded-xl font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20 flex items-center justify-center gap-2">
//                   <Download size={18} /> Download PDF
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }