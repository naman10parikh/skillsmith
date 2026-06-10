/**
 * Memory search — a real BM25 index over skillsmith's OWN corpus.
 *
 * The harness "Memory" component requires a queryable index (not grep, not a
 * flat KV) over this repo's own knowledge: brain/, memory/, identity/, docs/,
 * and the top-level MEMORY.md / README / CLAUDE / CONTEXT docs. This is the
 * code form of Energy's `scripts/memory-search.sh`, adapted to skillsmith's
 * own corpus and scored with Okapi BM25 over paragraph-sized chunks.
 *
 * Pure and synchronous so the eval suite can import and assert it directly —
 * the CLI wrapper (commands/memory-search.ts) only adds argv + chalk + exit.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

/** One scored chunk of the corpus. */
export interface SearchHit {
  /** Repo-relative path of the source file (e.g. "brain/ORG_MEMORY.md"). */
  file: string;
  /** 1-based line number where this chunk starts. */
  line: number;
  /** BM25 score for this chunk against the query (higher = more relevant). */
  score: number;
  /** The chunk text (a paragraph), trimmed for display. */
  snippet: string;
}

/** A corpus chunk before scoring. */
interface Chunk {
  file: string;
  line: number;
  text: string;
  /** Lower-cased term tokens of this chunk. */
  terms: string[];
}

/** BM25 free parameters (Okapi defaults). */
const K1 = 1.5;
const B = 0.75;

/** Directories (relative to repo root) whose *.md files form the corpus. */
const CORPUS_DIRS = ["brain", "memory", "identity", "docs", "skills"];
/** Individual top-level docs to include even though they aren't in a corpus dir. */
const CORPUS_FILES = [
  "MEMORY.md",
  "README.md",
  "CLAUDE.md",
  "CONTEXT.md",
  "AGENTS.md",
  "QUICKSTART.md",
];

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "for", "on",
  "with", "as", "at", "by", "be", "this", "that", "are", "from", "but", "not",
]);

/** Tokenise text into lower-cased alphanumeric terms, dropping stop-words. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9-]*/g) ?? []).filter(
    (t) => t.length > 1 && !STOP.has(t),
  );
}

/** Recursively collect *.md files under `dir`. */
function walkMarkdown(dir: string, acc: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") {
      continue;
    }
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      walkMarkdown(full, acc);
    } else if (entry.endsWith(".md")) {
      acc.push(full);
    }
  }
}

/** Split a file into paragraph chunks, tracking each chunk's start line. */
function chunkFile(repoRoot: string, absPath: string): Chunk[] {
  const raw = readFileSync(absPath, "utf-8");
  const rel = relative(repoRoot, absPath);
  const lines = raw.split("\n");
  const chunks: Chunk[] = [];
  let buf: string[] = [];
  let bufStart = 1;

  const flush = (endLine: number): void => {
    const text = buf.join(" ").trim();
    if (text) {
      chunks.push({ file: rel, line: bufStart, text, terms: tokenize(text) });
    }
    buf = [];
    bufStart = endLine + 2;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      flush(i);
    } else {
      if (buf.length === 0) bufStart = i + 1;
      buf.push(line);
    }
  }
  flush(lines.length);
  return chunks;
}

/** Build the corpus of chunks from the repo's own knowledge files. */
export function buildCorpus(repoRoot: string): Chunk[] {
  const files: string[] = [];
  for (const dir of CORPUS_DIRS) {
    const abs = join(repoRoot, dir);
    if (existsSync(abs)) walkMarkdown(abs, files);
  }
  for (const f of CORPUS_FILES) {
    const abs = join(repoRoot, f);
    if (existsSync(abs)) files.push(abs);
  }
  const chunks: Chunk[] = [];
  for (const f of files) {
    try {
      chunks.push(...chunkFile(repoRoot, f));
    } catch {
      // Skip unreadable files — search must not crash on one bad file.
    }
  }
  return chunks;
}

/**
 * Score `chunks` against `query` with Okapi BM25 and return the top `limit`.
 * Exported separately from corpus building so tests can feed a synthetic corpus.
 */
export function bm25Search(
  chunks: Chunk[],
  query: string,
  limit = 5,
): SearchHit[] {
  const qTerms = [...new Set(tokenize(query))];
  if (qTerms.length === 0 || chunks.length === 0) return [];

  const N = chunks.length;
  const avgdl =
    chunks.reduce((sum, c) => sum + c.terms.length, 0) / Math.max(1, N);

  // Document frequency per query term.
  const df = new Map<string, number>();
  for (const term of qTerms) {
    let count = 0;
    for (const c of chunks) {
      if (c.terms.includes(term)) count++;
    }
    df.set(term, count);
  }

  const scored: SearchHit[] = [];
  for (const c of chunks) {
    const dl = c.terms.length;
    let score = 0;
    for (const term of qTerms) {
      const n = df.get(term) ?? 0;
      if (n === 0) continue;
      // Term frequency in this chunk.
      let tf = 0;
      for (const t of c.terms) if (t === term) tf++;
      if (tf === 0) continue;
      // BM25 IDF (with +1 to keep it non-negative).
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const denom = tf + K1 * (1 - B + (B * dl) / avgdl);
      score += idf * ((tf * (K1 + 1)) / denom);
    }
    if (score > 0) {
      scored.push({
        file: c.file,
        line: c.line,
        score: Math.round(score * 1000) / 1000,
        snippet: c.text.length > 240 ? c.text.slice(0, 237) + "…" : c.text,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  return scored.slice(0, limit);
}

/** Convenience: build the repo corpus then BM25-search it. */
export function searchMemory(
  repoRoot: string,
  query: string,
  limit = 5,
): SearchHit[] {
  return bm25Search(buildCorpus(repoRoot), query, limit);
}
