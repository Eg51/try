// app/dashboard/notifications/loading.tsx
export default function NotificationsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 animate-pulse px-2 sm:px-4">
      
      {/* 👇 HEADER CARD SKELETON */}
      <div className="relative bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Bell Icon */}
            <div className="w-12 h-12 rounded-2xl bg-lime-500/20 shrink-0"></div>
            
            {/* Text Lines */}
            <div className="space-y-2">
              <div className="h-7 w-40 bg-lime-500/20 rounded-lg"></div>
              <div className="h-4 w-56 bg-lime-500/10 rounded-md"></div>
            </div>
          </div>

          {/* Mark all as read button */}
          <div className="h-10 w-36 bg-lime-500/20 rounded-xl shrink-0 mt-2 sm:mt-0"></div>
        </div>
      </div>

      {/* 👇 FILTER TABS SKELETON */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div 
            key={i} 
            className={`shrink-0 h-9 rounded-xl border border-lime-500/20 ${
              i === 0 ? "w-16 bg-lime-500/20" : "w-24 bg-white/60 dark:bg-[#0a0f0b]/60"
            }`}
          ></div>
        ))}
      </div>

      {/* 👇 NOTIFICATION LIST SKELETON */}
      <div className="space-y-6">
        
        {/* Group 1 (e.g., Today) */}
        <div className="space-y-2">
          <div className="h-3 w-16 bg-lime-500/20 rounded ml-2"></div>
          
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/10 p-4 rounded-2xl flex items-start gap-3 sm:gap-4"
              >
                {/* Icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-lime-500/20 shrink-0"></div>
                
                {/* Content */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="h-4 w-32 bg-lime-500/20 rounded"></div>
                    <div className="h-3 w-12 bg-lime-500/10 rounded shrink-0"></div>
                  </div>
                  <div className="h-3 w-full max-w-md bg-lime-500/10 rounded"></div>
                  
                  {/* Meta tags (optional) */}
                  {i === 0 && (
                    <div className="flex gap-2 mt-2">
                      <div className="h-5 w-20 bg-lime-500/10 rounded-lg border border-lime-500/10"></div>
                      <div className="h-5 w-24 bg-lime-500/10 rounded-lg border border-lime-500/10"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group 2 (e.g., Yesterday) */}
        <div className="space-y-2">
          <div className="h-3 w-24 bg-lime-500/20 rounded ml-2"></div>
          
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/10 p-4 rounded-2xl flex items-start gap-3 sm:gap-4 opacity-70"
              >
                {/* Icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-lime-500/20 shrink-0"></div>
                
                {/* Content */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="h-4 w-40 bg-lime-500/20 rounded"></div>
                    <div className="h-3 w-14 bg-lime-500/10 rounded shrink-0"></div>
                  </div>
                  <div className="h-3 w-full max-w-sm bg-lime-500/10 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}