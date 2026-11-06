// app/dashboard/transfer/loading.tsx
export default function TransferLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 relative px-2 sm:px-4 animate-pulse">
      
      {/* 👇 TOP HEADER BANNER */}
      <div className="w-full bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left w-full md:w-auto space-y-2">
          <div className="h-8 w-56 bg-lime-500/20 rounded-xl mx-auto md:mx-0"></div>
          <div className="h-4 w-72 bg-lime-500/10 rounded-lg mx-auto md:mx-0"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:flex md:items-center md:gap-6 md:w-auto justify-center md:justify-end border-t border-lime-500/10 md:border-t-0 pt-4 md:pt-0">
          <div className="flex flex-col items-center md:items-end space-y-2">
            <div className="h-3 w-24 bg-lime-500/20 rounded"></div>
            <div className="h-8 w-32 bg-lime-500/20 rounded-lg"></div>
          </div>
          
          <div className="h-10 w-px bg-lime-500/20 hidden md:block"></div>
          
          <div className="flex flex-col items-center md:items-end space-y-2">
            <div className="h-3 w-20 bg-lime-500/20 rounded"></div>
            <div className="h-6 w-24 bg-lime-500/20 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* 👇 MAIN FORM CONTAINER */}
      <div className="w-full bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-10">
        
        {/* Toggle Switch Skeleton */}
        <div className="flex justify-center mb-8 sm:mb-10 w-full">
          <div className="flex w-full p-1.5 bg-lime-100/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full shadow-inner h-14">
            <div className="flex-1 bg-lime-500/20 rounded-full"></div>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
          
          {/* Method Selector Skeleton */}
          <div>
            <div className="h-4 w-48 bg-lime-500/20 rounded mx-auto mb-3"></div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="h-24 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-lime-500/20"></div>
                <div className="h-3 w-12 bg-lime-500/20 rounded"></div>
              </div>
              <div className="h-24 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-lime-500/20"></div>
                <div className="h-3 w-12 bg-lime-500/20 rounded"></div>
              </div>
              <div className="h-24 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-lime-500/20"></div>
                <div className="h-3 w-12 bg-lime-500/20 rounded"></div>
              </div>
            </div>
          </div>

          {/* Form Fields Skeleton (Representing Bank/Card/Crypto inputs) */}
          <div className="space-y-4">
            <div className="h-3 w-32 bg-lime-500/20 rounded mb-2"></div>
            
            <div className="space-y-2">
              <div className="h-3 w-24 bg-lime-500/10 rounded"></div>
              <div className="h-12 w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-3 w-24 bg-lime-500/10 rounded"></div>
              <div className="h-12 w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl"></div>
            </div>

            <div className="space-y-2">
              <div className="h-3 w-24 bg-lime-500/10 rounded"></div>
              <div className="h-12 w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl"></div>
            </div>
          </div>

          {/* Amount Input Skeleton */}
          <div className="pt-2">
            <div className="h-4 w-32 bg-lime-500/20 rounded mb-3"></div>
            <div className="h-20 w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-2xl flex items-center px-6">
              <div className="h-8 w-8 bg-lime-500/20 rounded-lg mr-4"></div>
              <div className="h-8 w-48 bg-lime-500/20 rounded-lg"></div>
            </div>
            
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <div className="h-10 flex-1 bg-lime-500/10 rounded-xl"></div>
              <div className="h-10 flex-1 bg-lime-500/10 rounded-xl"></div>
              <div className="h-10 flex-1 bg-lime-500/10 rounded-xl"></div>
              <div className="h-10 flex-1 bg-lime-500/10 rounded-xl"></div>
            </div>
          </div>

          {/* Fee Summary Skeleton */}
          <div className="bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-lime-500/10 rounded"></div>
              <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-28 bg-lime-500/10 rounded"></div>
              <div className="h-4 w-20 bg-lime-500/20 rounded"></div>
            </div>
          </div>

          {/* Submit Button Skeleton */}
          <div className="h-16 w-full bg-lime-500/20 rounded-2xl mt-2"></div>
          
        </div>
      </div>
    </div>
  );
}