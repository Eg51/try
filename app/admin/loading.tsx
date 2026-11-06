// app/admin/loading.tsx
export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 1. HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-surface-800 to-surface-900 border border-surface-700 p-6 rounded-2xl h-[100px]">
        <div className="space-y-3 w-full sm:w-auto">
          <div className="h-7 w-48 bg-surface-700 rounded-lg"></div>
          <div className="h-4 w-72 bg-surface-700/50 rounded-lg"></div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-8 w-40 bg-surface-700 rounded-full border border-surface-700"></div>
        </div>
      </div>

      {/* 👇 2. METRIC GRID SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i} 
            className={`p-5 rounded-xl border ${
              i === 1 
                ? "border-brand-500/30 bg-brand-500/5" 
                : "border-surface-700 bg-surface-800"
            } h-[140px] flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 w-24 bg-surface-700 rounded"></div>
              <div className={`w-9 h-9 rounded-lg ${
                i === 1 ? "bg-brand-500/20" : "bg-surface-900"
              }`}></div>
            </div>
            <div className="space-y-3">
              <div className="h-8 w-32 bg-surface-700 rounded-lg"></div>
              <div className="h-3 w-20 bg-surface-700/50 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* 👇 3. LIVE ACTIVITY FEED SKELETON */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden h-[400px]">
        
        {/* Feed Header */}
        <div className="p-4 border-b border-surface-700 flex justify-between items-center bg-surface-900/50 h-[60px]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-surface-700"></div>
            <div className="h-5 w-48 bg-surface-700 rounded-lg"></div>
          </div>
          <div className="h-4 w-28 bg-surface-700/50 rounded"></div>
        </div>

        {/* Feed List */}
        <div className="divide-y divide-surface-700/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between h-[72px]">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-surface-700"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-surface-700 rounded"></div>
                  <div className="h-3 w-24 bg-surface-700/50 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-3 w-16 bg-surface-700/50 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}