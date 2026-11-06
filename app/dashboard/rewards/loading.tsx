// app/dashboard/rewards/loading.tsx
export default function RewardsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-lime-500/20 rounded-xl"></div>
          <div className="h-4 w-40 bg-lime-500/10 rounded-lg"></div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="relative w-full md:w-72 h-10 bg-white/50 dark:bg-black/30 border border-lime-500/20 rounded-xl flex items-center px-4">
          <div className="w-5 h-5 rounded-full bg-lime-500/20 mr-3"></div>
          <div className="h-4 w-32 bg-lime-500/20 rounded"></div>
        </div>
      </div>

      {/* 👇 CATEGORY FILTERS SKELETON */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i} 
            className={`h-8 bg-white/50 dark:bg-black/30 border border-lime-500/20 rounded-lg ${
              i === 0 ? "w-16 bg-lime-500/10" : "w-24"
            }`}
          ></div>
        ))}
      </div>

      {/* 👇 BADGE GRID SKELETON */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="relative p-4 rounded-2xl border flex flex-col items-center text-center bg-white/40 dark:bg-[#0a0f0b]/60 border-lime-500/10 h-48"
          >
            {/* Top Right Lock Icon */}
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-lime-500/20"></div>

            {/* Center Icon */}
            <div className="w-10 h-10 rounded-full bg-lime-500/20 mb-3 mt-1"></div>
            
            {/* Title */}
            <div className="w-3/4 h-3 bg-lime-500/20 rounded mb-2"></div>
            
            {/* Description */}
            <div className="w-full h-2 bg-lime-500/10 rounded mb-4"></div>
            <div className="w-5/6 h-2 bg-lime-500/10 rounded mb-4"></div>

            {/* Progress Bar & Text (placed at the bottom) */}
            <div className="w-full mt-auto">
              <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-lime-500/20 rounded-full w-1/3"></div>
              </div>
              <div className="w-12 h-2 bg-lime-500/20 rounded mx-auto mt-2"></div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}