// app/actions/admin.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { LedgerTransaction } from "@/lib/models/Ledger";
import { revalidatePath } from "next/cache";

// 👇 SECURITY HELPER: Reusable check for all admin actions
async function requireAdmin() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
  return session;
}

// ==========================================
// 1. DASHBOARD STATS (Your existing code)
// ==========================================
export async function getAdminDashboardStats() {
  try {
    // 👇 Uncommented this to ensure strict security
    await requireAdmin(); 

    await connectDB();

    // 1. Fetch Core Metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    
    // 2. Fetch Recent Activity (Ledger Transactions)
    const recentActivity = await LedgerTransaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('entries.accountId', 'assetId') // Gets the asset type
      .lean();

    // 3. Calculate Volume (Sum of trade transactions)
    const trades = await LedgerTransaction.find({ kind: 'trade' }).lean();
    const totalVolumeCents = trades.reduce((acc, txn) => {
      // Find the USD entry in the transaction to sum up
      const usdEntry = txn.entries.find((e: any) => e.assetId === 'USD');
      return acc + (usdEntry ? usdEntry.amount : 0);
    }, 0);

    return {
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalVolume: totalVolumeCents / 100, // Convert cents to dollars
      },
      activity: recentActivity.map(a => ({
        id: a._id.toString(),
        kind: a.kind,
        date: a.createdAt,
        refId: a.refId,
      }))
    };
  } catch (error) {
    console.error("Admin fetch error:", error);
    return { success: false, stats: null, activity: [] };
  }
}

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
export async function getAllUsers() {
  await requireAdmin();
  await connectDB();
  
  const users = await User.find().sort({ createdAt: -1 }).limit(100).lean();
  
  // Strip sensitive data before sending to the client
  const safeUsers = users.map(u => ({
    id: u._id.toString(),
    displayName: u.displayName,
    email: u.email,
    role: u.role,
    status: u.status,
    kycTier: u.kycTier,
    createdAt: new Date(u.createdAt).toLocaleDateString(),
  }));

  return { success: true, users: safeUsers };
}

export async function updateUserStatus(userId: string, newStatus: 'active' | 'suspended') {
  const session = await requireAdmin();
  
  // Prevent admins from banning themselves
  if (session.id === userId) return { error: "You cannot change your own status." };

  await connectDB();
  await User.findByIdAndUpdate(userId, { status: newStatus });
  
  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin') {
  const session = await requireAdmin();
  
  // Prevent admins from demoting themselves
  if (session.id === userId) return { error: "You cannot change your own role." };

  await connectDB();
  await User.findByIdAndUpdate(userId, { role: newRole });
  
  revalidatePath('/admin/users');
  return { success: true };
}

// ==========================================
// 3. LEDGER AUDIT
// ==========================================
export async function getLedgerAudit() {
  await requireAdmin();
  await connectDB();

  // Fetch the last 50 transactions
  const transactions = await LedgerTransaction.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Calculate total platform volume (assuming USD entries)
  const allTrades = await LedgerTransaction.find({ kind: 'trade' }).lean();
  const totalVolumeCents = allTrades.reduce((acc, txn) => {
    const usdEntry = txn.entries.find((e: any) => e.assetId === 'USD');
    return acc + (usdEntry ? usdEntry.amount : 0);
  }, 0);

  return {
    success: true,
    totalVolume: totalVolumeCents / 100,
    history: JSON.parse(JSON.stringify(transactions)),
  };
}
// // app/actions/admin.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { LedgerTransaction } from "@/lib/models/Ledger";

// export async function getAdminDashboardStats() {
//   try {
//     // Note: The proxy.ts already blocks non-admins from reaching /admin, 
//     // but we double-check here for absolute security.
//     const session = await getServerSession();
//     // if (!session || session.role !== 'admin') throw new Error("Unauthorized"); 
//     // (Assuming we add role to SafeUser later, for now we trust the proxy)

//     await connectDB();

//     // 1. Fetch Core Metrics
//     const totalUsers = await User.countDocuments();
//     const activeUsers = await User.countDocuments({ status: 'active' });
    
//     // 2. Fetch Recent Activity (Ledger Transactions)
//     const recentActivity = await LedgerTransaction.find()
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .populate('entries.accountId', 'assetId') // Gets the asset type
//       .lean();

//     // 3. Calculate Volume (Sum of trade transactions)
//     const trades = await LedgerTransaction.find({ kind: 'trade' }).lean();
//     const totalVolumeCents = trades.reduce((acc, txn) => {
//       // Find the USD entry in the transaction to sum up
//       const usdEntry = txn.entries.find((e: any) => e.assetId === 'USD');
//       return acc + (usdEntry ? usdEntry.amount : 0);
//     }, 0);

//     return {
//       success: true,
//       stats: {
//         totalUsers,
//         activeUsers,
//         totalVolume: totalVolumeCents / 100, // Convert cents to dollars
//       },
//       activity: recentActivity.map(a => ({
//         id: a._id.toString(),
//         kind: a.kind,
//         date: a.createdAt,
//         refId: a.refId,
//       }))
//     };
//   } catch (error) {
//     console.error("Admin fetch error:", error);
//     return { success: false, stats: null, activity: [] };
//   }
// }