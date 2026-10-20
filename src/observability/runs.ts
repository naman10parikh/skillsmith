/**
 * Observability — append-only audit trail of CLI runs.
 *
 * Every state-mutating command (init, publish, install, sandbox-run) appends
 * one JSON line per run to a runs.jsonl file — the same pattern as Energy's
 * helios `logs/runs.jsonl`. Read it with `tail` / `jq` to see what the CLI
 * did, when, whether it succeeded, and how long it took (durationMs is the
 * cost proxy for a local CLI; sandbox-run also records the paid E2B boot).
 *
 * Default location: ~/.skillsmith/runs.jsonl — the CLI executes in arbitrary
 * user CWDs, so the trail lives in the user profile, not the project. Tests
 * and CI point SKILLSMITH_RUNS_FILE at a scratch path instead.
 *
 * Logging never throws: observability must never break the product.
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/** One audit-trail entry. `ts` is added automatically by logRun. */
export interface RunRecord {
  /** Command name: init | publish | install | sandbox-run. */
  cmd: string;
  /** Positional/option summary for the run (never credentials). */
  args: Record<string, unknown>;
  /** Whether the state-mutating action completed successfully. */
  ok: boolean;
  /** Wall-clock duration of the action in milliseconds. */
  durationMs: number;
  /** Optional human-readable detail (files written, sandbox id, …). */
  detail?: string;
}

/** Resolve the runs.jsonl path (env override > ~/.skillsmith/runs.jsonl). */
export function runsFilePath(): string {
  return (
    process.env.SKILLSMITH_RUNS_FILE ??
    join(homedir(), ".skillsmith", "runs.jsonl")
  );
}

/** Append one run record (stamped with an ISO timestamp) to the trail. */
export function logRun(record: RunRecord): void {
  try {
    const file = runsFilePath();
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(
      file,
      `${JSON.stringify({ ts: new Date().toISOString(), ...record })}\n`,
      "utf-8",
    );
  } catch (err) {
    // Intentionally non-fatal: the audit trail must never break the CLI.
    console.warn(
      "[observability] failed to write run record:",
      (err as Error).message,
    );
  }
}
