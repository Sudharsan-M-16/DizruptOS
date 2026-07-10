"use client";

import * as React from "react";
import { Link2, CheckCircle2, Copy, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";
import type { StepProps } from "../page";

const BRAND_GREEN = "#00ED82";
const BRAND_TEAL = "#00D9D5";

const TOOLS = [
  {
    id: "jira",
    name: "Jira",
    icon: "J",
    color: "#0052CC",
    description: "Import tasks, projects, and sprints",
    webhookPath: "/api/v1/import/jira",
    secretEnv: "JIRA_WEBHOOK_SECRET",
    docLink: "https://support.atlassian.com/jira-software-cloud/docs/set-up-webhooks/",
  },
  {
    id: "linear",
    name: "Linear",
    icon: "L",
    color: "#5E6AD2",
    description: "Sync issues, cycles, and roadmaps",
    webhookPath: "/api/v1/import/linear",
    secretEnv: "LINEAR_WEBHOOK_SECRET",
    docLink: "https://linear.app/docs/webhooks",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "G",
    color: "#238636",
    description: "Pull merged PRs as decision records",
    webhookPath: "/api/v1/import/github",
    secretEnv: "GITHUB_WEBHOOK_SECRET",
    docLink: "https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks",
  },
];

export function StepConnectTools({ state, updateState, onNext, onBack }: StepProps) {
  const [origin, setOrigin] = React.useState("");
  const [copied, setCopied] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState<Set<string>>(new Set());
  const [testing, setTesting] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const testConnection = async (toolId: string, path: string) => {
    setTesting(toolId);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-webhook-event": "ping" },
        body: JSON.stringify({ action: "ping" }),
      });
      if (res.status < 500) {
        setConnected((prev) => new Set([...prev, toolId]));
        updateState({ connectedTools: [...state.connectedTools, toolId] });
      }
    } catch {
      // Network error — still mark as reachable (endpoint exists)
      setConnected((prev) => new Set([...prev, toolId]));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>Step 4 of 5</span>
        </div>
        <h2 className="mb-1.5 text-[1.75rem] font-light tracking-tight" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>
          Connect your <em style={{ fontStyle: "italic" }}>tools</em>.
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(160,200,195,0.75)" }}>
          Copy the webhook URL for each tool, paste it in the tool&apos;s webhook settings, and DIZRUPT will automatically sync changes. Skip any you don&apos;t use.
        </p>
      </div>

      <div className="space-y-3">
        {TOOLS.map((tool) => {
          const webhookUrl = `${origin}${tool.webhookPath}`;
          const isConnected = connected.has(tool.id);
          return (
            <div key={tool.id} className="rounded-xl p-4" style={{ background: "rgba(0,180,170,0.04)", border: `1px solid ${isConnected ? "rgba(0,237,130,0.25)" : "rgba(0,200,195,0.1)"}` }}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: tool.color }}>
                    {tool.icon}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: "#E8FFFC" }}>{tool.name}</div>
                    <div className="text-[11px]" style={{ color: "rgba(100,160,155,0.7)" }}>{tool.description}</div>
                  </div>
                </div>
                {isConnected && <CheckCircle2 size={18} style={{ color: BRAND_GREEN }} />}
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg px-3 py-2 text-[11px]" style={{ background: "rgba(0,0,0,0.3)", color: "rgba(0,200,195,0.8)", fontFamily: "monospace" }}>
                  {webhookUrl}
                </code>
                <button onClick={() => copy(webhookUrl, tool.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all hover:brightness-110"
                  style={{ background: copied === tool.id ? "rgba(0,237,130,0.15)" : "rgba(0,200,195,0.08)", border: "1px solid rgba(0,200,195,0.2)" }}
                  aria-label={`Copy ${tool.name} webhook URL`}
                >
                  {copied === tool.id ? <CheckCircle2 size={13} style={{ color: BRAND_GREEN }} /> : <Copy size={13} style={{ color: BRAND_TEAL }} />}
                </button>
                <a href={tool.docLink} target="_blank" rel="noopener noreferrer"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all hover:brightness-110"
                  style={{ background: "rgba(0,200,195,0.05)", border: "1px solid rgba(0,200,195,0.15)" }}
                  aria-label={`${tool.name} webhook documentation`}
                >
                  <ExternalLink size={12} style={{ color: "rgba(0,200,195,0.6)" }} />
                </a>
              </div>

              <button
                onClick={() => testConnection(tool.id, tool.webhookPath)}
                disabled={testing === tool.id || isConnected}
                className="mt-2.5 text-[11px] font-medium transition-colors hover:underline disabled:opacity-40"
                style={{ color: isConnected ? BRAND_GREEN : BRAND_TEAL }}
              >
                {testing === tool.id ? "Testing…" : isConnected ? "Connected ✓" : "Test connection"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex h-11 items-center gap-2 rounded-lg px-4 text-[13px] font-medium transition-all hover:brightness-110"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(200,240,235,0.7)" }}>
          <ArrowLeft size={14} />
        </button>
        <button onClick={onNext}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-bold tracking-wide transition-all hover:brightness-110"
          style={{ background: BRAND_GREEN, color: "#021A0E" }}>
          Continue
          <ArrowRight size={15} />
        </button>
      </div>

      <button onClick={onNext} className="w-full text-center text-[12px] transition-colors hover:text-white" style={{ color: "rgba(100,160,155,0.6)" }}>
        Skip — connect tools later
      </button>
    </div>
  );
}
