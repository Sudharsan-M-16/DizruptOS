"use client";

// Knowledge Vault — a tiny, fully-typed file system persisted to IndexedDB
// (idb-keyval). The UI never touches IndexedDB directly; it calls this service,
// so swapping local storage for a distributed object store / CRDT sync later is
// a single-file change. Node metadata lives in one index array; file bytes live
// in their own per-node blob keys so the index stays light.

import { type UseStore, createStore, del, get, set } from "idb-keyval";

export type VaultKind = "folder" | "file";

export interface VaultNode {
  id: string;
  parentId: string | null; // null = root
  kind: VaultKind;
  name: string;
  createdAt: number;
  updatedAt: number;
  trashed?: boolean;
  // file-only
  mime?: string;
  size?: number;
}

const INDEX_KEY = "vault:index";
const blobKey = (id: string) => `vault:blob:${id}`;

let store: UseStore | null = null;
function db(): UseStore {
  if (!store) store = createStore("dizrupt-vault", "kv");
  return store;
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => Date.now();

async function readIndex(): Promise<VaultNode[]> {
  return (await get<VaultNode[]>(INDEX_KEY, db())) ?? [];
}
async function writeIndex(nodes: VaultNode[]): Promise<void> {
  await set(INDEX_KEY, nodes, db());
}

/** First-run scaffolding: a couple of starter folders so the vault isn't empty. */
export async function ensureSeeded(): Promise<VaultNode[]> {
  let nodes = await readIndex();
  if (nodes.length === 0) {
    const t = now();
    nodes = [
      { id: "documents", parentId: null, kind: "folder", name: "Documents", createdAt: t, updatedAt: t },
      { id: "shared", parentId: null, kind: "folder", name: "Shared", createdAt: t, updatedAt: t },
    ];
    await writeIndex(nodes);
  }
  return nodes;
}

export async function listAll(): Promise<VaultNode[]> {
  return readIndex();
}

export async function createFolder(parentId: string | null, name: string): Promise<VaultNode> {
  const nodes = await readIndex();
  const node: VaultNode = { id: uid(), parentId, kind: "folder", name: name.trim() || "Untitled Folder", createdAt: now(), updatedAt: now() };
  await writeIndex([...nodes, node]);
  return node;
}

export async function uploadFiles(parentId: string | null, files: File[] | FileList): Promise<VaultNode[]> {
  const nodes = await readIndex();
  const added: VaultNode[] = [];
  for (const file of Array.from(files)) {
    const node: VaultNode = {
      id: uid(), parentId, kind: "file", name: file.name,
      createdAt: now(), updatedAt: now(), mime: file.type || "application/octet-stream", size: file.size,
    };
    await set(blobKey(node.id), file, db()); // idb-keyval persists Blobs natively
    added.push(node);
  }
  await writeIndex([...nodes, ...added]);
  return added;
}

export async function rename(id: string, name: string): Promise<void> {
  const nodes = await readIndex();
  await writeIndex(nodes.map((n) => (n.id === id ? { ...n, name: name.trim() || n.name, updatedAt: now() } : n)));
}

/** Soft-delete a node (and, for folders, everything beneath it). */
export async function trash(id: string): Promise<void> {
  const nodes = await readIndex();
  const ids = collectSubtree(nodes, id);
  await writeIndex(nodes.map((n) => (ids.has(n.id) ? { ...n, trashed: true, updatedAt: now() } : n)));
}

export async function restore(id: string): Promise<void> {
  const nodes = await readIndex();
  const ids = collectSubtree(nodes, id);
  await writeIndex(nodes.map((n) => (ids.has(n.id) ? { ...n, trashed: false, updatedAt: now() } : n)));
}

/** Permanently remove all trashed nodes and their blobs. */
export async function emptyTrash(): Promise<void> {
  const nodes = await readIndex();
  const trashed = nodes.filter((n) => n.trashed);
  await Promise.all(trashed.filter((n) => n.kind === "file").map((n) => del(blobKey(n.id), db())));
  await writeIndex(nodes.filter((n) => !n.trashed));
}

export async function getBlobURL(id: string): Promise<string | null> {
  const blob = await get<Blob>(blobKey(id), db());
  return blob ? URL.createObjectURL(blob) : null;
}

function collectSubtree(nodes: VaultNode[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of nodes) {
      if (n.parentId && ids.has(n.parentId) && !ids.has(n.id)) { ids.add(n.id); grew = true; }
    }
  }
  return ids;
}

export function breadcrumb(nodes: VaultNode[], folderId: string | null): VaultNode[] {
  const trail: VaultNode[] = [];
  let cur = folderId;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  while (cur) {
    const node = byId.get(cur);
    if (!node) break;
    trail.unshift(node);
    cur = node.parentId;
  }
  return trail;
}

export const formatSize = (bytes?: number) => {
  if (!bytes) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0; let v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
};
