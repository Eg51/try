// app/dashboard/wallet/loading.tsx
export default function WalletLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-lime-500/20 rounded-xl"></div>
        <div className="h-4 w-80 bg-lime-500/10 rounded-lg"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTION FORM */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            
            {/* Toggle Switch Skeleton */}
            <div className="relative flex p-1 mb-8 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner max-w-sm mx-auto h-12">
              <div className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white/50 dark:bg-[#121A14]/50 rounded-full"></div>
            </div>

            {/* Balance Display Skeleton */}
            <div className="text-center mb-8 space-y-3">
              <div className="h-4 w-48 bg-lime-500/20 rounded mx-auto"></div>
              <div className="h-12 w-64 bg-lime-500/20 rounded-xl mx-auto"></div>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              
              {/* Payment Method Selector */}
              <div>
                <div className="h-3 w-40 bg-lime-500/20 rounded mb-2"></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-20 bg-lime-500/10 border border-lime-500/20 rounded-xl"></div>
                  <div className="h-20 bg-lime-500/10 border border-lime-500/20 rounded-xl"></div>
                  <div className="h-20 bg-lime-500/10 border border-lime-500/20 rounded-xl"></div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="h-3 w-24 bg-lime-500/20 rounded mb-2"></div>
                <div className="h-16 w-full bg-[#f4fbf5] dark:bg-[#121A14] border-2 border-lime-500/30 rounded-2xl"></div>
                <div className="flex gap-2 mt-2">
                  <div className="h-8 flex-1 bg-lime-500/10 rounded-lg"></div>
                  <div className="h-8 flex-1 bg-lime-500/10 rounded-lg"></div>
                  <div className="h-8 flex-1 bg-lime-500/10 rounded-lg"></div>
                  <div className="h-8 flex-1 bg-lime-500/10 rounded-lg"></div>
                </div>
              </div>

              {/* Fee & Details Box */}
              <div className="h-24 w-full bg-lime-500/5 border border-lime-500/10 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex justify-between"><div className="h-4 w-24 bg-lime-500/10 rounded"></div><div className="h-4 w-12 bg-lime-500/20 rounded"></div></div>
                <div className="flex justify-between"><div className="h-4 w-24 bg-lime-500/10 rounded"></div><div className="h-4 w-12 bg-lime-500/20 rounded"></div></div>
              </div>

              {/* Submit Button */}
              <div className="h-14 w-full bg-lime-500/20 rounded-xl mt-4"></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIMITS & ASSETS */}
        <div className="space-y-6">
          
          {/* Your Assets List */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
              <div className="h-5 w-32 bg-lime-500/20 rounded"></div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-lime-500/5 border border-lime-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lime-500/20"></div>
                    <div className="h-4 w-12 bg-lime-500/20 rounded"></div>
                  </div>
                  <div className="h-4 w-20 bg-lime-500/20 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
              <div className="h-5 w-40 bg-lime-500/20 rounded"></div>
            </div>
            <div className="divide-y divide-lime-500/5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-500/10"></div>
                    <div className="space-y-1">
                      <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
                      <div className="h-3 w-24 bg-lime-500/10 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-1 text-right flex flex-col items-end">
                    <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
                    <div className="h-3 w-12 bg-lime-500/10 rounded"></div>
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