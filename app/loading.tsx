// app/loading.tsx
export default function LandingPageLoading() {
  return (
    <div className="flex-1 w-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] relative transition-colors duration-300 overflow-hidden animate-pulse">
      
      {/* 👇 BACKGROUND AURORA GLOWS */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* 👇 NAVBAR SKELETON */}
      <nav className="fixed top-0 w-full border-b border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-lime-500/20"></div>
            <div className="h-6 w-24 bg-lime-500/20 rounded"></div>
          </div>
          
          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
            <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
            <div className="h-4 w-24 bg-lime-500/20 rounded"></div>
            <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block h-8 w-24 bg-lime-500/20 rounded-xl"></div>
            <div className="h-9 w-9 rounded-full bg-lime-500/20"></div>
            <div className="hidden lg:block h-10 w-24 bg-lime-500/20 rounded-xl"></div>
            <div className="lg:hidden h-9 w-9 rounded-full bg-lime-500/20"></div>
          </div>
        </div>
      </nav>

      {/* 👇 MAIN CONTENT */}
      <main className="relative z-20 pt-32 sm:pt-40 pb-20 px-4 sm:px-6 flex-grow">
        
        {/* 1. HERO SECTION */}
        <div className="max-w-4xl mx-auto text-center space-y-8 relative mb-24">
          {/* Headline */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 sm:h-16 md:h-20 w-3/4 bg-lime-500/20 rounded-2xl"></div>
            <div className="h-12 sm:h-16 md:h-20 w-1/2 bg-lime-500/20 rounded-2xl"></div>
          </div>
          {/* Paragraph */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-full max-w-2xl bg-lime-500/10 rounded-lg"></div>
            <div className="h-5 w-4/5 max-w-xl bg-lime-500/10 rounded-lg"></div>
          </div>
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <div className="h-14 w-48 bg-lime-500/20 rounded-xl"></div>
            <div className="h-14 w-48 bg-lime-500/10 rounded-xl"></div>
          </div>
        </div>

        {/* 2. MARKETS SECTION SKELETON */}
        <div className="max-w-6xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Side: Text */}
          <div className="space-y-6">
            <div className="h-10 w-3/4 bg-lime-500/20 rounded-xl"></div>
            <div className="h-4 w-full bg-lime-500/10 rounded"></div>
            <div className="h-4 w-5/6 bg-lime-500/10 rounded"></div>
            <div className="h-12 w-40 bg-lime-500/20 rounded-xl mt-8"></div>
          </div>
          {/* Right Side: Table Card */}
          <div className="bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl h-80 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 w-20 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-32 bg-lime-500/20 rounded"></div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-lime-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-lime-500/20"></div>
                  <div className="space-y-1">
                    <div className="h-3 w-12 bg-lime-500/20 rounded"></div>
                    <div className="h-2 w-16 bg-lime-500/10 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. TERMINAL SECTION SKELETON */}
        <div className="max-w-6xl mx-auto mt-32">
          <div className="text-center mb-12 space-y-4">
            <div className="h-8 w-64 bg-lime-500/20 rounded-xl mx-auto"></div>
            <div className="h-4 w-96 bg-lime-500/10 rounded-lg mx-auto"></div>
          </div>
          <div className="bg-white/60 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-2xl h-[450px] p-6 flex gap-4">
             {/* Sidebar */}
             <div className="w-48 border-r border-lime-500/10 pr-4 space-y-2 hidden md:block">
               <div className="h-10 w-full bg-lime-500/10 rounded-lg"></div>
               <div className="h-10 w-full bg-lime-500/10 rounded-lg"></div>
               <div className="h-10 w-full bg-lime-500/10 rounded-lg"></div>
             </div>
             {/* Chart Area */}
             <div className="flex-1 bg-lime-500/5 rounded-xl flex flex-col justify-end p-4">
                <div className="flex items-end justify-around h-full gap-2">
                  {[40, 60, 30, 80, 50, 70, 90, 45, 65, 55, 75, 35].map((h, i) => (
                    <div key={i} className={`w-4 rounded-sm ${i % 2 === 0 ? 'bg-green-500/30' : 'bg-red-500/30'}`} style={{ height: `${h}%` }}></div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* 4. GLOBAL STATS SKELETON */}
        <div className="max-w-4xl mx-auto mt-32 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 place-items-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-lime-500/20"></div>
              <div className="h-10 w-32 bg-lime-500/20 rounded-xl"></div>
              <div className="h-4 w-40 bg-lime-500/10 rounded"></div>
            </div>
          ))}
        </div>

        {/* 5. FEATURE GRID SKELETON */}
        <div className="max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-8 h-64 rounded-3xl bg-white/60 dark:bg-[#0a0f0b]/60 border border-lime-500/20 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-lime-500/20"></div>
              <div className="h-6 w-3/4 bg-lime-500/20 rounded mt-2"></div>
              <div className="h-4 w-full bg-lime-500/10 rounded"></div>
              <div className="h-4 w-5/6 bg-lime-500/10 rounded"></div>
            </div>
          ))}
        </div>

      </main>

      {/* 👇 FOOTER SKELETON */}
      <footer className="border-t border-lime-500/20 bg-white/40 dark:bg-[#050806]/80 pt-12 pb-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            {/* Column 1 */}
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <div className="h-4 w-20 bg-lime-500/20 rounded"></div>
              <div className="h-3 w-24 bg-lime-500/10 rounded"></div>
              <div className="h-3 w-24 bg-lime-500/10 rounded"></div>
              <div className="h-3 w-24 bg-lime-500/10 rounded"></div>
            </div>
            {/* Column 2 */}
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <div className="h-4 w-20 bg-lime-500/20 rounded"></div>
              <div className="h-3 w-32 bg-lime-500/10 rounded"></div>
              <div className="h-3 w-32 bg-lime-500/10 rounded"></div>
            </div>
            {/* Column 3 */}
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <div className="h-4 w-32 bg-lime-500/20 rounded"></div>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-10 h-10 bg-lime-500/10 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-lime-500/10 flex justify-center md:justify-between items-center flex-col md:flex-row gap-4">
            <div className="h-3 w-48 bg-lime-500/10 rounded"></div>
          </div>
        </div>
      </footer>

    </div>
  );
}