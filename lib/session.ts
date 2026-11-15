// lib/session.ts
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { SafeUser } from "@/types/dto";

export async function getServerSession(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    await connectDB();
    const dbUser = await User.findOne({ firebaseUid: decodedClaims.uid }).lean();
    
    if (!dbUser) return null;

    // 👇 THIS IS THE LOGIC YOU PASTED
    const safeUser: SafeUser = {
      id: dbUser._id.toString(),
      displayName: dbUser.displayName,
      email: dbUser.email,
      tier: (dbUser.kycTier as 0 | 1 | 2 | 3) || 0,
      displayCurrency: dbUser.displayCurrency?.assetId || "USD",
      role: dbUser.role as 'user' | 'admin',
    };

    return safeUser;
  } catch (error) {
    console.error("❌ SESSION VERIFICATION ERROR:", error);
    return null;
  }
}
