"use client";

// Knowledge Vault — a macOS Finder-style window for storing PDFs, knowledge and
// project assets. Left rail of quick locations, breadcrumb navigation, grid/list
// toggle, and a full-window drag-to-upload dropzone that lights up when files are
// dragged over it. All persistence goes through `@/lib/vault` (IndexedDB) — this
// component holds only view state, so a backend swap touches nothing here.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight, Clock, File as FileIcon, FileText, Folder, FolderPlus, Grid2x2,
  HardDrive, Image as ImageIcon, List, RotateCcw, Share2, Trash2, Upload, UploadCloud,
} from "lucide-react";
import * as vault from "@/lib/vault";
import { formatSize, type VaultNode } from "@/lib/vault";
import { cn, timeAgo } from "@/lib/utils";

type View = { kind: "folder"; id: string | null } | { kind: "recent" } | { kind: "trash" };

const SIDEBAR: { label: string; icon: React.ElementType; view: View }[] = [
  { label: "Recent", icon: Clock, view: { kind: "recent" } },
  { label: "Documents", icon: Folder, view: { kind: "folder", id: "documents" } },
  { label: "Shared", icon: Share2, view: { kind: "folder", id: "shared" } },
  { label: "Trash", icon: Trash2, view: { kind: "trash" } },
];

function fileGlyph(mime?: string) {
  if (!mime) return FileIcon;
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.includes("pdf") || mime.startsWith("text/")) return FileText;
  return FileIcon;
}

export function KnowledgeVault() {
  const [nodes, setNodes] = useState<VaultNode[]>([]);
  const [view, setView] = useState<View>({ kind: "folder", id: "documents" });
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const dragDepth = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => setNodes(await vault.listAll()), []);
  useEffect(() => { vault.ensureSeeded().then(setNodes); }, []);

  const folderId = view.kind === "folder" ? view.id : null;

  const items = useMemo(() => {
    let list: VaultNode[];
    if (view.kind === "recent") list = nodes.filter((n) => n.kind === "file" && !n.trashed).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 60);
    else if (view.kind === "trash") list = nodes.filter((n) => n.trashed);
    else list = nodes.filter((n) => n.parentId === view.id && !n.trashed);
    return [...list].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1));
  }, [nodes, view]);

  const crumbs = view.kind === "folder" ? vault.breadcrumb(nodes, view.id) : [];

  const doUpload = async (files: FileList | File[]) => {
    if (!files || (files as FileList).length === 0) return;
    setBusy(true);
    const target = view.kind === "folder" ? view.id : "documents";
    await vault.uploadFiles(target, files);
    await reload();
    setBusy(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (e.dataTransfer.files?.length) await doUpload(e.dataTransfer.files);
  };

  const openNode = async (n: VaultNode) => {
    if (n.trashed) return;
    if (n.kind === "folder") { setView({ kind: "folder", id: n.id }); return; }
    const url = await vault.getBlobURL(n.id);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const newFolder = async () => {
    const name = window.prompt("New folder name", "Untitled Folder");
    if (name == null) return;
    await vault.createFolder(view.kind === "folder" ? view.id : "documents", name);
    await reload();
  };

  return (
    <div
      className="relative flex h-full min-h-0 bg-ink"
      onDragEnter={(e) => { e.preventDefault(); dragDepth.current++; setDragging(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setDragging(false); }}
      onDrop={onDrop}
    >
      {/* sidebar */}
      <aside className="flex w-[180px] shrink-0 flex-col gap-0.5 border-r border-line bg-ink-surface/60 p-2.5">
        <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Locations</div>
        {SIDEBAR.map((s) => {
          const Icon = s.icon;
          const active = sameView(view, s.view);
          return (
            <button
              key={s.label}
              onClick={() => setView(s.view)}
              className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors", active ? "text-fg" : "text-fg-secondary hover:bg-ink-elevated")}
              style={active ? { background: "var(--os-accent-soft,rgba(0,237,130,0.12))" } : undefined}
            >
              <Icon size={15} style={{ color: active ? "var(--os-accent,#00ED82)" : undefined }} /> {s.label}
            </button>
          );
        })}
        <div className="mt-auto flex items-center gap-2 rounded-lg border border-line bg-ink-elevated/60 px-2.5 py-2 text-2xs text-fg-muted">
          <HardDrive size={13} /> {nodes.filter((n) => n.kind === "file" && !n.trashed).length} files · local
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* toolbar */}
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-1 text-xs">
            {view.kind === "recent" && <span className="font-semibold">Recent</span>}
            {view.kind === "trash" && <span className="font-semibold">Trash</span>}
            {view.kind === "folder" && (
              <>
                <button onClick={() => setView({ kind: "folder", id: null })} className="font-semibold text-fg-secondary hover:text-fg">Vault</button>
                {crumbs.map((c) => (
                  <span key={c.id} className="flex items-center gap-1">
                    <ChevronRight size={12} className="text-fg-faint" />
                    <button onClick={() => setView({ kind: "folder", id: c.id })} className="text-fg-secondary hover:text-fg">{c.name}</button>
                  </span>
                ))}
              </>
            )}
          </div>

          {view.kind === "trash" ? (
            <button onClick={async () => { await vault.emptyTrash(); await reload(); }} disabled={items.length === 0} className="flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-2.5 py-1 text-2xs font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-40">
              <Trash2 size={13} /> Empty Trash
            </button>
          ) : (
            <>
              <button onClick={newFolder} title="New Folder" className="flex items-center gap-1.5 rounded-lg border border-line bg-ink-surface px-2.5 py-1 text-2xs font-medium text-fg-secondary transition-colors hover:bg-ink-elevated">
                <FolderPlus size={13} /> New Folder
              </button>
              <button onClick={() => fileInput.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1 text-2xs font-semibold text-black transition-transform hover:scale-[1.02]" style={{ background: "var(--os-accent,#00ED82)" }}>
                <Upload size={13} /> Upload
              </button>
              <input ref={fileInput} type="file" multiple hidden onChange={(e) => { const picked = e.target.files ? Array.from(e.target.files) : []; e.target.value = ""; if (picked.length) doUpload(picked); }} />
            </>
          )}

          <div className="ml-1 flex items-center rounded-lg border border-line bg-ink-surface p-0.5">
            <ToggleBtn active={layout === "grid"} onClick={() => setLayout("grid")}><Grid2x2 size={13} /></ToggleBtn>
            <ToggleBtn active={layout === "list"} onClick={() => setLayout("list")}><List size={13} /></ToggleBtn>
          </div>
        </div>

        {/* content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <EmptyState kind={view.kind} busy={busy} />
          ) : layout === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2">
              {items.map((n) => (
                <NodeTile key={n.id} node={n} onOpen={() => openNode(n)} onTrash={async () => { await vault.trash(n.id); await reload(); }} onRestore={async () => { await vault.restore(n.id); await reload(); }} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              {items.map((n, i) => (
                <NodeRow key={n.id} node={n} odd={i % 2 === 1} onOpen={() => openNode(n)} onTrash={async () => { await vault.trash(n.id); await reload(); }} onRestore={async () => { await vault.restore(n.id); await reload(); }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* full-window dropzone */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed"
            style={{ borderColor: "var(--os-accent,#00ED82)", background: "var(--os-accent-soft,rgba(0,237,130,0.12))", backdropFilter: "blur(2px)" }}
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
              <UploadCloud size={42} style={{ color: "var(--os-accent,#00ED82)" }} />
            </motion.div>
            <div className="text-sm font-semibold text-fg">Drop files to add to the Vault</div>
            <div className="text-2xs text-fg-muted">PDFs, images, docs — stored locally in your browser</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NodeTile({ node, onOpen, onTrash, onRestore }: { node: VaultNode; onOpen: () => void; onTrash: () => void; onRestore: () => void }) {
  const Glyph = node.kind === "folder" ? Folder : fileGlyph(node.mime);
  return (
    <div className="group relative">
      <button onDoubleClick={onOpen} onClick={onOpen} className="flex w-full flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-colors hover:bg-ink-elevated">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border" style={{ borderColor: node.kind === "folder" ? "var(--os-accent-line,#00ED8244)" : "rgb(var(--line))", background: node.kind === "folder" ? "var(--os-accent-soft,rgba(0,237,130,0.12))" : "rgb(var(--ink-surface))" }}>
          <Glyph size={26} style={{ color: node.kind === "folder" ? "var(--os-accent,#00ED82)" : "rgb(var(--fg-muted))" }} />
        </span>
        <span className="line-clamp-2 w-full text-2xs font-medium leading-tight text-fg">{node.name}</span>
        {node.kind === "file" && <span className="text-[10px] text-fg-faint">{formatSize(node.size)}</span>}
      </button>
      <NodeActions node={node} onTrash={onTrash} onRestore={onRestore} />
    </div>
  );
}

function NodeRow({ node, odd, onOpen, onTrash, onRestore }: { node: VaultNode; odd: boolean; onOpen: () => void; onTrash: () => void; onRestore: () => void }) {
  const Glyph = node.kind === "folder" ? Folder : fileGlyph(node.mime);
  return (
    <div className={cn("group flex items-center gap-3 px-3 py-2", odd && "bg-ink-surface/40")}>
      <button onClick={onOpen} onDoubleClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <Glyph size={16} style={{ color: node.kind === "folder" ? "var(--os-accent,#00ED82)" : "rgb(var(--fg-muted))" }} />
        <span className="truncate text-xs font-medium text-fg">{node.name}</span>
      </button>
      <span className="w-20 shrink-0 text-right font-mono text-2xs text-fg-muted">{node.kind === "file" ? formatSize(node.size) : "—"}</span>
      <span className="hidden w-24 shrink-0 text-right text-2xs text-fg-faint sm:block">{timeAgo(new Date(node.updatedAt).toISOString())}</span>
      <div className="w-7 shrink-0"><NodeActions node={node} onTrash={onTrash} onRestore={onRestore} inline /></div>
    </div>
  );
}

function NodeActions({ node, onTrash, onRestore, inline }: { node: VaultNode; onTrash: () => void; onRestore: () => void; inline?: boolean }) {
  if (node.trashed) {
    return (
      <button onClick={onRestore} title="Restore" className={cn("grid h-6 w-6 place-items-center rounded-md text-fg-muted opacity-0 transition-opacity hover:bg-ink-elevated hover:text-fg group-hover:opacity-100", inline ? "" : "absolute right-1 top-1")}>
        <RotateCcw size={13} />
      </button>
    );
  }
  return (
    <button onClick={(e) => { e.stopPropagation(); onTrash(); }} title="Move to Trash" className={cn("grid h-6 w-6 place-items-center rounded-md text-fg-muted opacity-0 transition-opacity hover:bg-danger/15 hover:text-danger group-hover:opacity-100", inline ? "" : "absolute right-1 top-1")}>
      <Trash2 size={13} />
    </button>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("grid h-6 w-7 place-items-center rounded-md transition-colors", active ? "bg-ink-elevated text-fg" : "text-fg-muted hover:text-fg")}>{children}</button>
  );
}

function EmptyState({ kind, busy }: { kind: View["kind"]; busy: boolean }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-line text-fg-faint">
        {kind === "trash" ? <Trash2 size={24} /> : <UploadCloud size={24} />}
      </div>
      <div className="text-sm font-medium text-fg-secondary">{busy ? "Uploading…" : kind === "trash" ? "Trash is empty" : kind === "recent" ? "No recent files" : "This folder is empty"}</div>
      {kind !== "trash" && <div className="text-2xs text-fg-muted">Drag files anywhere in this window, or use Upload.</div>}
    </div>
  );
}

function sameView(a: View, b: View) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "folder" && b.kind === "folder") return a.id === b.id;
  return true;
}
