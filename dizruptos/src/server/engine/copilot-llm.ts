// LLM-powered copilot layer — wraps the deterministic engine context with a
// Gemini call so answers are fluent, contextual, and conversational while
// remaining GROUNDED IN ENGINE DATA (no hallucination — the context is facts).
//
// Architecture:
//   1. deterministic engine builds `CopilotContext` from live data (unchanged)
//   2. if GEMINI_API_KEY is set, we call gemini-2.0-flash with the context
//   3. the LLM receives: (a) the deterministic answer as "ground truth",
//      (b) the full org context as structured data, (c) the question
//   4. Gemini enhances delivery but CANNOT contradict the engine evidence
//   5. fallback: if LLM call fails, return the deterministic answer as-is
//
// Free tier: 15 requests/min, 1M tokens/day — no credit card required.
// Get a key at https://aistudio.google.com/apikey

import type { CopilotContext, CopilotAnswer } from "./copilot";
import { metrics } from "@/lib/telemetry";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LLM_ENABLED = !!GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_TOKENS = 512;

interface GeminiPart { text: string }
interface GeminiContent { role: "user" | "model"; parts: GeminiPart[] }

// Exported so the copilot route can pass history as Anthropic-shaped messages
// (role: user|assistant) — we translate internally.
interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
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

async function callGemini(
  systemPrompt: string,
  question: string,
  deterministicAnswer: string,
  history: ConversationTurn[] = []
): Promise<string> {
  // Gemini uses alternating user/model roles — map assistant → model.
  const priorTurns: GeminiContent[] = history.slice(-10).map((t) => ({
    role: t.role === "assistant" ? "model" : "user",
    parts: [{ text: t.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      ...priorTurns,
      {
        role: "user",
        parts: [{ text: `${question}\n\n[Engine analysis: ${deterministicAnswer}]` }],
      },
    ],
    generationConfig: {
      maxOutputTokens: MAX_TOKENS,
      temperature: 0,
    },
  };

  const start = Date.now();
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });

  const elapsed = (Date.now() - start) / 1000;
  metrics.copilotLatency.observe(elapsed);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err}`);
  }

  const data = await res.json();

  const tokenCount =
    (data.usageMetadata?.promptTokenCount ?? 0) +
    (data.usageMetadata?.candidatesTokenCount ?? 0);
  if (tokenCount > 0) {
    metrics.llmTokens.inc({ model: MODEL }, tokenCount);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? deterministicAnswer;
}

/** Enhance a deterministic copilot answer with LLM fluency.
 *  semanticHits — top entities from TF-IDF semantic search injected into the prompt
 *  for contextual grounding beyond what the deterministic engine matched.
 *  Always falls back to the deterministic answer if LLM is unavailable or errors. */
export async function enhancedCopilotAnswer(
  question: string,
  deterministicResult: CopilotAnswer,
  ctx: CopilotContext,
  semanticHits: string[] = [],
  history: ConversationTurn[] = []
): Promise<CopilotAnswer & { llmEnhanced: boolean; semanticHits?: string[] }> {
  metrics.copilotQueries.inc({ intent: deterministicResult.intent });

  if (!LLM_ENABLED) {
    return { ...deterministicResult, llmEnhanced: false };
  }

  try {
    let systemPrompt = buildSystemPrompt(ctx);

    if (semanticHits.length > 0) {
      systemPrompt += `\n\nSEMANTIC CONTEXT (entities most relevant to this question):\n${semanticHits.map((h) => `• ${h}`).join("\n")}\nUse these only if relevant — do not force them in.`;
    }

    const llmAnswer = await callGemini(systemPrompt, question, deterministicResult.answer, history);

    return {
      ...deterministicResult,
      answer: llmAnswer,
      llmEnhanced: true,
      semanticHits: semanticHits.length > 0 ? semanticHits : undefined,
    };
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: "warn", event: "copilot_llm_fallback", ctx: { error: String(err) } }));
    return { ...deterministicResult, llmEnhanced: false };
  }
}

export { LLM_ENABLED };
