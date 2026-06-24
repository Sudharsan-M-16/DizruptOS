// POST /api/v1/import/test { source: "jira"|"linear"|"github" }
// Returns the webhook URL, expected signature header, and whether the secret is configured.
// Use this in the import UI to show connectivity status for each connector.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";

export const dynamic = "force-dynamic";

const SOURCES = ["jira", "linear", "github"] as const;
type Source = (typeof SOURCES)[number];

export async function POST(req: NextRequest) {
  return guarded(req, "import_test", async () => {
    resolvePrincipal(req); // auth required
    const body = await req.json().catch(() => ({}));
    const source = body?.source as Source | undefined;
    if (!source || !SOURCES.includes(source)) {
      return fail(422, "INVALID_INPUT", `source must be one of: ${SOURCES.join(", ")}`);
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dizrupt.com";
    const configs: Record<Source, { url: string; headerName: string; envKey: string }> = {
      jira:   { url: `${baseUrl}/api/v1/import/jira`,   headerName: "x-atlassian-token",      envKey: "JIRA_WEBHOOK_SECRET" },
      linear: { url: `${baseUrl}/api/v1/import/linear`, headerName: "linear-signature",        envKey: "LINEAR_WEBHOOK_SECRET" },
      github: { url: `${baseUrl}/api/v1/import/github`, headerName: "x-hub-signature-256",     envKey: "GITHUB_WEBHOOK_SECRET" },
    };
    const cfg = configs[source];
    const secretConfigured = !!process.env[cfg.envKey];
    return ok({
      source,
      webhookUrl: cfg.url,
      signatureHeader: cfg.headerName,
      secretConfigured,
      status: secretConfigured ? "ready" : "missing_secret",
      instructions: secretConfigured
        ? `Webhook URL is active. Set this URL in ${source}: ${cfg.url}`
        : `Set ${cfg.envKey} env var, then configure webhook URL in ${source}: ${cfg.url}`,
    });
  });
}
