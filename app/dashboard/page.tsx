// app/dashboard/page.tsx
import { getServerSession } from "@/lib/session";
import { connection } from 'next/server';
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { KycSubmission } from "@/lib/models/Kyc";
import Asset from "@/lib/models/Asset";
import DashboardClient from "./DashboardClient";
import { getDashboardData } from "@/app/actions/dashboard"; 

export const instant = false;

export default async function DashboardPage() {
  await connection();

  const session = await getServerSession();
  if (!session) return null;

  await connectDB();

  // Fetch User, KYC submission, assets, AND dashboard data together
  const [user, submission, assetsRaw, dashboardData] = await Promise.all([
    User.findById(session.id).lean(),
    KycSubmission.findOne({ userId: session.id }).lean(),
    Asset.find({}).lean(),
    getDashboardData(), 
  ]);

  const userAvatar = submission?.documents?.selfieLivenessUrl || "";

  const currencyMap: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$",
    AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹",
  };
  const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
  const displayCurrencySymbol = currencyMap[userCurrencyCode] || "$";

  const dbAssets = JSON.parse(JSON.stringify(assetsRaw));

  return (
    <DashboardClient
      tier={session.tier || 0}
      displayName={session.displayName || "Trader"}
      userAvatar={userAvatar}
      currencySymbol={displayCurrencySymbol}
      dbAssets={dbAssets}
      realBalances={dashboardData.balances}
      realTrades={dashboardData.trades}
      realActivity={dashboardData.activity}
    />
  );
}
// // app/dashboard/page.tsx
// import { getServerSession } from "@/lib/session";
// import { connection } from 'next/server';
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { KycSubmission } from "@/lib/models/Kyc";
// import Asset from "@/lib/models/Asset";
// import DashboardClient from "./DashboardClient";
// import { getDashboardData } from "@/app/actions/dashboard"; // 👈 Imported

// export const instant = false;

// export default async function DashboardPage() {
//   await connection();

//   const session = await getServerSession();
//   if (!session) return null;

//   await connectDB();

//   // Fetch User, KYC submission, assets, AND dashboard data together
//   const [user, submission, assetsRaw, dashboardData] = await Promise.all([
//     User.findById(session.id).lean(),
//     KycSubmission.findOne({ userId: session.id }).lean(),
//     Asset.find({}).lean(),
//     getDashboardData(), // 👈 Fetched real data
//   ]);

//   const userAvatar = submission?.documents?.selfieLivenessUrl || "";

//   const currencyMap: Record<string, string> = {
//     USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$",
//     AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹",
//   };
//   const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
//   const displayCurrencySymbol = currencyMap[userCurrencyCode] || "$";

//   // Serialize Mongo docs before crossing the server→client boundary
//   const dbAssets = JSON.parse(JSON.stringify(assetsRaw));

//   return (
//     <DashboardClient
//       tier={session.tier || 0}
//       displayName={session.displayName || "Trader"}
//       userAvatar={userAvatar}
//       currencySymbol={displayCurrencySymbol}
//       dbAssets={dbAssets}
//       // 👇 Pass real data as props
//       realBalances={dashboardData.balances}
//       realTrades={dashboardData.trades}
//       realActivity={dashboardData.activity}
//     />
//   );
// }