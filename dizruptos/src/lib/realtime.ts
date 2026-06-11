"use client";

// Realtime transport abstraction.
//
// Today: BroadcastChannel — real, working synchronization across tabs of the
// same browser (open two windows and drag a task: both heatmaps update live).
// Production: this module is the single swap point for Supabase Realtime
// department-scoped channels (`capacity:dept:{id}`, decision dec-2). The
// publish/subscribe contract is identical; only the transport changes.

export interface RealtimeChannel<T> {
  publish: (msg: T) => void;
  subscribe: (handler: (msg: T) => void) => () => void;
  close: () => void;
}

export function createChannel<T>(name: string): RealtimeChannel<T> {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    // SSR / unsupported: inert channel. Graceful degradation (PRD failure
    // catalog): UI works identically, just without live fan-out.
    return { publish: () => {}, subscribe: () => () => {}, close: () => {} };
  }

  const bc = new BroadcastChannel(name);
  const handlers = new Set<(msg: T) => void>();

  bc.onmessage = (ev) => {
    for (const h of handlers) h(ev.data as T);
  };

  return {
    publish: (msg) => {
      try {
        bc.postMessage(msg);
      } catch {
        // Non-serializable payloads must never break the mutation path.
      }
    },
    subscribe: (handler) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close: () => bc.close(),
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
