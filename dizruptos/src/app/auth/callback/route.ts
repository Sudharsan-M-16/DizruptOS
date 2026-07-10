// Supabase Auth callback — the redirect target after a magic-link / OAuth sign
// in. Exchanges the `code` for a session and sets the httpOnly cookies, then
// sends the user to the desktop (where DizruptOS boots). Env-gated: with no
// Supabase config this route 404-equivalents back to the demo login, so the
// demo flow is never affected.

import { NextResponse, type NextRequest } from "next/server";
import { isAuthConfigured, serverClient } from "@/lib/auth-supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  // Demo mode (or misconfigured) — nothing to exchange; go to the demo login.
  if (!isAuthConfigured || !code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const res = NextResponse.redirect(new URL(next, url.origin));
  const supabase = serverClient({
    getAll: () => req.cookies.getAll(),
    setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
  });
  if (!supabase) return NextResponse.redirect(new URL("/login", url.origin));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }
  return res;
}
