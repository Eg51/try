// app/dashboard/transfer/page.tsx
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import TransferClient from "./TransferClient";

export const instant = false;
export const metadata = { title: "Transfer Funds" };
export default async function TransferPage() {
  const session = await getServerSession();
  if (!session) return null;

  await connectDB();

  // Fetch the user's actual tier from the session (or DB if needed)
  // Your KYC page uses session.tier, so we do the same here.
  const userTier = session.tier || 0;

  return <TransferClient tier={userTier} />;
}