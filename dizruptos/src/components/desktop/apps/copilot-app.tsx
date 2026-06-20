"use client";

// Copilot App — native OS window. Asks the /api/v1/copilot endpoint and renders
// LLM-enhanced executive answers with grounded org-intelligence context.
// Follow-up suggestion chips are generated per intent so the user always knows
// what to ask next. History persists for the session.

import { memo, useEffect, useRef, useState } from "react";
import { BrainCircuit, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopilotResponse {
  data: {
    answer: string;
    intent: string;
    confidence: number;
    evidence: string[];
    llmEnhanced?: boolean;
    semanticHits?: string[];
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  intent?: string;
  evidence?: string[];
  llmEnhanced?: boolean;
  loading?: boolean;
}

// Intent-based follow-up suggestion chips
const FOLLOW_UPS: Record<string, string[]> = {
  capacity_overview:   ["Who is most at risk of burnout?", "Which roles have headroom?", "What happens if we hire 2 more engineers?"],
  burnout_risk:        ["What tasks can we reassign?", "Show me over-allocation by department", "What's the blast radius if they leave?"],
  project_health:      ["Which projects are on track?", "What's blocking Atlas Payments?", "Show revenue at risk"],
  risk_overview:       ["What's the highest-severity risk?", "Which risks are unmitigated?", "Who owns the critical risks?"],
  recommendations:     ["How confident are these recommendations?", "What was our last recommendation accuracy?", "Show me calibration history"],
  succession:          ["Who are the single points of failure?", "What capabilities are most fragile?", "How do I reduce bus factor?"],
  decisions:           ["What assumptions underpinned our last decision?", "Which decisions were later revised?", "Show the decision lineage"],
  narrative:           ["What changed most this quarter?", "Are we getting smarter as an org?", "Show me the learning trend"],
  org_health:          ["How has org health trended?", "What's dragging the score down?", "When did health last improve?"],
  learning:            ["What's our forecast accuracy?", "What are our blind spots?", "Which recommendations failed?"],
  general:             ["Who is most overloaded?", "What are our biggest risks?", "Which projects need attention?"],
  trend_analysis:      ["How did health change last month?", "Are risks improving or worsening?", "What's the capacity trend?"],
  comparison:          ["Which recommendation has higher ROI?", "Compare team load across departments", "How do our risks compare to last quarter?"],
  aggregate:           ["Break down risks by category", "Show me capacity across all teams", "How many recommendations are unactioned?"],
  succession_overview: ["Who is most irreplaceable?", "Which capabilities have no backup?", "What's our bus factor?"],
};

function getSuggestions(intent?: string): string[] {
  if (!intent) return FOLLOW_UPS.general;
  const key = Object.keys(FOLLOW_UPS).find((k) => intent.startsWith(k));
  return FOLLOW_UPS[key ?? "general"];
}

const STARTER_PROMPTS = [
  "Who is most overloaded right now?",
  "What are our biggest risks?",
  "Which projects are at risk?",
  "What should we prioritize this week?",
  "Are there any succession risks?",
  "How is our org health trending?",
];

const HISTORY_KEY = "dz-copilot-history";
const MAX_HISTORY = 50;

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: Message[] = JSON.parse(raw);
    // Drop any stale loading messages that were saved mid-request
    return parsed.filter((m) => !m.loading).slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

export const CopilotApp = memo(function CopilotApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastIntent, setLastIntent] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const didInit = useRef(false);

  // Hydrate from localStorage on first mount
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const history = loadHistory();
    if (history.length > 0) {
      setMessages(history);
      const lastAssistant = [...history].reverse().find((m) => m.role === "assistant");
      if (lastAssistant?.intent) setLastIntent(lastAssistant.intent);
    }
  }, []);

  // Persist to localStorage whenever messages change (skip loading state)
  useEffect(() => {
    const toSave = messages.filter((m) => !m.loading);
    if (toSave.length === 0 && !didInit.current) return;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave.slice(-MAX_HISTORY))); } catch { /* storage full */ }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setLoading(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: q };
    const loadMsg: Message = { id: `l-${Date.now()}`, role: "assistant", text: "", loading: true };
    setMessages((prev) => [...prev, userMsg, loadMsg]);

    try {
      const res = await fetch(`/api/v1/copilot?q=${encodeURIComponent(q)}`, {
        headers: { "Content-Type": "application/json" },
      });
      const json: CopilotResponse = await res.json();
      const { answer, intent, evidence, llmEnhanced } = json.data;
      setLastIntent(intent);
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { id: m.id, role: "assistant", text: answer, intent, evidence, llmEnhanced }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { id: m.id, role: "assistant", text: "Intelligence engines unreachable. Try again in a moment." }
            : m
        )
      );
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant" && !m.loading);
  const suggestions = getSuggestions(lastAssistantMsg?.intent ?? lastIntent);

  return (
    <div className="flex h-full flex-col" style={{ background: "rgb(var(--ink))" }}>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(0,237,130,0.12)" }}>
          <BrainCircuit size={18} style={{ color: "#00ED82" }} />
        </div>
        <div>
          <div className="text-sm font-bold text-fg">Executive Copilot</div>
          <div className="text-xs text-fg-muted">Grounded in live org-intelligence · powered by Claude</div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setLastIntent(undefined); try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ } }}
            className="ml-auto rounded-lg border border-line px-2.5 py-1 text-xs text-fg-muted transition-colors hover:text-fg"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages or starter prompts */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(0,237,130,0.08)", border: "1px solid rgba(0,237,130,0.2)" }}>
              <Sparkles size={28} style={{ color: "#00ED82" }} />
            </div>
            <div className="text-center">
              <div className="text-base font-semibold text-fg">Ask anything about your org</div>
              <div className="mt-1 text-sm text-fg-muted">Answers are grounded in live capacity, risk, and project data</div>
            </div>
            <div className="grid w-full max-w-lg grid-cols-2 gap-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => ask(p)}
                  className="rounded-xl border border-line bg-ink-elevated px-3.5 py-2.5 text-left text-xs font-medium text-fg-secondary transition-all hover:border-brand/40 hover:bg-brand/5 hover:text-fg"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-4">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {m.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,237,130,0.12)" }}>
                    <BrainCircuit size={13} style={{ color: "#00ED82" }} />
                  </div>
                )}
                <div className={cn("max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed", m.role === "user"
                  ? "rounded-tr-sm text-white"
                  : "rounded-tl-sm border border-line bg-ink-elevated text-fg",
                )} style={m.role === "user" ? { background: "rgba(0,237,130,0.18)", border: "1px solid rgba(0,237,130,0.25)" } : {}}>
                  {m.loading ? (
                    <span aria-live="polite" aria-atomic="true" className="flex items-center gap-2 text-fg-muted">
                      <Loader2 size={13} className="animate-spin" /> Analyzing org data…
                    </span>
                  ) : (
                    <>
                      <p>{m.text}</p>
                      {m.evidence && m.evidence.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {m.evidence.slice(0, 4).map((e, i) => (
                            <span key={i} className="rounded-md border border-line/60 bg-ink px-2 py-0.5 text-[10px] text-fg-muted">
                              {e}
                            </span>
                          ))}
                          {m.llmEnhanced && (
                            <span className="flex items-center gap-1 rounded-md border border-brand/20 bg-brand/5 px-2 py-0.5 text-[10px] text-brand">
                              <Sparkles size={8} /> Claude
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Follow-up suggestion chips — shown after last assistant message */}
            {!loading && lastAssistantMsg && (
              <div className="flex flex-wrap gap-2 pb-1 pl-10">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-ink-elevated px-3 py-1.5 text-xs text-fg-secondary transition-all hover:border-brand/40 hover:bg-brand/5 hover:text-fg"
                  >
                    <ChevronRight size={11} style={{ color: "#00ED82" }} />
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-line p-4">
        <div className="flex items-end gap-3 rounded-xl border border-line bg-ink-elevated px-4 py-3 focus-within:border-brand/40">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about capacity, risks, projects, succession…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-fg placeholder:text-fg-muted focus:outline-none disabled:opacity-50"
            style={{ maxHeight: "100px", overflowY: "auto" }}
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-30"
            style={{ background: "#00ED82", color: "#021A0E" }}
            aria-label="Send"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} strokeWidth={2.5} />}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-fg-faint">Enter to send · Shift+Enter for new line · Grounded in live org data</p>
      </div>
    </div>
  );
});
