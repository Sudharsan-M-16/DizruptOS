"use client";

// Messages — a Microsoft-Teams-style chat app. Left: your conversations (group
// channels + direct messages) with search and a "New" composer to start a DM or
// spin up a group from your colleagues. Right: the live thread with bubbles
// (yours accent-tinted, right-aligned) and a composer. All reads/writes go
// through `useChat`, so it's backend-ready.

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Crown, Hash, Plus, Search, Send, UserMinus, UserPlus, Users, X } from "lucide-react";
import { employees, employeeById } from "@/lib/data";
import { PERSONAS, useSession } from "@/lib/session";
import { useChat, lastMessage, type Conversation } from "@/lib/chat";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const timeShort = (at: number) => {
  const d = new Date(at);
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export function ChatApp() {
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const conversations = useChat((s) => s.conversations);
  const messages = useChat((s) => s.messages);
  const sendMessage = useChat((s) => s.sendMessage);
  const markRead = useChat((s) => s.markRead);
  const unreadCount = useChat((s) => s.unreadCount);

  const mine = useMemo(
    () => conversations.filter((c) => c.memberIds.includes(persona.id)).sort((a, b) => (lastMessage(messages, b.id)?.at ?? b.createdAt) - (lastMessage(messages, a.id)?.at ?? a.createdAt)),
    [conversations, messages, persona.id]
  );
  const [activeId, setActiveId] = useState<string | null>(mine[0]?.id ?? null);
  const [q, setQ] = useState("");
  const [composer, setComposer] = useState("");
  const [creating, setCreating] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = mine.find((c) => c.id === activeId) ?? mine[0];
  const convName = (c: Conversation) => c.kind === "group" ? c.name! : employeeById(c.memberIds.find((m) => m !== persona.id))?.name ?? "Direct message";
  const convThread = useMemo(() => (active ? messages.filter((m) => m.convId === active.id).sort((a, b) => a.at - b.at) : []), [messages, active]);

  const filtered = mine.filter((c) => !q || convName(c).toLowerCase().includes(q.toLowerCase()));

  // Mark active conversation as read when it changes
  useEffect(() => {
    if (active) markRead(active.id, persona.id);
  }, [active?.id, persona.id, markRead]);

  const send = () => {
    if (!active || !composer.trim()) return;
    sendMessage(active.id, persona.id, composer);
    setComposer("");
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 30);
  };

  return (
    <div className="flex h-full min-h-0">
      {/* conversation list */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-line bg-ink-surface/60">
        <div className="flex items-center gap-2 p-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-ink-elevated px-2.5">
            <Search size={13} className="text-fg-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" aria-label="Search conversations" className="h-8 flex-1 bg-transparent text-xs text-fg placeholder:text-fg-faint focus:outline-none" />
          </div>
          <button onClick={() => setCreating(true)} title="New chat / group" aria-label="New chat or group" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-black transition-transform hover:scale-105" style={{ background: "var(--os-accent,#00ED82)" }}>
            <Plus size={15} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
          {filtered.map((c) => {
            const lm = lastMessage(messages, c.id);
            const other = c.kind === "dm" ? employeeById(c.memberIds.find((m) => m !== persona.id)) : null;
            const activeRow = active?.id === c.id;
            const unread = activeRow ? 0 : unreadCount(c.id, persona.id);
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors", activeRow ? "bg-ink-elevated" : "hover:bg-ink-elevated/60")}>
                <div className="relative shrink-0">
                  {c.kind === "group"
                    ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-ink-surface" style={{ color: "var(--os-accent,#00ED82)" }}><Hash size={16} /></span>
                    : other ? <EmpAvatar initials={other.initials} accent={other.accent} size={36} /> : <span className="h-9 w-9 rounded-full bg-ink-elevated" />}
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-black" style={{ background: "var(--os-accent,#00ED82)" }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("truncate text-xs", unread > 0 ? "font-bold text-fg" : "font-semibold")}>{convName(c)}</span>
                    {lm && <span className="ml-auto shrink-0 text-[10px] text-fg-faint">{timeShort(lm.at)}</span>}
                  </div>
                  <div className={cn("truncate text-2xs", unread > 0 ? "text-fg-secondary" : "text-fg-muted")}>
                    {lm ? `${lm.authorId === persona.id ? "You" : employeeById(lm.authorId)?.name.split(" ")[0]}: ${lm.text}` : (c.kind === "group" ? `${c.memberIds.length} members` : "Say hello")}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && <div className="px-3 py-8 text-center text-2xs text-fg-faint">No chats. Tap + to start one.</div>}
        </div>
      </aside>

      {/* thread */}
      <div className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5">
              {active.kind === "group"
                ? <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-ink-surface" style={{ color: "var(--os-accent,#00ED82)" }}><Hash size={15} /></span>
                : (() => { const o = employeeById(active.memberIds.find((m) => m !== persona.id)); return o ? <EmpAvatar initials={o.initials} accent={o.accent} size={32} /> : null; })()}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{convName(active)}</div>
                <div className="flex items-center gap-1 text-2xs text-fg-muted">
                  {active.kind === "group" ? <><Users size={10} /> {active.memberIds.length} members</> : employeeById(active.memberIds.find((m) => m !== persona.id))?.title}
                </div>
              </div>
              {active.kind === "group" && (
                <button aria-label="Group members" onClick={() => setShowMembers(true)} className="ml-auto flex items-center gap-1.5 rounded-lg border border-line bg-ink-surface px-2.5 py-1.5 text-2xs font-medium text-fg-secondary transition-colors hover:bg-ink-elevated">
                  <Users size={13} /> {active.memberIds.length} members
                </button>
              )}
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {convThread.map((m, i) => {
                const meMsg = m.authorId === persona.id;
                const author = employeeById(m.authorId);
                const showAuthor = active.kind === "group" && !meMsg && convThread[i - 1]?.authorId !== m.authorId;
                return (
                  <div key={m.id} className={cn("flex items-end gap-2", meMsg ? "flex-row-reverse" : "")}>
                    {!meMsg ? (author ? <EmpAvatar initials={author.initials} accent={author.accent} size={26} /> : <span className="h-[26px] w-[26px]" />) : <span className="w-[26px]" />}
                    <div className={cn("max-w-[72%]", meMsg ? "items-end" : "")}>
                      {showAuthor && <div className="mb-0.5 pl-1 text-2xs font-medium text-fg-muted">{author?.name}</div>}
                      <div className={cn("rounded-2xl px-3 py-2 text-xs leading-relaxed", meMsg ? "rounded-br-sm text-black" : "rounded-bl-sm border border-line bg-ink-surface text-fg")} style={meMsg ? { background: "var(--os-accent,#00ED82)" } : undefined}>
                        {m.text}
                      </div>
                      <div className={cn("mt-0.5 px-1 text-[10px] text-fg-faint", meMsg ? "text-right" : "")}>{timeShort(m.at)}</div>
                    </div>
                  </div>
                );
              })}
              {convThread.length === 0 && <div className="grid h-full place-items-center text-xs text-fg-muted">No messages yet — say hello 👋</div>}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-line p-2.5">
              <input value={composer} onChange={(e) => setComposer(e.target.value)} placeholder={`Message ${convName(active)}`} aria-label={`Message ${convName(active)}`} className="h-10 flex-1 rounded-full border border-line bg-ink-surface px-4 text-xs text-fg placeholder:text-fg-faint focus:border-line-strong focus:outline-none" />
              <button type="submit" disabled={!composer.trim()} aria-label="Send message" className="grid h-10 w-10 place-items-center rounded-full text-black transition-transform hover:scale-105 disabled:opacity-40" style={{ background: "var(--os-accent,#00ED82)" }}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="grid h-full place-items-center text-sm text-fg-muted">Pick a chat, or tap + to start one.</div>
        )}
      </div>

      {creating && <NewChat selfId={persona.id} onClose={() => setCreating(false)} onCreated={(id) => { setActiveId(id); setCreating(false); }} />}
      {showMembers && active?.kind === "group" && <MembersPanel conv={active} selfId={persona.id} onClose={() => setShowMembers(false)} />}
    </div>
  );
}

// Group members — anyone can see who's in; only the admin (creator / lead) can
// add or remove people.
function MembersPanel({ conv, selfId, onClose }: { conv: Conversation; selfId: string; onClose: () => void }) {
  const addMembers = useChat((s) => s.addMembers);
  const removeMember = useChat((s) => s.removeMember);
  const isAdmin = conv.adminId === selfId;
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const members = conv.memberIds.map((id) => employeeById(id)).filter(Boolean) as (typeof employees)[number][];
  const candidates = employees.filter((e) => e.role !== "client" && !conv.memberIds.includes(e.id) && (!q || e.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="dz-solidify flex max-h-[88%] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.95)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="text-sm font-semibold">{conv.name}</div>
            <div className="text-2xs text-fg-muted">{conv.memberIds.length} members{isAdmin ? " · you're the admin" : ""}</div>
          </div>
          <button onClick={onClose} className="grid h-6 w-6 place-items-center rounded-md text-fg-muted hover:bg-ink-elevated hover:text-fg"><X size={14} /></button>
        </div>

        {!adding ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {members.map((e) => (
                <div key={e.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink-elevated">
                  <EmpAvatar initials={e.initials} accent={e.accent} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate text-xs font-medium">{e.name}{e.id === conv.adminId && <span className="flex items-center gap-0.5 rounded bg-warn/15 px-1 text-[9px] font-semibold text-warn"><Crown size={9} /> Admin</span>}{e.id === selfId && <span className="text-2xs text-fg-faint">· you</span>}</div>
                    <div className="truncate text-2xs text-fg-muted">{e.title}</div>
                  </div>
                  {isAdmin && e.id !== conv.adminId && (
                    <button onClick={() => removeMember(conv.id, e.id)} title="Remove" className="grid h-6 w-6 place-items-center rounded-md text-fg-muted opacity-0 transition-opacity hover:bg-danger/15 hover:text-danger group-hover:opacity-100"><UserMinus size={13} /></button>
                  )}
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="border-t border-line p-2.5">
                <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-black transition-transform hover:scale-[1.02]" style={{ background: "var(--os-accent,#00ED82)" }}>
                  <UserPlus size={14} /> Add members
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="p-2.5 pb-1.5">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-surface px-2.5">
                <Search size={13} className="text-fg-muted" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people to add" aria-label="Search people to add" className="h-8 flex-1 bg-transparent text-xs text-fg placeholder:text-fg-faint focus:outline-none" />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2">
              {candidates.map((e) => (
                <button key={e.id} onClick={() => { addMembers(conv.id, [e.id]); }} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-ink-elevated">
                  <EmpAvatar initials={e.initials} accent={e.accent} size={28} />
                  <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium">{e.name}</div><div className="truncate text-2xs text-fg-muted">{e.title}</div></div>
                  <UserPlus size={14} className="text-fg-muted" />
                </button>
              ))}
              {candidates.length === 0 && <div className="px-3 py-8 text-center text-2xs text-fg-faint">Everyone’s already in.</div>}
            </div>
            <div className="border-t border-line p-2.5">
              <button onClick={() => setAdding(false)} className="w-full rounded-lg border border-line py-2 text-xs font-medium text-fg-secondary hover:bg-ink-elevated">Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NewChat({ selfId, onClose, onCreated }: { selfId: string; onClose: () => void; onCreated: (id: string) => void }) {
  const createGroup = useChat((s) => s.createGroup);
  const openDm = useChat((s) => s.openDm);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const people = employees.filter((e) => e.id !== selfId && e.role !== "client" && (!q || e.name.toLowerCase().includes(q.toLowerCase())));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const create = () => {
    if (picked.length === 0) return;
    if (picked.length === 1 && !name.trim()) { onCreated(openDm(selfId, picked[0])); return; }
    onCreated(createGroup(name || "New Group", picked, selfId)); // creator becomes the group admin
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="dz-solidify w-[360px] overflow-hidden rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.95)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold">New message</span>
          <button onClick={onClose} className="grid h-6 w-6 place-items-center rounded-md text-fg-muted hover:bg-ink-elevated hover:text-fg"><X size={14} /></button>
        </div>
        <div className="p-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name (optional — leave blank for a 1:1 chat)" className="mb-2 h-9 w-full rounded-lg border border-line bg-ink-surface px-3 text-xs text-fg placeholder:text-fg-faint focus:outline-none" />
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-ink-surface px-2.5">
            <Search size={13} className="text-fg-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add people" className="h-8 flex-1 bg-transparent text-xs text-fg placeholder:text-fg-faint focus:outline-none" />
          </div>
          <div className="max-h-[220px] space-y-0.5 overflow-y-auto">
            {people.map((e) => {
              const on = picked.includes(e.id);
              return (
                <button key={e.id} onClick={() => toggle(e.id)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-ink-elevated">
                  <EmpAvatar initials={e.initials} accent={e.accent} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{e.name}</div>
                    <div className="truncate text-2xs text-fg-muted">{e.title}</div>
                  </div>
                  <span className={cn("grid h-5 w-5 place-items-center rounded-full border", on ? "border-transparent text-black" : "border-line")} style={on ? { background: "var(--os-accent,#00ED82)" } : undefined}>{on && <Check size={12} />}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <span className="text-2xs text-fg-muted">{picked.length === 0 ? "Pick at least one person" : picked.length === 1 ? "1:1 direct message" : `Group · ${picked.length} people`}</span>
          <button onClick={create} disabled={picked.length === 0} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition-transform hover:scale-[1.03] disabled:opacity-40" style={{ background: "var(--os-accent,#00ED82)" }}>Start chat</button>
        </div>
      </div>
    </div>
  );
}
