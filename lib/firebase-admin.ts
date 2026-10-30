// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Handle both quoted and unquoted newlines in the private key
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
  : undefined;

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  console.error("❌ Firebase Admin Env Vars Missing!");
  throw new Error('Missing Firebase Admin environment variables');
}

const app = getApps().length === 0 
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    })
  : getApps()[0];

export const adminAuth = getAuth(app);
// lib/firebase-admin.ts
// import { initializeApp, getApps, cert } from 'firebase-admin/app';
// import { getAuth } from 'firebase-admin/auth';

// const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
//   throw new Error('Missing Firebase Admin environment variables');
// }

// // Initialize only once (Next.js hot reload can trigger multiple times in dev)
// const app = getApps().length === 0 
//   ? initializeApp({
//       credential: cert({
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//         privateKey: privateKey,
//       }),
//     })
//   : getApps()[0];

// export const adminAuth = getAuth(app);