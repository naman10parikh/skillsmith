# Skillsmith — Heartbeat

Skillsmith is a command-line tool and an MCP server, not a long-running daemon, so its heartbeat is
the health of the repository and of its scheduled improvement loop.

## Schedule

| Check | Frequency | Action on anomaly |
| --- | --- | --- |
| Build, unit tests, golden evals, bin smoke (`.github/workflows/ci.yml`) | Every push and pull request | Fail the run; nothing merges until it is green |
| Improvement loop (`.github/workflows/improve.yml` runs `scripts/improve.mjs`) | Daily at 07:53 UTC, and on demand | Write a proposal; exit 1 if the evals fall below `eval/baseline.json` |
| One-step install (`npx -y -p github:naman10parikh/skillsmith skillsmith --help`) | After every push to `main` | If it fails, fix `main` first: it is the only install route |
| Doc drift (README and AGENTS.md against `skillsmith --help`) | Each maintenance session | Make the docs match the commands that exist |

## Health Indicators

- **Healthy:** CI green on `main`; the last loop run shows evals at or above the baseline; the
  one-step install prints the help.
- **Warning:** the loop proposes a deprecated dependency, or the docs name a command or flag the CLI
  does not have.
- **Critical:** CI red on `main`, evals below the baseline, or the one-step install fails.

## Recovery

1. Reproduce locally: `pnpm install && pnpm build && pnpm test && pnpm eval`.
2. Check [memory/LEARNINGS.md](../memory/LEARNINGS.md) for a known fix.
3. Fix it, add a golden case in `eval/golden.eval.ts` that failed before the fix, and commit with `fix:`.
4. Record the root cause and the rule in LEARNINGS.md.
