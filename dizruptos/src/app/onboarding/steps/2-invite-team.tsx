"use client";

import * as React from "react";
import { UserPlus, ArrowRight, ArrowLeft, CheckCircle2, X } from "lucide-react";
import type { StepProps } from "../page";

const BRAND_GREEN = "#00ED82";
const BRAND_TEAL = "#00D9D5";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "executive", label: "Executive" },
  { value: "dept_head", label: "Dept Head" },
  { value: "project_manager", label: "Project Manager" },
  { value: "team_lead", label: "Team Lead" },
  { value: "employee", label: "Employee" },
];

export function StepInviteTeam({ state, updateState, onNext, onBack }: StepProps) {
  const [emailInput, setEmailInput] = React.useState("");
  const [role, setRole] = React.useState("employee");
  const [invites, setInvites] = React.useState<Array<{ email: string; role: string; sent: boolean; error?: string }>>([]);
  const [sending, setSending] = React.useState(false);
  const [allSent, setAllSent] = React.useState(false);

  const addEmail = () => {
    const emails = emailInput.split(/[\s,;]+/).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (!emails.length) return;
    setInvites((prev) => {
      const existing = new Set(prev.map((i) => i.email));
      return [...prev, ...emails.filter((e) => !existing.has(e)).map((e) => ({ email: e, role, sent: false }))];
    });
    setEmailInput("");
  };

  const removeInvite = (email: string) => setInvites((prev) => prev.filter((i) => i.email !== email));

  const sendAll = async () => {
    const pending = invites.filter((i) => !i.sent);
    if (!pending.length) { onNext(); return; }
    setSending(true);
    const results = await Promise.allSettled(
      pending.map((inv) =>
        fetch("/api/v1/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inv.email, role: inv.role }),
        }).then(async (res) => {
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.message ?? "Failed");
          }
          return inv.email;
        })
      )
    );
    setInvites((prev) => prev.map((inv) => {
      const r = results.find((_, i) => pending[i]?.email === inv.email);
      if (!r) return inv;
      return r.status === "fulfilled"
        ? { ...inv, sent: true }
        : { ...inv, error: r.reason?.message ?? "Failed" };
    }));
    setSending(false);
    setAllSent(true);
    const sentCount = results.filter((r) => r.status === "fulfilled").length;
    updateState({ invitedEmails: [...state.invitedEmails, ...pending.slice(0, sentCount).map((i) => i.email)] });
  };

  const handleNext = async () => {
    if (invites.some((i) => !i.sent) && !allSent) {
      await sendAll();
    } else {
      onNext();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>Step 2 of 5</span>
        </div>
        <h2 className="mb-1.5 text-[1.75rem] font-light tracking-tight" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>
          Invite your <em style={{ fontStyle: "italic" }}>team</em>.
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(160,200,195,0.75)" }}>
          Add colleagues by email. They&apos;ll receive an invitation link. You can skip this step and invite people later from the Admin Console.
        </p>
      </div>

      {/* Email + role input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <UserPlus size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(0,200,195,0.55)" }} />
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={addEmail}
              placeholder="colleague@company.com, ..."
              className="h-11 w-full rounded-lg pl-10 pr-4 text-[13px] focus:outline-none"
              style={{
                background: "rgba(0,180,170,0.06)",
                border: "1px solid rgba(0,200,195,0.18)",
                color: "rgba(200,240,235,0.9)",
              }}
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-11 rounded-lg px-3 text-[12px] focus:outline-none"
            style={{
              background: "rgba(0,180,170,0.08)",
              border: "1px solid rgba(0,200,195,0.18)",
              color: "rgba(200,240,235,0.9)",
              minWidth: "120px",
            }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addEmail}
            className="h-11 rounded-lg px-4 text-[12px] font-semibold transition-all hover:brightness-110"
            style={{ background: "rgba(0,200,195,0.12)", border: "1px solid rgba(0,200,195,0.3)", color: BRAND_TEAL }}
          >
            Add
          </button>
        </div>
        <p className="text-[11px]" style={{ color: "rgba(100,160,155,0.6)" }}>Press Enter or comma to add multiple emails at once</p>
      </div>

      {/* Invite list */}
      {invites.length > 0 && (
        <div className="space-y-1.5 rounded-xl p-3" style={{ background: "rgba(0,180,170,0.04)", border: "1px solid rgba(0,200,195,0.1)" }}>
          {invites.map((inv) => (
            <div key={inv.email} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px]" style={{ color: inv.sent ? "rgba(0,237,130,0.9)" : "#E8FFFC" }}>{inv.email}</div>
                {inv.error && <div className="text-[11px]" style={{ color: "#FCA5A5" }}>{inv.error}</div>}
              </div>
              <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(0,200,195,0.1)", color: BRAND_TEAL }}>
                {inv.role.replace(/_/g, " ")}
              </span>
              {inv.sent ? (
                <CheckCircle2 size={14} style={{ color: BRAND_GREEN, flexShrink: 0 }} />
              ) : (
                <button onClick={() => removeInvite(inv.email)} className="shrink-0" aria-label={`Remove ${inv.email}`}>
                  <X size={13} style={{ color: "rgba(239,68,68,0.6)" }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center gap-2 rounded-lg px-4 text-[13px] font-medium transition-all hover:brightness-110"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(200,240,235,0.7)" }}
        >
          <ArrowLeft size={14} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={sending}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-bold tracking-wide transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: BRAND_GREEN, color: "#021A0E" }}
        >
          {sending ? "Sending invites…" : invites.length > 0 && !allSent ? "Send invites & continue" : "Continue"}
          <ArrowRight size={15} />
        </button>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full text-center text-[12px] transition-colors hover:text-white"
        style={{ color: "rgba(100,160,155,0.6)" }}
      >
        Skip — invite people later
      </button>
    </div>
  );
}
