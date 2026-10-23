// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  // 1. If no session cookie, redirect to login immediately (fail fast, no DB hit)
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 2. Verify Firebase Session Cookie (Lightweight, no DB)
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // 3. Connect to DB and load user
    await connectDB();
    const user = await User.findOne({ firebaseUid: decodedClaims.uid }).lean();

    // 4. Check user status
    if (!user || user.status === 'suspended' || user.status === 'closed') {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }

    // 5. Admin Gate
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 6. Forward headers (Just like your working proxy.js!)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user._id.toString());
    requestHeaders.set('x-user-uid', decodedClaims.uid);
    requestHeaders.set('x-user-email', user.email || '');
    requestHeaders.set('x-user-role', user.role || 'user');
    requestHeaders.set('x-user-status', user.status || 'active');
    requestHeaders.set('x-user-kyc-tier', user.kycTier.toString());

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
    
  } catch (error) {
    // If Firebase verification fails (expired/revoked token), clear and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  // CRITICAL FIX: Notice /login and /register are GONE from the matcher.
  // This prevents the middleware from running and hanging on the login page.
  matcher: [
    '/dashboard/:path*', 
    '/admin/:path*'
  ],
};
// // proxy.ts
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { adminAuth } from '@/lib/firebase-admin';
// import connectDB from '@/lib/db';
// import User from '@/lib/models/User';

// export async function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const sessionCookie = request.cookies.get('session')?.value;

//   if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
//     if (!sessionCookie) return NextResponse.next();

//     try {
//       // RESTORED: 'true'
//       const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
//       await connectDB();
//       const user = await User.findOne({ firebaseUid: decodedClaims.uid }).lean();
      
//       if (user && user.status === 'active') {
//         return NextResponse.redirect(new URL('/dashboard', request.url));
//       }
      
//       const response = NextResponse.next();
//       response.cookies.delete('session');
//       return response;
//     } catch {
//       const response = NextResponse.next();
//       response.cookies.delete('session');
//       return response;
//     }
//   }

//   if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
//     if (!sessionCookie) return NextResponse.redirect(new URL('/login', request.url));

//     try {
//       // RESTORED: 'true'
//       const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
//       await connectDB();
//       const user = await User.findOne({ firebaseUid: decodedClaims.uid }).lean();

//       if (!user || user.status === 'suspended' || user.status === 'closed') {
//         const response = NextResponse.redirect(new URL('/login', request.url));
//         response.cookies.delete('session');
//         return response;
//       }
      
//       if (pathname.startsWith('/admin') && user.role !== 'admin') {
//         return NextResponse.redirect(new URL('/dashboard', request.url));
//       }
      
//       return NextResponse.next();
//     } catch (error) {
//       const response = NextResponse.redirect(new URL('/login', request.url));
//       response.cookies.delete('session');
//       return response;
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
// };