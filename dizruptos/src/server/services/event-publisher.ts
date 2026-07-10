// Server-side domain event publisher.
// Live mode: broadcasts via Supabase Realtime (service-role client, bypasses RLS).
// Demo mode: no-op (client-side BroadcastChannel handles demo pub/sub).
// Always logs the event for audit/observability.

import { log } from "@/server/lib/logger";
import { env, isDemoMode } from "@/lib/env";

export const CHANNELS = {
  NOTIFICATIONS: "org:notifications",
  TASKS: "org:tasks",
  CAPACITY: "org:capacity",
  RISKS: "org:risks",
  PROPOSALS: "org:proposals",
  INTELLIGENCE: "org:intelligence",
} as const;

export type ChannelName = (typeof CHANNELS)[keyof typeof CHANNELS];

export interface DomainEvent {
  channel: ChannelName;
  event: string;
  payload: Record<string, unknown>;
  orgId: string;
}

let _sbClient: unknown = null;

function getAdminClient() {
  if (_sbClient) return _sbClient as ReturnType<typeof import("@supabase/supabase-js").createClient>;
  if (isDemoMode || !env.supabaseUrl) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  // Lazy import to avoid SSR issues
  const { createClient } = require("@supabase/supabase-js");
  _sbClient = createClient(env.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _sbClient as ReturnType<typeof createClient>;
}

export async function publishEvent(evt: DomainEvent): Promise<void> {
  log("info", "event_published", { channel: evt.channel, event: evt.event, orgId: evt.orgId });

  const sb = getAdminClient();
  if (!sb) return; // demo mode or unconfigured — client-side BroadcastChannel handles it

  try {
    await sb.channel(evt.channel).send({
      type: "broadcast",
      event: evt.event,
      payload: { ...evt.payload, orgId: evt.orgId, publishedAt: new Date().toISOString() },
    });
  } catch (err) {
    log("warn", "event_publish_failed", { channel: evt.channel, event: evt.event, error: String(err) });
  }
}
