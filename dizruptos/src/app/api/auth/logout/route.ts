// POST /api/auth/logout — revoke the session cookie.
// Production: also mark the sessions row is_active=false and call
// supabase.auth.admin.signOut for the user.

import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dz_session", "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
