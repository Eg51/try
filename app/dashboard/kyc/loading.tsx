// app/dashboard/kyc/loading.tsx
export default function KycLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 HEADER SKELETON */}
      <div className="text-center space-y-3 mb-8">
        <div className="h-9 w-64 bg-lime-500/20 rounded-xl mx-auto"></div>
        <div className="h-4 w-full max-w-lg bg-lime-500/10 rounded-lg mx-auto"></div>
      </div>

      {/* 👇 TIER CARDS SKELETON */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i} 
            className="relative flex flex-col items-center justify-center p-6 rounded-3xl border border-lime-500/20 bg-white/40 dark:bg-[#0a0f0b]/40 text-center h-[190px]"
          >
            {/* Title */}
            <div className="h-5 w-56 bg-lime-500/20 rounded-lg mb-4"></div>
            
            {/* Icon Circle */}
            <div className="w-14 h-14 rounded-full bg-lime-500/20 mb-4 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-lime-500/30"></div>
            </div>
            
            {/* Status & Subtitle */}
            <div className="space-y-2">
              <div className="h-3 w-32 bg-lime-500/20 rounded"></div>
              <div className="h-3 w-48 bg-lime-500/10 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* 👇 FORM CONTAINER SKELETON */}
      <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl mt-8 space-y-8">
        
        {/* Form Header */}
        <div className="h-7 w-48 bg-lime-500/20 rounded-lg"></div>

        {/* Section 1: Basic Identity */}
        <div className="space-y-4">
          <div className="h-4 w-36 bg-lime-500/20 rounded border-b border-lime-500/20 pb-2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[54px] w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Section 2: Residential Address */}
        <div className="space-y-4">
          <div className="h-4 w-40 bg-lime-500/20 rounded border-b border-lime-500/20 pb-2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[54px] w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Section 3: Identity Documents */}
        <div className="space-y-4">
          <div className="h-4 w-56 bg-lime-500/20 rounded border-b border-lime-500/20 pb-2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-2xl border flex flex-col gap-3 h-[160px] ${
                  i === 3 ? "border-amber-500/30 bg-amber-500/5" : "border-lime-500/20 bg-lime-500/5"
                }`}
              >
                <div className="h-3 w-32 bg-lime-500/20 rounded"></div>
                <div className="h-[54px] w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 rounded-xl"></div>
                <div className="flex-1 w-full bg-white/50 dark:bg-[#050806]/50 border border-dashed border-lime-500/30 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="h-14 w-full bg-lime-500/20 rounded-xl mt-6"></div>

      </div>
    </div>
  );
}