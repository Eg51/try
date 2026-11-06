// app/admin/users/loading.tsx
export default function AdminUsersLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 PAGE HEADER SKELETON */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-surface-700"></div>
          <div className="h-8 w-56 bg-surface-700 rounded-lg"></div>
        </div>
        <div className="h-4 w-72 bg-surface-700/50 rounded"></div>
      </div>

      {/* 👇 TABLE CONTAINER SKELETON */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden h-[600px]">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            
            {/* Table Headers */}
            <thead className="bg-surface-900/50 border-b border-surface-700 text-text-muted">
              <tr>
                <th className="p-4 font-medium w-1/3">
                  <div className="h-4 w-16 bg-surface-700 rounded"></div>
                </th>
                <th className="p-4 font-medium">
                  <div className="h-4 w-12 bg-surface-700 rounded"></div>
                </th>
                <th className="p-4 font-medium">
                  <div className="h-4 w-10 bg-surface-700 rounded"></div>
                </th>
                <th className="p-4 font-medium">
                  <div className="h-4 w-14 bg-surface-700 rounded"></div>
                </th>
                <th className="p-4 font-medium text-right">
                  <div className="h-4 w-16 bg-surface-700 rounded ml-auto"></div>
                </th>
              </tr>
            </thead>

            {/* Table Rows (Mocking 8 users) */}
            <tbody className="divide-y divide-surface-700/50">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="hover:bg-surface-700/30 transition-colors">
                  
                  {/* User Column (Name & Email) */}
                  <td className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-surface-700 rounded"></div>
                      <div className="h-3 w-48 bg-surface-700/50 rounded"></div>
                    </div>
                  </td>

                  {/* Role Column (Badge) */}
                  <td className="p-4">
                    <div className="h-6 w-16 bg-surface-700 rounded-md"></div>
                  </td>

                  {/* Tier Column (Text) */}
                  <td className="p-4">
                    <div className="h-4 w-12 bg-surface-700 rounded"></div>
                  </td>

                  {/* Status Column (Badge) */}
                  <td className="p-4">
                    <div className="h-6 w-20 bg-surface-700 rounded-md"></div>
                  </td>

                  {/* Actions Column (3 Icon Buttons) */}
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* Wallet Button */}
                      <div className="w-8 h-8 rounded-lg bg-surface-900 border border-surface-700"></div>
                      {/* Role Button */}
                      <div className="w-8 h-8 rounded-lg bg-surface-900 border border-surface-700"></div>
                      {/* Status Button */}
                      <div className="w-8 h-8 rounded-lg bg-surface-900 border border-surface-700"></div>
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