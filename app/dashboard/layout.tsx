// app/dashboard/layout.tsx
import Link from "next/link";
import { LogOut, Wallet, Trophy, ArrowRightLeft, LayoutDashboard, Settings } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { connection } from "next/server"; // <--- IMPORT ADDED

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // FIX: Tells Next.js 16 to render this dynamically at request time
  await connection(); 

  // SECURITY: Protect the dashboard route on the server
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-surface-700 bg-surface-800 flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-surface-700">
          <span className="text-brand-500 font-bold text-xl tracking-tighter">QUANTIX</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem href="/dashboard/markets" icon={<ArrowRightLeft size={20} />} label="Markets" />
          <NavItem href="/dashboard/wallet" icon={<Wallet size={20} />} label="Wallet" />
          <NavItem href="/dashboard/rewards" icon={<Trophy size={20} />} label="Rewards" />
          <NavItem href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-surface-700">
          <form action={logout}>
            <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-danger hover:bg-danger/10 transition-all font-medium text-sm w-full">
              <LogOut size={20} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-surface-700 bg-surface-800/50 backdrop-blur-md flex items-center justify-between px-6">
          <div className="md:hidden text-brand-500 font-bold text-xl tracking-tighter">QUANTIX</div>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="px-4 py-1.5 rounded-full border border-surface-700 bg-surface-900 text-sm font-mono flex items-center gap-2">
              <span className="text-text-muted hidden sm:inline">Balance:</span>
              <span className="text-text-primary font-semibold">10,000 {session.displayCurrency}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold">
              {session.displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// Helper Component for Sidebar Links
function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-all group">
      <span className="text-text-muted group-hover:text-brand-500 transition-colors">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}