// Entity embeddings — lightweight TF-IDF vector representations of org entities.
//
// Design philosophy: we don't need sentence-transformer quality here — we need
// *org-aware* semantic search that surfaces "who owns payment risk?" from the
// actual entity text (names, skills, project titles, descriptions, decisions).
//
// In demo/offline mode: compute from in-memory seed, no storage.
// In production: store in entity_embeddings table; retrieved via cosine similarity.
//
// The Copilot uses these to inject the most semantically relevant entities into
// the LLM context window, preventing irrelevant distractors from degrading quality.

export interface EntityVector {
  entityId:   string;
  entityType: "employee" | "capability" | "project" | "decision" | "risk" | "recommendation";
  label:      string;
  text:       string;         // the full text that was embedded
  vector:     number[];       // TF-IDF sparse vector (length = vocab size)
  tokens:     string[];       // the tokenized representation
}

export interface SearchResult {
  entityId:   string;
  entityType: EntityVector["entityType"];
  label:      string;
  score:      number;   // cosine similarity 0–1
  snippet:    string;   // first 120 chars of entity text
}

/* ------------------------------------------------------------------ */
/* TF-IDF vectorizer (tiny, no external deps)                          */
/* ------------------------------------------------------------------ */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "is","are","was","were","be","been","being","has","have","had","do",
  "does","did","will","would","could","should","may","might","shall",
  "this","that","these","those","it","its","we","our","their","they",
  "from","by","as","up","about","into","through","during","before",
  "after","between","each","very","can","no","not","all","any","both",
]);

function buildVocab(docs: string[][]): Map<string, number> {
  const vocab = new Map<string, number>();
  for (const tokens of docs) {
    for (const t of new Set(tokens)) {
      vocab.set(t, (vocab.get(t) ?? 0) + 1);
    }
  }
  return vocab;
}

function tfidfVector(tokens: string[], vocab: Map<string, number>, N: number): number[] {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);

  const vec: number[] = [];
  const keys = Array.from(vocab.keys());
  for (const term of keys) {
    const tfVal  = (tf.get(term) ?? 0) / tokens.length;
    const df     = vocab.get(term) ?? 1;
    const idfVal = Math.log((N + 1) / (df + 1)) + 1;
    vec.push(tfVal * idfVal);
  }
  return vec;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/* ------------------------------------------------------------------ */
/* Build corpus from org entities                                       */
/* ------------------------------------------------------------------ */

import type { Employee, Risk } from "@/lib/types";
import type { Capability, RecommendationRecord, Repositories } from "@/server/repositories/types";

interface OrgCorpus {
  vectors: EntityVector[];
  vocab:   Map<string, number>;
}

let _cached: OrgCorpus | null = null;

export async function buildCorpus(repos: Repositories): Promise<OrgCorpus> {
  if (_cached) return _cached;

  const [employees, capabilities, projects, risks, decisions, recommendations] = await Promise.all([
    repos.employees.list(),
    repos.capabilities.list(),
    repos.projects?.list?.() ?? [],
    repos.risks.list(),
    repos.decisions.list(),
    repos.recommendations.list(),
  ]);

  const docs: { id: string; type: EntityVector["entityType"]; label: string; text: string }[] = [
    ...employees.map((e: Employee) => ({
      id: e.id, type: "employee" as const, label: e.name,
      text: [e.name, e.title ?? "", e.location ?? "", (e.skills ?? []).join(" ")].join(" "),
    })),
    ...capabilities.map((c: Capability) => ({
      id: c.id, type: "capability" as const, label: c.name,
      text: [c.name, c.category ?? "", `importance ${c.strategicImportance}`].join(" "),
    })),
    ...projects.map((p: { id: string; title?: string; name?: string; description?: string; status?: string; health?: string }) => ({
      id: p.id, type: "project" as const, label: p.title ?? p.name ?? p.id,
      text: [p.title ?? p.name ?? "", p.description ?? "", p.status ?? "", p.health ?? ""].join(" "),
    })),
    ...risks.map((r: Risk) => ({
      id: r.id, type: "risk" as const, label: r.title,
      text: [r.title, r.category, r.impact, r.probability, r.status].join(" "),
    })),
    ...decisions.map((d: { id: string; title?: string; description?: string; category?: string }) => ({
      id: d.id, type: "decision" as const, label: d.title ?? d.id,
      text: [d.title ?? "", d.description ?? "", d.category ?? ""].join(" "),
    })),
    ...recommendations.map((rec: RecommendationRecord) => ({
      id: rec.id, type: "recommendation" as const, label: rec.title,
      text: [rec.title, rec.rationale ?? "", rec.type ?? ""].join(" "),
    })),
  ];

  const tokenized = docs.map((d) => tokenize(d.text));
  const vocab = buildVocab(tokenized);
  const N = docs.length;

  const vectors: EntityVector[] = docs.map((d, i) => ({
    entityId:   d.id,
    entityType: d.type,
    label:      d.label,
    text:       d.text,
    vector:     tfidfVector(tokenized[i], vocab, N),
    tokens:     tokenized[i],
  }));

  _cached = { vectors, vocab };
  return _cached;
}

/** Invalidate the in-memory cache (call after data mutations). */
export function invalidateCorpus() { _cached = null; }

/* ------------------------------------------------------------------ */
/* Semantic search                                                      */
/* ------------------------------------------------------------------ */

export async function semanticSearch(
  query: string,
  repos: Repositories,
  opts: { topK?: number; entityType?: EntityVector["entityType"] } = {}
): Promise<SearchResult[]> {
  const { topK = 5, entityType } = opts;
  const corpus = await buildCorpus(repos);

  const qTokens = tokenize(query);
  const qVec    = tfidfVector(qTokens, corpus.vocab, corpus.vectors.length);

  const results = corpus.vectors
    .filter((v) => !entityType || v.entityType === entityType)
    .map((v) => ({
      entityId:   v.entityId,
      entityType: v.entityType,
      label:      v.label,
      score:      cosineSimilarity(qVec, v.vector),
      snippet:    v.text.slice(0, 120).trim(),
    }))
    .filter((r) => r.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return results;
}
