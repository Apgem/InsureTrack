import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";
import { getEntitlement } from "@/lib/subscription";

// Authenticated app areas (route group (dashboard) has no URL prefix).
const APP_PREFIXES = [
  "/dashboard",
  "/clients",
  "/leads",
  "/renewals",
  "/sequences",
  "/settings",
];
const BILLING_PATH = "/settings/billing";

function isAppRoute(pathname: string) {
  return APP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/**
 * Refreshes the Supabase auth session on every request and enforces route
 * protection + the billing paywall. Called from the root middleware.ts.
 *
 * - Unauthenticated users hitting an app route are redirected to /login.
 * - Authenticated users hitting /login or /signup are redirected to /dashboard.
 * - Authenticated users whose trial has expired / subscription lapsed are sent
 *   to /settings/billing (which stays reachable so they can pay).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser() —
  // it can cause hard-to-debug session-refresh issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isProtectedRoute = isAppRoute(pathname);

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Paywall: block lapsed accounts from the app, but always let them reach
  // the billing page (and its API) to resubscribe.
  if (user && isProtectedRoute && pathname !== BILLING_PATH) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at")
      .eq("id", user.id)
      .single();

    if (profile && !getEntitlement(profile).entitled) {
      const url = request.nextUrl.clone();
      url.pathname = BILLING_PATH;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
