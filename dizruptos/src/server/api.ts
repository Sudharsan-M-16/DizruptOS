// Shared API plumbing for /api/v1 — one envelope, one error contract.
//
// Every v1 route is: resolvePrincipal → (permission check) → repository work
// → ok(envelope). Errors map deterministically: AuthzError → 401/403,
// RepositoryError NOT_FOUND → 404, INVALID_INPUT → 422, everything else → 500
// with a structured log and no internals leaked to the client.

import { NextResponse, type NextRequest } from "next/server";
import { AuthzError, type Principal } from "@/server/services/authz";
import { RepositoryError } from "@/server/repositories";
import { log } from "@/lib/logger";

export interface Envelope<T> {
  apiVersion: "v1";
  backend?: string;
  principal?: { id: string; role: string };
  count?: number;
  data: T;
}

export function ok<T>(data: T, extra?: Partial<Envelope<T>>, init?: ResponseInit) {
  const body: Envelope<T> = { apiVersion: "v1", data, ...extra };
  if (Array.isArray(data) && body.count === undefined) body.count = data.length;
  return NextResponse.json(body, init);
}

export function fail(status: number, code: string, message?: string) {
  return NextResponse.json({ apiVersion: "v1", code, message }, { status });
}

export function principalView(p: Principal) {
  return { principal: { id: p.id, role: p.role } };
}

/** Wrap a route handler with the canonical error mapping + observability.
 *  Every request gets a correlation id (honored from an upstream `x-request-id`
 *  header or freshly minted), echoed on the response and stamped on a single
 *  structured log line with method, path, status and duration — the seam a
 *  production OTel/Sentry exporter plugs into without touching call sites. */
export async function guarded(
  req: NextRequest,
  name: string,
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  const reqId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const start = performance.now();

  const finish = (
    res: NextResponse,
    level: "info" | "warn" | "error",
    extra?: Record<string, unknown>
  ) => {
    res.headers.set("x-request-id", reqId);
    log[level](`api_${name}`, {
      reqId,
      method: req.method,
      path: req.nextUrl?.pathname,
      status: res.status,
      ms: Math.round(performance.now() - start),
      ...extra,
    });
    return res;
  };

  try {
    return finish(await fn(), "info");
  } catch (err) {
    if (err instanceof AuthzError) return finish(fail(err.status, err.code), "warn");
    if (err instanceof RepositoryError) {
      if (err.code === "NOT_FOUND") return finish(fail(404, err.code, err.message), "warn");
      if (err.code === "INVALID_INPUT") return finish(fail(422, err.code, err.message), "warn");
      if (err.code === "CONFLICT") return finish(fail(409, err.code, err.message), "warn");
      return finish(fail(503, err.code, "Storage unavailable."), "error");
    }
    return finish(fail(500, "INTERNAL", "Request failed."), "error", { error: String(err) });
  }
}
