import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in .env.local."
  );
}

/**
 * Server-side Supabase client, for use in Server Components, Server
 * Actions, and Route Handlers only. Must be created fresh per request
 * (it reads the current request's cookies via next/headers), so this is a
 * function, not a shared singleton like the browser client.
 *
 * Still uses only the publishable (anon) key — RLS is what protects data,
 * not this client. Never import the service_role/secret key here.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component that can't set cookies (e.g. a
          // plain page render with no Server Action/Route Handler
          // involved). Safe to ignore as long as proxy.ts is also
          // refreshing the session, which keeps cookies in sync.
        }
      },
    },
  });
}
