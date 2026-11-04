
// lib/session.ts
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

export async function getServerSession() {
  // 👇 1. Pull this OUT of the try/catch block.
  // If Next.js throws a dynamic error during build, let it bubble up!
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  
  if (!sessionCookie) return null;

  // 👇 2. Keep the try/catch ONLY around the database and token logic
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    await connectDB();
    const user = await User.findOne({ firebaseUid: decodedClaims.uid }).lean();
    
    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      displayCurrency: user.displayCurrency?.assetId || "USD",
      tier: (user.kycTier as 0 | 1 | 2 | 3) || 0, 
      role: user.role
    };
  } catch (error) {
    console.error("❌ SESSION VERIFICATION ERROR:", error);
    return null;
  }
}