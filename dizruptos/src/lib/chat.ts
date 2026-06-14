"use client";

// Messages — a small Teams-style chat backbone. Direct messages and group
// channels between employees, with a clean, stable mutation surface
// (sendMessage / createGroup / openDm) so a real backend (websockets / CRDT)
// drops straight in later. Persisted locally so conversations survive a reload.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  convId: string;
  authorId: string;
  text: string;
  at: number;
}

export interface Conversation {
  id: string;
  kind: "dm" | "group";
  name?: string;        // group name (DMs derive their name from the members)
  memberIds: string[];
  /** group owner — can add/remove members and rename (the creator / lead). */
  adminId?: string;
  createdAt: number;
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const T = (mins: number) => Date.now() - mins * 60_000;

const seedConversations: Conversation[] = [
  { id: "c-atlas", kind: "group", name: "Atlas Payments War Room", adminId: "u-sarah", memberIds: ["u-asha", "u-sarah", "u-ahmed", "u-mei", "u-jonas", "u-yuki"], createdAt: T(6000) },
  { id: "c-eng", kind: "group", name: "Engineering", adminId: "u-priya", memberIds: ["u-priya", "u-ahmed", "u-sarah", "u-mei", "u-jonas", "u-diego", "u-fatima"], createdAt: T(9000) },
  { id: "c-lead", kind: "group", name: "Leadership", adminId: "u-noor", memberIds: ["u-noor", "u-priya", "u-asha", "u-marcus"], createdAt: T(12000) },
  { id: "c-sec", kind: "group", name: "Security & Admin", adminId: "u-elias", memberIds: ["u-elias", "u-fatima", "u-priya"], createdAt: T(8000) },
  { id: "c-asha-priya", kind: "dm", memberIds: ["u-asha", "u-priya"], createdAt: T(4000) },
  { id: "c-asha-sarah", kind: "dm", memberIds: ["u-asha", "u-sarah"], createdAt: T(3000) },
  { id: "c-ahmed-sarah", kind: "dm", memberIds: ["u-ahmed", "u-sarah"], createdAt: T(2000) },
  { id: "c-noor-asha", kind: "dm", memberIds: ["u-noor", "u-asha"], createdAt: T(2600) },
  { id: "c-priya-ahmed", kind: "dm", memberIds: ["u-priya", "u-ahmed"], createdAt: T(1800) },
  { id: "c-elias-priya", kind: "dm", memberIds: ["u-elias", "u-priya"], createdAt: T(1500) },
];

const seedMessages: ChatMessage[] = [
  { id: "m1", convId: "c-atlas", authorId: "u-sarah", text: "QA is at 112% — I need another pair of hands on the settlement ingestion before Friday.", at: T(180) },
  { id: "m2", convId: "c-atlas", authorId: "u-ahmed", text: "I can take the idempotent retry layer off your plate. Pushing a branch now.", at: T(168) },
  { id: "m3", convId: "c-atlas", authorId: "u-asha", text: "Thanks both. I've flagged the vendor settlement as critical — Marcus is chasing the sign-off.", at: T(150) },
  { id: "m4", convId: "c-atlas", authorId: "u-mei", text: "Double-entry property tests are green ✅", at: T(95) },
  { id: "m5", convId: "c-eng", authorId: "u-priya", text: "Reminder: RLS coverage gate is now blocking merges. Ping Fatima if it trips.", at: T(420) },
  { id: "m6", convId: "c-eng", authorId: "u-diego", text: "Milestone timeline component is in review 👀", at: T(300) },
  { id: "m7", convId: "c-lead", authorId: "u-noor", text: "Board wants the Atlas risk picture before Monday. Asha, can you prep the one-pager?", at: T(240) },
  { id: "m8", convId: "c-lead", authorId: "u-asha", text: "On it — I'll pull it from the Risk register tonight.", at: T(232) },
  { id: "m9", convId: "c-asha-priya", authorId: "u-priya", text: "Do you have bandwidth to take Sarah's overflow this week? She's tipping over 100%.", at: T(60) },
  { id: "m10", convId: "c-asha-priya", authorId: "u-asha", text: "Looking now. I think Ahmed has ~6h free — I'll rebalance.", at: T(54) },
  { id: "m11", convId: "c-ahmed-sarah", authorId: "u-sarah", text: "Can you grab the webhook retry ticket? I'm drowning.", at: T(40) },
  { id: "m12", convId: "c-ahmed-sarah", authorId: "u-ahmed", text: "Yep, already on it 💪", at: T(36) },
  { id: "m13", convId: "c-noor-asha", authorId: "u-noor", text: "Great work holding Atlas together. Let me know if you need air cover with the vendor.", at: T(120) },
  { id: "m14", convId: "c-priya-ahmed", authorId: "u-priya", text: "Nice turnaround on the retry layer. Code review looks clean.", at: T(20) },
  { id: "m15", convId: "c-elias-priya", authorId: "u-elias", text: "Pen-test scope is blocked on the vendor doc. Escalating.", at: T(75) },
];

interface ChatState {
  conversations: Conversation[];
  messages: ChatMessage[];
  sendMessage: (convId: string, authorId: string, text: string) => void;
  createGroup: (name: string, memberIds: string[], adminId: string) => string;
  openDm: (selfId: string, otherId: string) => string;
  /** Admin-only — guarded by the UI; callers pass the acting user. */
  addMembers: (convId: string, ids: string[]) => void;
  removeMember: (convId: string, id: string) => void;
}

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: seedConversations,
      messages: seedMessages,

      sendMessage: (convId, authorId, text) => {
        const t = text.trim();
        if (!t) return;
        set((s) => ({ messages: [...s.messages, { id: uid("m"), convId, authorId, text: t, at: Date.now() }] }));
      },

      createGroup: (name, memberIds, adminId) => {
        const id = uid("g");
        set((s) => ({ conversations: [{ id, kind: "group", name: name.trim() || "New Group", adminId, memberIds: [...new Set([adminId, ...memberIds])], createdAt: Date.now() }, ...s.conversations] }));
        return id;
      },

      addMembers: (convId, ids) =>
        set((s) => ({ conversations: s.conversations.map((c) => (c.id === convId ? { ...c, memberIds: [...new Set([...c.memberIds, ...ids])] } : c)) })),

      removeMember: (convId, id) =>
        set((s) => ({ conversations: s.conversations.map((c) => (c.id === convId ? { ...c, memberIds: c.memberIds.filter((m) => m !== id || m === c.adminId) } : c)) })),

      openDm: (selfId, otherId) => {
        const existing = get().conversations.find((c) => c.kind === "dm" && c.memberIds.includes(selfId) && c.memberIds.includes(otherId));
        if (existing) return existing.id;
        const id = uid("dm");
        set((s) => ({ conversations: [{ id, kind: "dm", memberIds: [selfId, otherId], createdAt: Date.now() }, ...s.conversations] }));
        return id;
      },
    }),
    { name: "dizrupt-chat" }
  )
);

/** Last message + time for a conversation (for the list preview). */
export const lastMessage = (messages: ChatMessage[], convId: string) =>
  messages.filter((m) => m.convId === convId).sort((a, b) => b.at - a.at)[0];
