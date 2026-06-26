// GET /api/v1/copilot?q= — the graph-grounded executive advisor. Deterministic;
// answers from the live engines/memory with evidence + source (no hallucination).
import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { askCopilot } from "@/server/services/intelligence-loader";
import { guarded, ok, fail, principalView } from "@/server/api";
import { log } from "@/server/lib/logger";
import { withSpan } from "@/lib/telemetry";
import { CopilotQuerySchema, parseBody } from "@/lib/schemas";
export const dynamic = "force-dynamic";

// In-process answer cache — 60s TTL. Eliminates duplicate LLM calls when the
// same question is asked twice in a demo session. Keys on normalised question
// string; never persisted across restarts. Max 50 entries; LRU eviction.
type CopilotResult = Awaited<ReturnType<typeof askCopilot>>;
const answerCache = new Map<string, { result: CopilotResult; ts: number }>();
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 50;

function getCached(q: string): CopilotResult | null {
  const key = q.toLowerCase().trim();
  const entry = answerCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.result;
  answerCache.delete(key); // expired — remove eagerly
  return null;
}

function setCached(q: string, result: CopilotResult): void {
  const key = q.toLowerCase().trim();
  answerCache.set(key, { result, ts: Date.now() });
  if (answerCache.size > CACHE_MAX) {
    // Evict the oldest entry
    const oldest = [...answerCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) answerCache.delete(oldest[0]);
  }
}

// GET /api/v1/copilot?q= — stateless single-turn (kept for E2E + backward compat)
export async function GET(req: NextRequest) {
  return guarded(req, "api_copilot", async () => {
    const principal = resolvePrincipal(req);
    const q = req.nextUrl.searchParams.get("q");
    if (!q) return fail(422, "INVALID_INPUT", "q (question) required");
    const requestId = req.headers.get("x-request-id") ?? undefined;
    return withSpan("copilot.answer", { "copilot.q_length": q.length, principal: principal.role }, async () => {
      try {
        const cached = getCached(q);
        if (cached) {
          log("info", "copilot_cache_hit", { intent: cached.intent, requestId });
          return ok(cached, { ...principalView(principal) });
        }
        const result = await askCopilot(q);
        setCached(q, result);
        log("info", "copilot_answered", { intent: result.intent, requestId });
        return ok(result, { ...principalView(principal) });
      } catch (err) {
        log("error", "copilot_failed", { err: String(err), requestId });
        throw err;
      }
    });
  });
}

// POST /api/v1/copilot — multi-turn with conversation history (not cached —
// history context makes each turn unique)
export async function POST(req: NextRequest) {
  return guarded(req, "api_copilot", async () => {
    const principal = resolvePrincipal(req);
    let raw: unknown;
    try { raw = await req.json(); } catch { return fail(400, "INVALID_INPUT", "Invalid JSON body."); }
    const parsed = parseBody(CopilotQuerySchema, raw);
    if ("error" in parsed) return fail(422, "INVALID_INPUT", parsed.error);
    const { q, history } = parsed.data;
    const requestId = req.headers.get("x-request-id") ?? undefined;
    return withSpan("copilot.answer", { "copilot.q_length": q.length, "copilot.history_turns": history?.length ?? 0, principal: principal.role }, async () => {
      try {
        const result = await askCopilot(q, history ?? []);
        log("info", "copilot_answered", { intent: result.intent, historyTurns: history?.length ?? 0, requestId });
        return ok(result, { ...principalView(principal) });
      } catch (err) {
        log("error", "copilot_failed", { err: String(err), requestId });
        throw err;
      }
    });
  });
}
