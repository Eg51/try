// app/dashboard/page.tsx
import { getServerSession } from "@/lib/session";
import { connection } from 'next/server';
import DashboardClient from "./DashboardClient";

export const instant = false;

export default async function DashboardPage() {
  await connection();
  
  const session = await getServerSession();
  if (!session) return null;

  return (
    <DashboardClient 
      tier={session.tier || 0} 
      displayName={session.displayName || "Trader"} 
    />
  );
}