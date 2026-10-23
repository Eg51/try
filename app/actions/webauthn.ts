// app/actions/webauthn.ts
"use server";

import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/session';
import { Authenticator, IAuthenticator } from '@/lib/models/Authenticator';
import User from '@/lib/models/User';
import connectDB from '@/lib/db';
import { 
  setChallengeCookie, readChallengeCookie, clearChallengeCookie, 
  CHALLENGE_COOKIE_REGISTER, CHALLENGE_COOKIE_LOGIN, 
  RP_ID, RP_NAME, ORIGIN 
} from '@/lib/webauthn';

// 1. GENERATE REGISTRATION OPTIONS (User must be logged in)
export async function getRegistrationOptions() {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");
  await connectDB();

  const userAuthenticators = await Authenticator.find({ userId: session.id });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(session.id), 
    userName: session.displayName,
    attestationType: 'none',
    excludeCredentials: userAuthenticators.map(auth => ({
      id: auth.credentialID,
      type: 'public-key',
    })),
  });

  await setChallengeCookie(CHALLENGE_COOKIE_REGISTER, options.challenge);
  return options;
}

// 2. VERIFY REGISTRATION
export async function verifyRegistration(attestationResponse: any) {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const expectedChallenge = await readChallengeCookie(CHALLENGE_COOKIE_REGISTER);
  if (!expectedChallenge) throw new Error("Challenge expired or missing");

  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credential } = verification.registrationInfo;
    
    await Authenticator.create({
      userId: session.id,
      credentialID: credential.id,
      credentialPublicKey: Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter,
      transports: attestationResponse.response.transports || [],
    });
    await clearChallengeCookie(CHALLENGE_COOKIE_REGISTER);
    return { success: true };
  }
  return { success: false };
}

// 3. GENERATE LOGIN OPTIONS (Public route)
export async function getAuthenticationOptions() {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
  });
  await setChallengeCookie(CHALLENGE_COOKIE_LOGIN, options.challenge);
  return options;
}

// 4. VERIFY LOGIN & RETURN CUSTOM TOKEN
export async function verifyAuthentication(assertionResponse: any) {
  await connectDB();
  
  const authenticator = await Authenticator.findOne({ credentialID: assertionResponse.id }) as IAuthenticator | null;
  if (!authenticator) throw new Error("Authenticator not found");

  const expectedChallenge = await readChallengeCookie(CHALLENGE_COOKIE_LOGIN);
  if (!expectedChallenge) throw new Error("Challenge expired");

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    // FIX: v14 renamed 'authenticator' to 'credential'
    credential: {
      id: authenticator.credentialID, 
      publicKey: Buffer.from(authenticator.credentialPublicKey, 'base64'), // Buffer is a valid Uint8Array
      counter: authenticator.counter,
      transports: authenticator.transports as any,
    },
  });

  if (verification.verified) {
    authenticator.counter = verification.authenticationInfo.newCounter;
    await authenticator.save();
    await clearChallengeCookie(CHALLENGE_COOKIE_LOGIN);

    const user = await User.findById(authenticator.userId);
    if (!user) throw new Error("User not found");

    const customToken = await adminAuth.createCustomToken(user.firebaseUid);
    
    return { success: true, customToken };
  }
  return { success: false };
}