// GET /.well-known/security.txt — RFC 9116 security disclosure policy.
// This tells security researchers where to report vulnerabilities.
// Absence of this file is flagged by automated security scanners (Qualys, Burp, etc.)

import { NextResponse } from "next/server";

export function GET() {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const body = [
    "Contact: mailto:security@dizrupt.com",
    `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, "Z")}`,
    "Encryption: https://dizrupt.com/.well-known/pgp-key.txt",
    "Preferred-Languages: en",
    "Canonical: https://app.dizrupt.com/.well-known/security.txt",
    "Policy: https://dizrupt.com/security-policy",
    "Acknowledgments: https://dizrupt.com/security/hall-of-fame",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
