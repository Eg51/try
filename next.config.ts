// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin'; // 👈 Imported

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  
  // Treat Firebase and Mongoose as external packages
  serverExternalPackages: ["firebase-admin", "mongoose", "jwks-rsa", "jose"],
  
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

// 👇 Wrap the config with the plugin
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

// // next.config.ts
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   cacheComponents: true,
//   partialPrefetching: true,
  
//   // 👇 ADDED MONGOOSE HERE
//   serverExternalPackages: ["firebase-admin", "mongoose", "jwks-rsa", "jose"],
  
//   turbopack: {
//     rules: {
//       "*.css": {
//         loaders: ["@tailwindcss/turbopack"],
//         as: "*.css",
//       },
//     },
//   },

//   async headers() {
//     return [
//       {
//         source: "/(.*)",
//         headers: [
//           {
//             key: "Cross-Origin-Opener-Policy",
//             value: "same-origin-allow-popups",
//           },
//         ],
//       },
//     ];
//   },
// };

// export default nextConfig;


// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   cacheComponents: true,
//   partialPrefetching: true,
  
//   // FIX: Tell Next.js to treat Firebase and its dependencies as external packages
//   serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
  
//   turbopack: {
//     rules: {
//       "*.css": {
//         loaders: ["@tailwindcss/turbopack"],
//         as: "*.css",
//       },
//     },
//   },

//   // ADD THIS BLOCK: Fixes the Firebase popup COOP issue
//   async headers() {
//     return [
//       {
//         source: "/(.*)",
//         headers: [
//           {
//             key: "Cross-Origin-Opener-Policy",
//             value: "same-origin-allow-popups",
//           },
//         ],
//       },
//     ];
//   },
// };

// export default nextConfig;