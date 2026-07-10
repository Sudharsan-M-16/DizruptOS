"use client";

import * as React from "react";
import { Building2, ArrowRight } from "lucide-react";
import type { StepProps } from "../page";

const BRAND_GREEN = "#00ED82";
const BRAND_TEAL = "#00D9D5";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export function StepOrgName({ state, updateState, onNext }: StepProps) {
  const [name, setName] = React.useState(state.orgName);
  const [slug, setSlug] = React.useState(state.orgSlug);
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const slugValid = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(slug);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) setSlug(toSlug(val));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slugValid) return;
    setSubmitting(true);
    setError(null);

    // If org already created (revisiting step), skip
    if (state.orgId) { updateState({ orgName: name, orgSlug: slug }); onNext(); return; }

    try {
      const res = await fetch("/api/v1/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed to create organization.");
      updateState({ orgId: data.data.id, orgName: data.data.name, orgSlug: data.data.slug });
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>Step 1 of 5</span>
        </div>
        <h2 className="mb-1.5 text-[1.75rem] font-light tracking-tight" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>
          Name your <em style={{ fontStyle: "italic" }}>organization</em>.
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(160,200,195,0.75)" }}>
          This is your company workspace in DIZRUPT. You can change it later.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "rgba(0,200,195,0.8)" }}>
            Organization name
          </label>
          <div className="relative flex items-center">
            <Building2 size={14} className="absolute left-3.5" style={{ color: "rgba(0,200,195,0.55)" }} />
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Corp"
              required
              autoFocus
              maxLength={80}
              className="h-11 w-full rounded-lg pl-10 pr-4 text-[14px] focus:outline-none"
              style={{
                background: "rgba(0,180,170,0.06)",
                border: `1px solid ${name ? "rgba(0,200,195,0.3)" : "rgba(0,200,195,0.15)"}`,
                color: "rgba(200,240,235,0.9)",
              }}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "rgba(0,200,195,0.8)" }}>
            URL slug
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[13px]" style={{ color: "rgba(100,160,155,0.6)" }}>dizrupt.app/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugEdited(true); }}
              placeholder="acme-corp"
              required
              maxLength={32}
              className="h-11 flex-1 rounded-lg px-3.5 text-[14px] focus:outline-none"
              style={{
                background: "rgba(0,180,170,0.06)",
                border: `1px solid ${slug && !slugValid ? "rgba(239,68,68,0.4)" : slug ? "rgba(0,200,195,0.3)" : "rgba(0,200,195,0.15)"}`,
                color: "rgba(200,240,235,0.9)",
              }}
            />
          </div>
          {slug && !slugValid && (
            <p className="mt-1 text-[11px]" style={{ color: "#FCA5A5" }}>
              3–32 chars, lowercase letters, numbers, and hyphens only.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg px-3 py-2.5 text-[13px]"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !name.trim() || !slugValid}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-bold tracking-wide transition-all duration-150 hover:brightness-110 disabled:opacity-50"
        style={{ background: BRAND_GREEN, color: "#021A0E" }}
      >
        {submitting ? "Creating…" : "Continue"}
        <ArrowRight size={15} />
      </button>
    </form>
  );
}
