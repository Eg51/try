// app/admin/kyc/loading.tsx
export default function AdminKycLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 PAGE HEADER SKELETON */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-lime-500/20"></div>
            <div className="h-8 w-56 bg-lime-500/20 rounded-lg"></div>
          </div>
          <div className="h-4 w-72 bg-lime-500/10 rounded"></div>
        </div>
        
        {/* Pending Count Badge */}
        <div className="h-10 w-24 bg-[#0a0f0b] border border-lime-500/20 rounded-lg shrink-0"></div>
      </div>

      {/* 👇 TABLE CONTAINER SKELETON */}
      <div className="bg-[#0a0f0b] border border-lime-500/20 rounded-xl overflow-hidden h-[500px]">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            
            {/* Table Headers */}
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4">
                  <div className="h-3 w-12 bg-white/10 rounded"></div>
                </th>
                <th className="p-4">
                  <div className="h-3 w-24 bg-white/10 rounded"></div>
                </th>
                <th className="p-4">
                  <div className="h-3 w-20 bg-white/10 rounded"></div>
                </th>
                <th className="p-4 text-right">
                  <div className="h-3 w-16 bg-white/10 rounded ml-auto"></div>
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-white/5">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  
                  {/* User Column */}
                  <td className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-white/10 rounded"></div>
                      <div className="h-3 w-48 bg-white/5 rounded"></div>
                    </div>
                  </td>

                  {/* Tier Requested Column */}
                  <td className="p-4">
                    <div className="h-6 w-16 bg-lime-500/10 border border-lime-500/20 rounded-md"></div>
                  </td>

                  {/* Documents Column */}
                  <td className="p-4">
                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                  </td>

                  {/* Actions Column */}
                  <td className="p-4">
                    <div className="flex justify-end items-center gap-3">
                      
                      {/* Review Details Button */}
                      <div className="h-7 w-28 bg-white/10 rounded-lg"></div>
                      
                      {/* Action Buttons (Reject / Approve) */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surface-900 border border-surface-700"></div>
                        <div className="w-8 h-8 rounded-lg bg-surface-900 border border-surface-700"></div>
                      </div>

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