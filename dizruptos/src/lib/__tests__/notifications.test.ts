// Notification state management — pure unit tests (no DB, no fetch).
// Tests notification list operations: unread count, mark read, mark all read.

import { describe, it, expect } from "vitest";

interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  klass: "intelligence" | "approval" | "risk" | "message" | "system";
  readAt: string | null;
  createdAt: string;
}

function makeNote(id: string, klass: Notification["klass"] = "system", readAt: string | null = null): Notification {
  return { id, userId: "u-1", title: `Notification ${id}`, body: "Body", klass, readAt, createdAt: new Date().toISOString() };
}

function unreadCount(notes: Notification[]): number {
  return notes.filter((n) => !n.readAt).length;
}

function markRead(notes: Notification[], id: string): Notification[] {
  const now = new Date().toISOString();
  return notes.map((n) => n.id === id && !n.readAt ? { ...n, readAt: now } : n);
}

function markAllRead(notes: Notification[]): Notification[] {
  const now = new Date().toISOString();
  return notes.map((n) => n.readAt ? n : { ...n, readAt: now });
}

describe("notification state", () => {
  it("counts unread notifications correctly", () => {
    const notes = [makeNote("a"), makeNote("b", "risk", new Date().toISOString()), makeNote("c")];
    expect(unreadCount(notes)).toBe(2);
  });

  it("mark-read sets readAt and decrements unread count", () => {
    const notes = [makeNote("n1"), makeNote("n2"), makeNote("n3")];
    expect(unreadCount(notes)).toBe(3);
    const updated = markRead(notes, "n1");
    expect(unreadCount(updated)).toBe(2);
    expect(updated.find((n) => n.id === "n1")?.readAt).toBeTruthy();
  });

  it("mark-read is idempotent on already-read notifications", () => {
    const already = makeNote("n4", "system", "2026-01-01T00:00:00Z");
    const notes = [already];
    const updated = markRead(notes, "n4");
    // readAt should not change
    expect(updated[0].readAt).toBe("2026-01-01T00:00:00Z");
  });

  it("mark-all-read sets readAt on all unread", () => {
    const notes = [makeNote("a"), makeNote("b"), makeNote("c", "risk", new Date().toISOString())];
    const updated = markAllRead(notes);
    expect(unreadCount(updated)).toBe(0);
    updated.forEach((n) => expect(n.readAt).toBeTruthy());
  });

  it("mark-all-read does not modify already-read timestamps", () => {
    const readAt = "2026-01-01T00:00:00Z";
    const notes = [makeNote("x", "system", readAt), makeNote("y")];
    const updated = markAllRead(notes);
    expect(updated.find((n) => n.id === "x")?.readAt).toBe(readAt);
  });

  it("empty notification list yields unread count 0", () => {
    expect(unreadCount([])).toBe(0);
  });

  it("notification classes are correctly typed", () => {
    const classes: Notification["klass"][] = ["intelligence", "approval", "risk", "message", "system"];
    classes.forEach((k) => {
      const n = makeNote("z", k);
      expect(n.klass).toBe(k);
    });
  });

  it("mixed read/unread state is preserved on partial mark-read", () => {
    const notes = [makeNote("1"), makeNote("2"), makeNote("3")];
    let current = markRead(notes, "1");
    expect(unreadCount(current)).toBe(2);
    current = markRead(current, "3");
    expect(unreadCount(current)).toBe(1);
    expect(current.find((n) => n.id === "2")?.readAt).toBeNull();
  });
});
