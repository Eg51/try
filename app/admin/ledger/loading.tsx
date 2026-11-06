// app/admin/ledger/loading.tsx
export default function AdminLedgerLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 PAGE HEADER SKELETON */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10"></div>
          <div className="h-8 w-48 bg-white/10 rounded-lg"></div>
        </div>
        <div className="h-4 w-72 bg-white/5 rounded"></div>
      </div>

      {/* 👇 METRICS GRID SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Total Platform Volume */}
        <div className="p-6 rounded-2xl bg-[#0a0f0b] border border-lime-500/20 flex items-center gap-4 h-[100px]">
          <div className="p-3 rounded-xl bg-lime-500/10 w-12 h-12 shrink-0"></div>
          <div className="space-y-2 w-full">
            <div className="h-4 w-40 bg-white/10 rounded"></div>
            <div className="h-7 w-32 bg-white/20 rounded-lg"></div>
          </div>
        </div>

        {/* Card 2: Recent Transactions */}
        <div className="p-6 rounded-2xl bg-[#0a0f0b] border border-white/10 flex items-center gap-4 h-[100px]">
          <div className="p-3 rounded-xl bg-blue-500/10 w-12 h-12 shrink-0"></div>
          <div className="space-y-2 w-full">
            <div className="h-4 w-40 bg-white/10 rounded"></div>
            <div className="h-7 w-16 bg-white/20 rounded-lg"></div>
          </div>
        </div>

      </div>

      {/* 👇 TABLE CONTAINER SKELETON */}
      <div className="bg-[#0a0f0b] border border-white/10 rounded-2xl overflow-hidden h-[600px]">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            
            {/* Table Headers */}
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">
                  <div className="h-3 w-28 bg-white/10 rounded"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-3 w-16 bg-white/10 rounded"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-3 w-20 bg-white/10 rounded"></div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="h-3 w-40 bg-white/10 rounded ml-auto"></div>
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-white/5">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  
                  {/* Transaction ID */}
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 bg-white/10 rounded font-mono"></div>
                  </td>

                  {/* Type Badge */}
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 bg-white/10 rounded-md"></div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="h-4 w-32 bg-white/5 rounded"></div>
                  </td>

                  {/* Entries (Right Aligned Stack) */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 items-end">
                      <div className="h-4 w-24 bg-white/10 rounded"></div>
                      <div className="h-4 w-20 bg-white/10 rounded"></div>
                      {i % 2 === 0 && (
                         <div className="h-4 w-28 bg-white/10 rounded"></div>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}