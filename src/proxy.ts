import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Note: Next.js 16 renamed the middleware.ts convention to proxy.ts — the
// exported function is named `proxy`, not `middleware`. Everything else
// (matcher, NextRequest/NextResponse) works the same way it always did.
//
// This is an "optimistic" first line of defense: it stops an obviously
// unauthenticated visitor before a protected page even renders. Every
// protected page ALSO checks auth itself (see the Data Access Layer /
// per-page checks in dashboard, onboarding, and start) — proxy is never
// the only guard, per Next.js's own guidance.

const PROTECTED_PATHS = ["/dashboard", "/onboarding", "/start"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() (not getSession()) — it validates the token against Supabase
  // Auth rather than trusting whatever is sitting in the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PATHS.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and image optimization files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
