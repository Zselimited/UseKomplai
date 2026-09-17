import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in .env.local."
  );
}

/**
 * Browser-side Supabase client, for use in Client Components only.
 *
 * Uses createBrowserClient (from @supabase/ssr) instead of the plain
 * supabase-js createClient so the session is stored in cookies rather than
 * only localStorage — that's what lets Server Components, proxy.ts, and the
 * browser all agree on whether someone is logged in.
 *
 * This uses the publishable (anon) key only — safe to expose in the browser.
 * Never import the service_role/secret key into this file or any code that
 * ships to the client.
 */
export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
