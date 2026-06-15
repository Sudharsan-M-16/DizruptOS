// LLM-powered copilot layer — wraps the deterministic engine context with a
// Claude call so answers are fluent, contextual, and conversational while
// remaining GROUNDED IN ENGINE DATA (no hallucination — the context is facts).
//
// Architecture:
//   1. deterministic engine builds `CopilotContext` from live data (unchanged)
//   2. if ANTHROPIC_API_KEY is set, we call Claude claude-sonnet-4-6 with the context
//   3. the LLM receives: (a) the deterministic answer as "ground truth",
//      (b) the full org context as structured data, (c) the question
//   4. Claude enhances delivery but CANNOT contradict the engine evidence
//   5. fallback: if LLM call fails, return the deterministic answer as-is
//
// This means the product is always correct; the LLM only improves phrasing + depth.

import type { CopilotContext, CopilotAnswer } from "./copilot";
import { metrics } from "@/lib/telemetry";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const LLM_ENABLED = !!ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 512;
const TEMPERATURE = 0;  // Zero temperature — we want grounded, consistent answers.

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  system: string;
  messages: AnthropicMessage[];
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  usage?: { input_tokens: number; output_tokens: number };
  error?: { message: string };
}

function buildSystemPrompt(ctx: CopilotContext): string {
  const healthSummary = `Org health: ${ctx.health.score}/100 (${ctx.health.band}). Top concerns: ${ctx.health.topConcerns.join(", ") || "none"}.`;

  const topRecs = ctx.recommendations.slice(0, 3).map((r, i) =>
    `${i + 1}. [${r.impact?.toUpperCase()}] ${r.title} — ${r.rationale}`
  ).join("\n");

  const topRisks = ctx.risks.slice(0, 3).map((r) => `• ${r.title} (${r.band})`).join("\n");

  const fragile = ctx.capabilities.filter((c) => c.fragile).map((c) =>
    `${c.name} (bus-factor ${c.busFactor}, ${c.strategicImportance} importance)`
  ).join(", ");

  const singlePoints = ctx.succession.map((s) => `${s.userName}: ${s.capabilities.join(", ")}`).join("; ");

  const learningSection = ctx.learning ? `
Learning & calibration:
- Avg accuracy: ${ctx.learning.avgAccuracy != null ? Math.round(ctx.learning.avgAccuracy * 100) + "%" : "not yet measured"}
- Calibration gap: ${ctx.learning.calibrationGap != null ? Math.round(ctx.learning.calibrationGap * 100) + "%" : "unknown"}
- Blind spots: ${ctx.learning.blindSpots.join(", ") || "none detected"}
- Best outcomes: ${ctx.learning.bestDecisions.map((d) => d.title).join(", ") || "none measured"}
` : "";

  return `You are DIZRUPT's Executive Intelligence Copilot — a strategic advisor grounded exclusively in computed organizational data. You do NOT speculate or invent; you explain and synthesize what the org-intelligence engines have computed.

ORGANIZATIONAL CONTEXT (authoritative — do not contradict):
${healthSummary}

Top recommendations:
${topRecs || "None currently."}

Top risks:
${topRisks || "None currently."}

Fragile capabilities: ${fragile || "none"}
Single points of failure: ${singlePoints || "none"}
${learningSection}
RULES:
- Ground every statement in the data above. Never invent numbers, names, or trends.
- If the data doesn't support an answer, say so — the org hasn't generated that signal yet.
- Be direct, executive-grade, and concise (2-4 sentences max unless the question is complex).
- Do not use bullet points unless listing more than 3 items.
- Address the executive as "you" / "your org" — not "the organization".
- End with one concrete next action when appropriate.`;
}

async function callClaude(
  systemPrompt: string,
  question: string,
  deterministicAnswer: string
): Promise<string> {
  const request: AnthropicRequest = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `${question}\n\n[Engine analysis: ${deterministicAnswer}]`,
      },
    ],
  };

  const start = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(8000),  // 8s timeout — never block a user longer
  });

  const elapsed = (Date.now() - start) / 1000;
  metrics.copilotLatency.observe(elapsed);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err}`);
  }

  const data: AnthropicResponse = await res.json();

  if (data.usage) {
    const total = (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0);
    metrics.llmTokens.inc({ model: MODEL }, total);
  }

  return data.content?.[0]?.text?.trim() ?? deterministicAnswer;
}

/** Enhance a deterministic copilot answer with LLM fluency.
 *  Always falls back to the deterministic answer if LLM is unavailable or errors. */
export async function enhancedCopilotAnswer(
  question: string,
  deterministicResult: CopilotAnswer,
  ctx: CopilotContext
): Promise<CopilotAnswer & { llmEnhanced: boolean }> {
  metrics.copilotQueries.inc({ intent: deterministicResult.intent });

  if (!LLM_ENABLED) {
    return { ...deterministicResult, llmEnhanced: false };
  }

  try {
    const systemPrompt = buildSystemPrompt(ctx);
    const llmAnswer = await callClaude(systemPrompt, question, deterministicResult.answer);

    return {
      ...deterministicResult,
      answer: llmAnswer,
      llmEnhanced: true,
    };
  } catch (err) {
    // LLM failure is never fatal — fall through to deterministic answer.
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: "warn", event: "copilot_llm_fallback", ctx: { error: String(err) } }));
    return { ...deterministicResult, llmEnhanced: false };
  }
}

export { LLM_ENABLED };
