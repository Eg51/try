// lib/session.ts
import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';
import connectDB from './db';
import User from './models/User';
import { SafeUser } from '@/types/dto';

export async function getServerSession(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return null;

    // RESTORED: 'true' ensures we check if the session has been revoked
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    await connectDB();
    const user = await User.findOne({ firebaseUid: decodedClaims.uid }).lean();

    if (!user || user.status === 'suspended' || user.status === 'closed') {
      return null;
    }

    return {
      id: user._id.toString(),
      displayName: user.displayName,
      tier: user.kycTier,
      displayCurrency: user.displayCurrency.assetId,
      role: user.role,
    };
  } catch (error) {
    return null;
  }
}