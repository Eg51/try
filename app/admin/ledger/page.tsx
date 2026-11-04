// app/admin/ledger/page.tsx
import connectDB from "@/lib/db";
import { LedgerTransaction } from "@/lib/models/Ledger";
import { ArrowRightLeft, DollarSign, Activity } from "lucide-react";
import { connection } from "next/server";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const instant = false;

export default async function AdminLedgerPage() {
  await connection();
  
  const session = await getServerSession();
  if (!session || session.role !== "admin") redirect("/dashboard");

  await connectDB();

  // Fetch last 50 transactions
  const transactions = await LedgerTransaction.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Calculate total platform volume
  const trades = await LedgerTransaction.find({ kind: 'trade' }).lean();
  const totalVolumeCents = trades.reduce((acc, txn) => {
    const usdEntry = txn.entries.find((e: any) => e.assetId === 'USD');
    return acc + (usdEntry ? usdEntry.amount : 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ArrowRightLeft size={24} className="text-lime-500" /> Ledger Audit
        </h1>
        <p className="text-gray-400 text-sm mt-1">Immutable record of all financial movements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-[#0a0f0b] border border-lime-500/20 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-lime-500/20 text-lime-400"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Total Platform Volume</p>
            <p className="text-2xl font-mono font-bold text-white">${(totalVolumeCents / 100).toLocaleString()}</p>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-[#0a0f0b] border border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400"><Activity size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Recent Transactions</p>
            <p className="text-2xl font-mono font-bold text-white">{transactions.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0f0b] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-white/5 text-xs uppercase text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Entries (Debits/Credits)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs">
            {transactions.map((txn: any) => (
              <tr key={txn._id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-gray-400">{txn._id.slice(-8)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md font-bold uppercase ${
                    txn.kind === 'trade' ? 'bg-blue-500/10 text-blue-400' : 
                    txn.kind === 'deposit' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {txn.kind}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{new Date(txn.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col gap-1 items-end">
                    {txn.entries.map((entry: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className={entry.direction === 'credit' ? 'text-green-400' : 'text-red-400'}>
                          {entry.direction === 'credit' ? '+' : '-'}
                          {(entry.amount / 100).toLocaleString()} {entry.assetId}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="p-12 text-center text-gray-500">No transactions found in the ledger.</div>
        )}
      </div>
    </div>
  );
}