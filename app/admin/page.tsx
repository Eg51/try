// app/admin/page.tsx
import { getAdminDashboardStats } from "@/app/actions/admin";
import { Users, Activity, DollarSign, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server"; // <--- IMPORT ADDED
export const instant = false;
export default async function AdminDashboardPage() {
  // FIX: Opt out of static prerendering for this dynamic admin page
  await connection();

  const { success, stats, activity } = await getAdminDashboardStats();

  if (!success || !stats) {
    return <div className="text-danger">Failed to load admin metrics.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* 1. Header & "While You Were Away" */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-surface-800 to-surface-900 border border-surface-700 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Command Center</h1>
          <p className="text-text-secondary mt-1">Welcome back. Here is what happened while you were away.</p>
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <span className="bg-brand-500/10 text-brand-500 px-3 py-1.5 rounded-full border border-brand-500/20">
            {activity.length} recent system events
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={<Users size={20} />} 
          subtitle={`${stats.activeUsers} active`} 
        />
        <MetricCard 
          title="Total Platform Volume" 
          value={`$${stats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign size={20} />} 
          subtitle="All-time USD volume" 
          highlight 
        />
        <MetricCard 
          title="Pending Actions" 
          value="3" 
          icon={<ShieldCheck size={20} />} 
          subtitle="KYC reviews required" 
        />
      </div>

      {/* 3. Live Activity Feed */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-surface-700 flex justify-between items-center bg-surface-900/50">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Activity size={18} className="text-brand-500" /> Live System Activity
          </h2>
          <Link href="/admin/ledger" className="text-xs text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1">
            View Full Ledger <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-surface-700/50 max-h-[400px] overflow-y-auto">
          {activity.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">No recent activity found.</div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-surface-700/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(232,181,75,0.6)]"></div>
                  <div>
                    <p className="text-sm font-medium text-text-primary capitalize">
                      {item.kind.replace('_', ' ')} Executed
                    </p>
                    <p className="text-xs text-text-muted font-mono">ID: {item.id.slice(-8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-muted font-mono">
                    {new Date(item.date).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}

// Simple reusable metric card component
function MetricCard({ title, value, icon, subtitle, highlight = false }: { title: string, value: string, icon: React.ReactNode, subtitle: string, highlight?: boolean }) {
  return (
    <div className={`p-5 rounded-xl border ${highlight ? 'border-brand-500/30 bg-brand-500/5' : 'border-surface-700 bg-surface-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <div className={`p-2 rounded-lg ${highlight ? 'bg-brand-500/20 text-brand-500' : 'bg-surface-900 text-text-muted'}`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold font-mono text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
    </div>
  );
}