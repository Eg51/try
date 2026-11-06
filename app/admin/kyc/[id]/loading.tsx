// app/admin/kyc/[id]/loading.tsx
export default function AdminKycDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 BACK BUTTON SKELETON */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-white/10"></div>
        <div className="h-4 w-40 bg-white/10 rounded"></div>
      </div>

      {/* 👇 MAIN GLASS CARD SKELETON */}
      <div className="bg-[#0a0f0b] border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Header Row: Name, Email & Tier Badge */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 mb-6">
          <div className="space-y-3 w-full sm:w-auto">
            <div className="h-8 w-64 bg-white/10 rounded-lg"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-white/10"></div>
              <div className="h-4 w-48 bg-white/5 rounded"></div>
            </div>
          </div>
          
          {/* Tier Verification Badge */}
          <div className="h-11 w-44 bg-lime-500/10 border border-lime-500/20 rounded-xl shrink-0 mt-2 sm:mt-0"></div>
        </div>
        
        {/* Personal Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
              {/* Label (e.g., Legal Name) */}
              <div className="h-3 w-24 bg-white/10 rounded"></div>
              {/* Value (e.g., John Doe) */}
              <div className="h-5 w-3/4 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>

        {/* Document Details Section */}
        <div className="space-y-4 mb-8">
          {/* Section Title */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
            <div className="h-6 w-48 bg-white/10 rounded-lg"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: ID Type & Number Box */}
            <div className="p-4 border border-white/10 rounded-xl bg-black/20 space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-white/10 rounded"></div>
                <div className="h-5 w-32 bg-white/20 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-white/10 rounded"></div>
                <div className="h-5 w-40 bg-white/20 rounded"></div>
              </div>
            </div>

            {/* Right: Document Viewer Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* View ID */}
              <div className="flex flex-col items-center justify-center p-3 border border-white/10 rounded-xl bg-white/5 h-[84px] gap-2">
                <div className="w-5 h-5 rounded-sm bg-white/10"></div>
                <div className="h-3 w-16 bg-white/10 rounded"></div>
              </div>
              {/* View Selfie */}
              <div className="flex flex-col items-center justify-center p-3 border border-white/10 rounded-xl bg-white/5 h-[84px] gap-2">
                <div className="w-5 h-5 rounded-sm bg-white/10"></div>
                <div className="h-3 w-20 bg-white/10 rounded"></div>
              </div>
              {/* View Address */}
              <div className="flex flex-col items-center justify-center p-3 border border-white/10 rounded-xl bg-white/5 h-[84px] gap-2">
                <div className="w-5 h-5 rounded-sm bg-white/10"></div>
                <div className="h-3 w-24 bg-white/10 rounded"></div>
              </div>
            </div>

          </div>
        </div>

        {/* Review Action Form (Approve / Reject Buttons) */}
        <div className="border-t border-white/10 pt-6 mt-6">
          <div className="flex gap-4">
            {/* Reject Button */}
            <div className="flex-1 h-12 bg-red-500/10 border border-red-500/20 rounded-xl"></div>
            {/* Approve Button */}
            <div className="flex-1 h-12 bg-lime-500/20 rounded-xl"></div>
          </div>
        </div>

      </div>
    </div>
  );
}