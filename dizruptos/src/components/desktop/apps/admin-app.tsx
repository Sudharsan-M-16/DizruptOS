"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, RefreshCw, Shield, Trash2, Users, Wifi, WifiOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "tenants" | "sso" | "scim" | "audit" | "failed-imports";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  suspended_at: string | null;
  created_at: string;
}

interface AuditEntry {
  id: string;
  actorId: string;
  actorRole: string;
  actionType: string;
  entityLabel: string;
  at: string;
}

interface DeadLetter {
  jobId: string;
  entity: string;
  source: string;
  attempts: number;
  maxAttempts: number;
  lastError: string;
  deadLettered: boolean;
}

function TabBtn({ id, active, label, icon: Icon, onClick }: {
  id: Tab; active: boolean; label: string; icon: React.ElementType; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-[#F59E0B]/15 text-[#F59E0B]"
          : "text-fg-muted hover:bg-ink-elevated hover:text-fg"
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", ok ? "bg-ok" : "bg-danger")}
    />
  );
}

// ── Tenants tab ───────────────────────────────────────────────────────────────
function TenantsTab() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/tenants");
      if (res.ok) {
        const data = await res.json();
        setTenants(data.data?.tenants ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string, isSuspended: boolean) => {
    setToggling(id);
    try {
      await fetch(`/api/v1/admin/tenants/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: !isSuspended }),
      });
      await load();
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <Spinner />;
  if (!tenants.length) return <Empty icon={Users} label="No tenants found" />;

  return (
    <div className="space-y-2">
      {tenants.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-xl border border-line bg-ink-elevated px-4 py-3"
        >
          <StatusDot ok={!t.suspended_at} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{t.name}</span>
              <span className="rounded-full border border-line px-1.5 py-0.5 font-mono text-2xs text-fg-muted">
                {t.slug}
              </span>
              <span className="rounded-full border border-line px-1.5 py-0.5 text-2xs text-fg-muted">
                {t.plan}
              </span>
            </div>
            <p className="mt-0.5 text-2xs text-fg-faint">
              {t.suspended_at ? `Suspended ${new Date(t.suspended_at).toLocaleDateString()}` : `Since ${new Date(t.created_at).toLocaleDateString()}`}
            </p>
          </div>
          <button
            onClick={() => toggle(t.id, !!t.suspended_at)}
            disabled={toggling === t.id}
            className={cn(
              "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
              t.suspended_at
                ? "border-ok/30 bg-ok/10 text-ok hover:bg-ok/20"
                : "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20"
            )}
          >
            {toggling === t.id ? "…" : t.suspended_at ? "Activate" : "Suspend"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── SSO tab ───────────────────────────────────────────────────────────────────
function SSOTab() {
  const [protocol, setProtocol] = useState<"saml" | "oidc">("saml");
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["saml", "oidc"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProtocol(p)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
              protocol === p
                ? "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]"
                : "border-line text-fg-muted hover:border-line-strong"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {protocol === "saml" ? (
        <div className="space-y-3">
          <Field label="IdP SSO URL" placeholder="https://acme.okta.com/app/xxx/sso/saml" />
          <Field label="IdP Entity ID" placeholder="https://acme.okta.com" />
          <Field label="X.509 Certificate" placeholder="MIIC..." mono multiline />
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Client ID" placeholder="your-client-id.apps.googleusercontent.com" />
          <Field label="Client Secret" placeholder="GOCSPX-…" />
          <Field label="Discovery URL" placeholder="https://accounts.google.com/.well-known/openid-configuration" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-ink hover:opacity-90"
        >
          {saved ? <><CheckCircle size={13} /> Saved</> : "Save SSO Config"}
        </button>
        <p className="text-2xs text-fg-muted">
          ACS URL: <span className="font-mono">https://your-domain.com/api/auth/sso/acs</span>
        </p>
      </div>
    </div>
  );
}

// ── SCIM tab ──────────────────────────────────────────────────────────────────
function SCIMTab() {
  const [token, setToken] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const rotate = async () => {
    setRotating(true);
    try {
      const res = await fetch("/api/v1/scim/token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToken(data.data?.token ?? null);
      }
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-ink-elevated p-4">
        <p className="mb-1 text-xs font-semibold text-fg-secondary">SCIM 2.0 Base URL</p>
        <code className="text-xs text-fg">https://your-domain.com/api/v1/scim</code>
      </div>
      <div className="rounded-xl border border-line bg-ink-elevated p-4">
        <p className="mb-2 text-xs font-semibold text-fg-secondary">Bearer Token</p>
        {token ? (
          <div className="space-y-2">
            <code className="block break-all rounded-lg bg-ink p-2 font-mono text-2xs text-ok">
              {token}
            </code>
            <p className="text-2xs text-fg-muted">
              Copy this now — it will not be shown again.
            </p>
          </div>
        ) : (
          <p className="text-2xs text-fg-muted">No token shown — rotate to generate a new one.</p>
        )}
      </div>
      <button
        onClick={rotate}
        disabled={rotating}
        className="flex items-center gap-2 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-2 text-xs font-semibold text-[#F59E0B] hover:bg-[#F59E0B]/20"
      >
        <RefreshCw size={13} className={rotating ? "animate-spin" : ""} />
        {rotating ? "Rotating…" : "Rotate Token"}
      </button>
      <p className="text-2xs text-fg-muted">
        Old token is invalidated immediately. Update your IdP (Okta / Azure AD) SCIM config.
      </p>
    </div>
  );
}

// ── Audit tab ─────────────────────────────────────────────────────────────────
function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/audit?limit=30");
        if (res.ok) {
          const data = await res.json();
          setEntries(data.data?.events ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner />;
  if (!entries.length) return <Empty icon={Zap} label="No audit events yet" />;

  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <div key={e.id} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-ink-elevated">
          <span className="mt-0.5 font-mono text-2xs text-fg-faint">{new Date(e.at).toLocaleTimeString()}</span>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium">{e.actionType.replace(/_/g, " ")}</span>
            <span className="ml-1.5 text-2xs text-fg-muted">{e.entityLabel}</span>
          </div>
          <span className="shrink-0 rounded-full border border-line px-1.5 py-0.5 text-2xs text-fg-muted">
            {e.actorRole}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Failed Imports tab ────────────────────────────────────────────────────────
function FailedImportsTab() {
  const [jobs, setJobs] = useState<DeadLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/import/dead-letter");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clear = async (jobId: string) => {
    setClearing(jobId);
    try {
      await fetch(`/api/v1/import/dead-letter?jobId=${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      });
      setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } finally {
      setClearing(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-fg-secondary">
          {jobs.length === 0
            ? "No failed imports — all clear."
            : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} dead-lettered after 3 attempts`}
        </p>
        {jobs.length > 0 && (
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-2xs text-fg-muted hover:text-fg"
          >
            <RefreshCw size={11} /> Refresh
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <Empty icon={CheckCircle} label="No failed imports" accent="#10B981" />
      ) : (
        jobs.map((job) => (
          <div
            key={job.jobId}
            className="rounded-xl border border-danger/20 bg-danger/5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-danger" />
                  <span className="text-xs font-semibold">{job.entity}</span>
                  <span className="rounded-full border border-line px-1.5 py-0.5 font-mono text-2xs text-fg-muted">
                    {job.source}
                  </span>
                </div>
                <p className="mt-1 text-2xs text-fg-muted">
                  Failed after {job.attempts}/{job.maxAttempts} attempts
                </p>
                <p className="mt-1 truncate font-mono text-2xs text-danger/80">
                  {job.lastError}
                </p>
              </div>
              <button
                onClick={() => clear(job.jobId)}
                disabled={clearing === job.jobId}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/20"
              >
                <Trash2 size={11} />
                {clearing === job.jobId ? "…" : "Clear"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function Field({ label, placeholder, mono, multiline }: {
  label: string; placeholder: string; mono?: boolean; multiline?: boolean;
}) {
  const cls = cn(
    "w-full rounded-lg border border-line bg-ink px-3 py-2 text-xs outline-none focus:border-[#F59E0B]/50",
    mono && "font-mono"
  );
  return (
    <div>
      <label className="mb-1 block text-2xs font-medium text-fg-secondary">{label}</label>
      {multiline
        ? <textarea placeholder={placeholder} rows={3} className={cn(cls, "resize-none")} />
        : <input placeholder={placeholder} className={cls} />}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw size={18} className="animate-spin text-fg-muted" />
    </div>
  );
}

function Empty({ icon: Icon, label, accent = "#9AA3AD" }: { icon: React.ElementType; label: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <p className="text-xs text-fg-muted">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AdminApp() {
  const [tab, setTab] = useState<Tab>("tenants");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "tenants",        label: "Tenants",        icon: Users },
    { id: "sso",            label: "SSO",            icon: Wifi },
    { id: "scim",           label: "SCIM",           icon: Shield },
    { id: "audit",          label: "Audit",          icon: Zap },
    { id: "failed-imports", label: "Failed Imports", icon: WifiOff },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-ink-elevated p-1">
        {tabs.map((t) => (
          <TabBtn key={t.id} id={t.id} active={tab === t.id} label={t.label} icon={t.icon} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "tenants"        && <TenantsTab />}
        {tab === "sso"            && <SSOTab />}
        {tab === "scim"           && <SCIMTab />}
        {tab === "audit"          && <AuditTab />}
        {tab === "failed-imports" && <FailedImportsTab />}
      </div>
    </div>
  );
}
