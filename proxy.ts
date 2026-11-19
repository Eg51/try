// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    await connectDB();
    const user = await User.findOne({ firebaseUid: decodedClaims.uid }).lean();

    if (!user || user.status === 'suspended' || user.status === 'closed') {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }

    // 👇 MOLE 1 FIXED: Check if the Admin has locked this account
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const response = NextResponse.redirect(new URL('/login?locked=true', request.url));
      response.cookies.delete('session');
      return response;
    }

    // 🛡️ ADMIN SESSION TIMEOUT (12 Hours)
    if (user.role === 'admin') {
      const sessionAge = Date.now() - (decodedClaims.auth_time * 1000);
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      
      if (sessionAge > TWELVE_HOURS) {
        const response = NextResponse.redirect(new URL('/login?expired=true', request.url));
        response.cookies.delete('session');
        return response;
      }
    }

    // 🛡️ ADMIN ROUTE PROTECTION
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 🛡️ REDIRECT ADMINS AWAY FROM USER DASHBOARD
    if (pathname === '/dashboard' && user.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // 🛡️ KYC GUARD
    if (user.role !== 'admin' && user.kycTier === 0 && !pathname.startsWith('/dashboard/kyc')) {
      return NextResponse.redirect(new URL('/dashboard/kyc', request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user._id.toString());
    requestHeaders.set('x-user-uid', decodedClaims.uid);
    requestHeaders.set('x-user-email', user.email || '');
    requestHeaders.set('x-user-role', user.role || 'user');
    requestHeaders.set('x-user-status', user.status || 'active');
    requestHeaders.set('x-user-kyc-tier', (user.kycTier ?? 0).toString());

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
    
  } catch (error) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/terminal/:path*',
    '/markets/:path*',
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

//   if (!sessionCookie) {
//     return NextResponse.redirect(new URL('/login', request.url));
//   }

//   try {
//     const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

//     await connectDB();
//     const user = await User.findOne({ firebaseUid: decodedClaims.uid }).lean();

//     if (!user || user.status === 'suspended' || user.status === 'closed') {
//       const response = NextResponse.redirect(new URL('/login', request.url));
//       response.cookies.delete('session');
//       return response;
//     }

//     // 🛡️ ADMIN SESSION TIMEOUT (12 Hours)
//     if (user.role === 'admin') {
//       const sessionAge = Date.now() - (decodedClaims.auth_time * 1000);
//       const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      
//       if (sessionAge > TWELVE_HOURS) {
//         const response = NextResponse.redirect(new URL('/login?expired=true', request.url));
//         response.cookies.delete('session');
//         return response;
//       }
//     }

//     // 🛡️ ADMIN ROUTE PROTECTION
//     if (pathname.startsWith('/admin') && user.role !== 'admin') {
//       return NextResponse.redirect(new URL('/dashboard', request.url));
//     }

//     // 🛡️ REDIRECT ADMINS AWAY FROM USER DASHBOARD
//     if (pathname === '/dashboard' && user.role === 'admin') {
//       return NextResponse.redirect(new URL('/admin', request.url));
//     }

//     // 🛡️ KYC GUARD
//     if (user.role !== 'admin' && user.kycTier === 0 && !pathname.startsWith('/dashboard/kyc')) {
//       return NextResponse.redirect(new URL('/dashboard/kyc', request.url));
//     }

//     const requestHeaders = new Headers(request.headers);
//     requestHeaders.set('x-user-id', user._id.toString());
//     requestHeaders.set('x-user-uid', decodedClaims.uid);
//     requestHeaders.set('x-user-email', user.email || '');
//     requestHeaders.set('x-user-role', user.role || 'user');
//     requestHeaders.set('x-user-status', user.status || 'active');
//     requestHeaders.set('x-user-kyc-tier', (user.kycTier ?? 0).toString());

//     return NextResponse.next({
//       request: { headers: requestHeaders },
//     });
    
//   } catch (error) {
//     const response = NextResponse.redirect(new URL('/login', request.url));
//     response.cookies.delete('session');
//     return response;
//   }
// }

// export const config = {
//   matcher: [
//     '/dashboard/:path*',
//     '/admin/:path*',
//     '/terminal/:path*',
//     '/markets/:path*',
//   ],
// };
