import { getServerSession } from "@/lib/session";
import { connection } from 'next/server';
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { KycSubmission } from "@/lib/models/Kyc";
import Asset from "@/lib/models/Asset";
import DashboardClient from "./DashboardClient";

export const instant = false;

export default async function DashboardPage() {
  await connection();

  const session = await getServerSession();
  if (!session) return null;

  await connectDB();

  // Fetch User, KYC submission, and asset list together
  const [user, submission, assetsRaw] = await Promise.all([
    User.findById(session.id).lean(),
    KycSubmission.findOne({ userId: session.id }).lean(),
    Asset.find({}).lean(),
  ]);

  const userAvatar = submission?.documents?.selfieLivenessUrl || "";

  const currencyMap: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$",
    AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹",
  };
  const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
  const displayCurrencySymbol = currencyMap[userCurrencyCode] || "$";

  // Serialize Mongo docs before crossing the server→client boundary
  const dbAssets = JSON.parse(JSON.stringify(assetsRaw));

  return (
    <DashboardClient
      tier={session.tier || 0}
      displayName={session.displayName || "Trader"}
      userAvatar={userAvatar}
      currencySymbol={displayCurrencySymbol}
      dbAssets={dbAssets}
    />
  );
}
// import { getServerSession } from "@/lib/session";
// import { connection } from 'next/server';
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { KycSubmission } from "@/lib/models/Kyc";
// import DashboardClient from "./DashboardClient";
// import Asset from "@/lib/models/Asset";

// export const instant = false;

// export default async function DashboardPage() {
//   await connection();
  
//   const session = await getServerSession();
//   if (!session) return null;

//   await connectDB();
  
//   // Fetch both User (for currency) and KYC (for avatar) simultaneously
//   const [user, submission] = await Promise.all([
//     User.findById(session.id).lean(),
//     KycSubmission.findOne({ userId: session.id }).lean()
//   ]);

//   const userAvatar = submission?.documents?.selfieLivenessUrl || "";

//   // 👇 Map the user's saved currency code to a symbol
//   const currencyMap: Record<string, string> = { 
//     USD: "$", NGN: "₦", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", 
//     AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹" 
//   };
//   const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
//   const displayCurrencySymbol = currencyMap[userCurrencyCode] || "$";

//   return (
//     <DashboardClient 
//       tier={session.tier || 0} 
//       displayName={session.displayName || "Trader"} 
//       userAvatar={userAvatar}
//       currencySymbol={displayCurrencySymbol}
//       dbAssets={JSON.parse(JSON.stringify(dbAssets))} // 👈 Pass it down
//     />
//   );
// }
