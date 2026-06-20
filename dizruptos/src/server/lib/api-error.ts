// Normalized API error helper — all error responses use the same shape.
// Clients can detect errors by checking for { error: { code, message } }.

import { NextResponse } from "next/server";

export function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}
