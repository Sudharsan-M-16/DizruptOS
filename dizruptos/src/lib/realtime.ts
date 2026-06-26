"use client";

// Realtime transport abstraction.
//
// Primary:   BroadcastChannel — instant same-browser cross-tab sync. Always on.
// Secondary: Supabase Realtime — cross-browser / cross-device sync. Activates
//            automatically when NEXT_PUBLIC_SUPABASE_URL is set (no code change
//            needed in the store). Both channels are live simultaneously; BC
//            delivers in <1ms locally, Supabase delivers across devices.
//
// Production swap: set the Supabase env vars and every store mutation
// propagates to all connected browsers without touching store.ts.

export interface RealtimeChannel<T> {
  publish: (msg: T) => void;
  subscribe: (handler: (msg: T) => void) => () => void;
  close: () => void;
}

// Lazy singleton Supabase client — created once per browser session.
type SBClient = {
  channel: (name: string) => {
    on: (event: string, filter: unknown, cb: (msg: { payload: { data: unknown } }) => void) => unknown;
    subscribe: () => void;
  };
  removeChannel: (ch: unknown) => void;
} | null;

let _sbClient: SBClient = null;
let _sbClientPromise: Promise<SBClient> | null = null;

function getSupabaseClient(): Promise<SBClient> {
  if (_sbClientPromise) return _sbClientPromise;
  _sbClientPromise = (async (): Promise<SBClient> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    try {
      const { createClient } = await import("@supabase/supabase-js");
      _sbClient = createClient(url, key) as SBClient;
      return _sbClient;
    } catch {
      return null;
    }
  })();
  return _sbClientPromise;
}

export function createChannel<T>(name: string): RealtimeChannel<T> {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    // SSR / unsupported: inert channel — UI works identically without fan-out.
    return { publish: () => {}, subscribe: () => () => {}, close: () => {} };
  }

  const bc = new BroadcastChannel(name);
  const handlers = new Set<(msg: T) => void>();

  // Secondary: Supabase Realtime channel (cross-browser). Async init — the
  // channel is usable via BC immediately; Supabase upgrades transparently.
  type SBCh = { on: (e: string, f: object, cb: (m: { payload: { data: unknown } }) => void) => SBCh; subscribe: () => void; send: (o: object) => void };
  let sbCh: SBCh | null = null;
  getSupabaseClient().then((client) => {
    if (!client) return;
    sbCh = (client as unknown as { channel: (n: string) => SBCh }).channel(`store:${name}`);
    sbCh
      .on("broadcast", { event: "sync" }, (msg: { payload: { data: unknown } }) => {
        try {
          const payload = msg.payload.data as T;
          for (const h of handlers) h(payload);
        } catch { /* malformed payload never crashes the UI */ }
      })
      .subscribe();
  }).catch(() => { /* keep BC-only on any Supabase error */ });

  bc.onmessage = (ev) => {
    for (const h of handlers) h(ev.data as T);
  };

  return {
    publish: (msg) => {
      try { bc.postMessage(msg); } catch { /* non-serializable — ignore */ }
      if (sbCh) {
        try {
          sbCh.send({ type: "broadcast", event: "sync", payload: { data: msg } });
        } catch { /* Supabase send failure never breaks the mutation path */ }
      }
    },
    subscribe: (handler) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close: () => {
      bc.close();
      if (sbCh && _sbClient) (_sbClient as unknown as { removeChannel: (ch: unknown) => void }).removeChannel(sbCh);
    },
  };
}

/* ------------------------------- presence ---------------------------------- */
// Heartbeat-based peer tracking. Production: Supabase presence on the same
// channel; the onChange contract is unchanged.

export interface PresenceHandle {
  stop: () => void;
}

export function startPresence(
  channelName: string,
  onChange: (peerCount: number) => void
): PresenceHandle {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return { stop: () => {} };
  }

  type Beat = { kind: "beat" | "bye"; tabId: string };
  const tabId = Math.random().toString(36).slice(2);
  const ch = createChannel<Beat>(channelName);
  const peers = new Map<string, number>(); // tabId → last seen

  const recount = () => {
    const cutoff = Date.now() - 12_000;
    for (const [id, seen] of peers) if (seen < cutoff) peers.delete(id);
    onChange(peers.size);
  };

  const unsub = ch.subscribe((msg) => {
    if (msg.tabId === tabId) return;
    if (msg.kind === "bye") peers.delete(msg.tabId);
    else peers.set(msg.tabId, Date.now());
    recount();
  });

  const beat = () => ch.publish({ kind: "beat", tabId });
  beat();
  const interval = window.setInterval(() => {
    beat();
    recount();
  }, 5_000);

  const bye = () => ch.publish({ kind: "bye", tabId });
  window.addEventListener("beforeunload", bye);

  return {
    stop: () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", bye);
      bye();
      unsub();
      ch.close();
    },
  };
}
