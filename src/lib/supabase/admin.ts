import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS entirely. This is ONLY safe
 * because this file is imported exclusively by the cron route
 * (src/app/api/cron/send-reminders/route.ts), which runs server-side on
 * Vercel and is never bundled into client-side JavaScript.
 *
 * NEVER import this from a Client Component, a file under src/app that
 * isn't a Route Handler, or anywhere reachable from the browser. The
 * publishable/anon key (see client.ts / server.ts) is what the rest of
 * the app uses — RLS is the real access boundary everywhere else.
 *
 * SUPABASE_SERVICE_ROLE_KEY is deliberately NOT prefixed with
 * NEXT_PUBLIC_ — Next.js only inlines NEXT_PUBLIC_ vars into client
 * bundles, so this name keeps the secret server-only by construction.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY are set (server-side only — never NEXT_PUBLIC_)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
