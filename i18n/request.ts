import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'en';

  let messages;
  try {
    // 1. Try to load locally first
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (e) {
    // 2. If it fails, try to fetch from the web
    try {
      const res = await fetch(`https://your-cdn.com/${locale}.json`);
      messages = await res.json();
    } catch (fetchError) {
      // 3. Final fallback to English
      messages = (await import(`../messages/en.json`)).default;
    }
  }

  return { locale, messages };
});
// //i18n/request.ts
// import { getRequestConfig } from 'next-intl/server';
// import { cookies } from 'next/headers';

// export default getRequestConfig(async () => {
//   // 1. Await the cookies (Next.js 15+ requirement)
//   const cookieStore = await cookies();
  
//   // 2. Read the locale cookie, fallback to 'en'
//   const locale = cookieStore.get('locale')?.value || 'en';

//   return {
//     locale,
//     messages: (await import(`../messages/${locale}.json`)).default
//   };
// });