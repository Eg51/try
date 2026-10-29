// app/dashboard/wallet/page.tsx
import { getUserBalances } from "@/app/actions/wallet";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import WalletClient from "./WalletClient";

export const instant = false;

export default async function WalletPage() {
  await connection(); 

  const session = await getServerSession();
  if (!session) redirect("/login");

  const { success, balances, transactions } = await getUserBalances();

  const usdBalance = balances?.find((b: any) => b.assetId === "USD" && b.type === "available")?.balance || 0;

  return (
    <WalletClient 
      tier={session.tier || 0} 
      usdBalance={usdBalance}
      rawBalances={balances || []}
      initialTransactions={transactions || []}
    />
  );
}