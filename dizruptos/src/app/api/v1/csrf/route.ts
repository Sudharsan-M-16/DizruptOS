// GET /api/v1/csrf — issue (or return the existing) CSRF token.
// The token is stored in a non-httpOnly cookie so the client JS can read it
// and send it in the x-csrf-token header on subsequent mutating requests.
// Middleware validates that the header matches the cookie (double-submit pattern).

import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const existing = req.cookies.get("csrf_token")?.value;
  const token = existing ?? crypto.randomUUID();
  const res = NextResponse.json({ token });
  if (!existing) {
    res.cookies.set("csrf_token", token, {
      httpOnly: false, // must be readable by JS so we can include it in request headers
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
  }
  return res;
}
