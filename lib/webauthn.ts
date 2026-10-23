// lib/webauthn.ts
import { cookies } from 'next/headers';

export const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'Quantix Solaris';
export const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
export const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

export const CHALLENGE_COOKIE_REGISTER = 'webauthn_chal_register';
export const CHALLENGE_COOKIE_LOGIN = 'webauthn_chal_login';
export const CHALLENGE_TTL_SECONDS = 300; // 5 minutes

export async function setChallengeCookie(cookieName: string, challenge: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CHALLENGE_TTL_SECONDS,
  });
}

export async function readChallengeCookie(cookieName: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(cookieName)?.value || null;
  } catch {
    return null;
  }
}

export async function clearChallengeCookie(cookieName: string) {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}