// Persistent notification service — inserts to notifications table (live mode)
// and broadcasts via Realtime so the NotificationCenter receives it instantly.
// Demo mode: no DB write; publishes via BroadcastChannel only.

import { log } from "@/server/lib/logger";
import { publishEvent, CHANNELS } from "./event-publisher";
import { env, isDemoMode } from "@/lib/env";

export type NotificationClass = "intelligence" | "approval" | "risk" | "message" | "system";

export interface NotifyOptions {
  klass: NotificationClass;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}

let _sbClient: unknown = null;

function getAdminClient() {
  if (_sbClient) return _sbClient as ReturnType<typeof import("@supabase/supabase-js").createClient>;
  if (isDemoMode || !env.supabaseUrl) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  const { createClient } = require("@supabase/supabase-js");
  _sbClient = createClient(env.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _sbClient as ReturnType<typeof createClient>;
}

export async function notify(
  userId: string,
  orgId: string,
  opts: NotifyOptions
): Promise<void> {
  const sb = getAdminClient();
  const notificationId = crypto.randomUUID();

  // Insert to DB if live
  if (sb) {
    try {
      await sb.from("notifications").insert({
        id: notificationId,
        user_id: userId,
        org_id: orgId,
        klass: opts.klass,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        entity_type: opts.entityType ?? null,
        entity_id: opts.entityId ?? null,
        read: false,
      });
    } catch (err) {
      log("warn", "notification_insert_failed", { error: String(err), userId });
    }
  }

  // Always broadcast for immediate UI delivery
  await publishEvent({
    channel: CHANNELS.NOTIFICATIONS,
    event: "notification",
    orgId,
    payload: {
      id: notificationId,
      userId,
      klass: opts.klass,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      entityType: opts.entityType,
      entityId: opts.entityId,
      read: false,
      createdAt: new Date().toISOString(),
    },
  });

  log("info", "notification_sent", { userId, type: opts.type, klass: opts.klass });
}
