// robots.txt — prevent search indexing of the app shell.
// The landing page (/welcome) and login (/login) are indexable;
// the OS desktop (/) and API routes are private.

import { type NextRequest } from "next/server";

export const dynamic = "force-static";

export function GET(_req: NextRequest) {
  const body = `User-agent: *
Allow: /welcome
Allow: /login
Disallow: /
Disallow: /api/

Sitemap: https://dizrupt.ai/sitemap.xml
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
