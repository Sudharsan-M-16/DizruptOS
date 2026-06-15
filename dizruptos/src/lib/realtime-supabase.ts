// Supabase Realtime — replaces BroadcastChannel for cross-tab/cross-user events.
//
// Architecture:
//   • Live mode (Supabase configured): uses `@supabase/supabase-js` Realtime channels.
//   • Demo mode: falls back to BroadcastChannel (same-tab, no server push).
//
// Usage:
//   const channel = realtimeChannel("org:notifications")
//   channel.on("notification", (payload) => { ... })
//   channel.subscribe()
//   channel.send("notification", { ... })
//   channel.unsubscribe()

import { isDemoMode } from "@/lib/env";

export type RealtimePayload = Record<string, unknown>;
export type RealtimeHandler = (payload: RealtimePayload) => void;

export interface RealtimeChannel {
  on(event: string, handler: RealtimeHandler): this;
  off(event: string, handler: RealtimeHandler): this;
  subscribe(): Promise<void>;
  unsubscribe(): void;
  send(event: string, payload: RealtimePayload): Promise<void>;
}

// ---------------------------------------------------------------------------
// Demo fallback: BroadcastChannel (same-browser only, no server persistence)
// ---------------------------------------------------------------------------

class BroadcastChannel_Fallback implements RealtimeChannel {
  private bc: BroadcastChannel | null = null;
  private handlers = new Map<string, Set<RealtimeHandler>>();

  constructor(private readonly name: string) {}

  on(event: string, handler: RealtimeHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return this;
  }

  off(event: string, handler: RealtimeHandler) {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  async subscribe() {
    if (typeof BroadcastChannel === "undefined") return; // SSR guard
    this.bc = new BroadcastChannel(`dizrupt:${this.name}`);
    this.bc.onmessage = (e) => {
      const { event, payload } = e.data ?? {};
      this.handlers.get(event)?.forEach((h) => h(payload));
    };
  }

  unsubscribe() {
    this.bc?.close();
    this.bc = null;
  }

  async send(event: string, payload: RealtimePayload) {
    this.bc?.postMessage({ event, payload });
    // Also dispatch locally (same tab).
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}

// ---------------------------------------------------------------------------
// Live Supabase Realtime channel
// ---------------------------------------------------------------------------

class SupabaseChannel implements RealtimeChannel {
  private channel: ReturnType<import("@supabase/supabase-js").SupabaseClient["channel"]> | null = null;
  private handlers = new Map<string, Set<RealtimeHandler>>();

  constructor(
    private readonly name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly client: any
  ) {}

  on(event: string, handler: RealtimeHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return this;
  }

  off(event: string, handler: RealtimeHandler) {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  async subscribe() {
    this.channel = this.client.channel(this.name);
    this.channel!
      .on("broadcast", { event: "*" }, (msg: { event: string; payload: RealtimePayload }) => {
        this.handlers.get(msg.event)?.forEach((h) => h(msg.payload));
        this.handlers.get("*")?.forEach((h) => h({ event: msg.event, ...msg.payload }));
      })
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      this.client.removeChannel(this.channel);
      this.channel = null;
    }
  }

  async send(event: string, payload: RealtimePayload) {
    if (!this.channel) return;
    await this.channel.send({ type: "broadcast", event, payload });
    // Dispatch locally too.
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}

// ---------------------------------------------------------------------------
// Factory — returns the right implementation based on env.
// ---------------------------------------------------------------------------

let _supabaseClient: unknown = null;

async function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  const { createClient } = await import("@supabase/supabase-js");
  _supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _supabaseClient;
}

export function realtimeChannel(name: string): RealtimeChannel {
  if (isDemoMode) {
    return new BroadcastChannel_Fallback(name);
  }
  // Lazy-load Supabase client to avoid SSR issues.
  const lazyChannel = new BroadcastChannel_Fallback(name); // start with fallback
  // Upgrade to Supabase async — the caller re-subscribes after upgrade.
  getSupabaseClient().then((client) => {
    const sc = new SupabaseChannel(name, client);
    // Transfer handlers.
    Object.assign(lazyChannel, sc);
  }).catch(() => { /* keep fallback */ });
  return lazyChannel;
}

// ---------------------------------------------------------------------------
// Well-known channel names (single source of truth).
// ---------------------------------------------------------------------------
export const CHANNELS = {
  NOTIFICATIONS: "org:notifications",
  TASKS: "org:tasks",
  CAPACITY: "org:capacity",
  RISKS: "org:risks",
  PROPOSALS: "org:proposals",
  INTELLIGENCE: "org:intelligence",
} as const;

export type ChannelName = typeof CHANNELS[keyof typeof CHANNELS];
