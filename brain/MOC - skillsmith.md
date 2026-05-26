---
type: moc
status: active
created: 2026-05-25
updated: 2026-05-26
tags: [skillsmith, moc]
related: ["[[ORG_CONTEXT]]", "[[ORG_MEMORY]]"]
---

# MOC — skillsmith

The master hub for this harness's brain. skillsmith is a TypeScript CLI for **creating,
testing, and sharing Claude Code skills**, plus the agent-native harness that improves it.
Every doc and every top-level folder is reachable from here.

## Doc spine (root)

- [[README]] — human / OSS front door: install + the five commands ([README.md](../README.md))
- [[CLAUDE]] — agent operating brief + harness-component map ([CLAUDE.md](../CLAUDE.md))
- [[AGENTS]] — this repo's agent-orchestration conventions + dir map + commit grammar ([AGENTS.md](../AGENTS.md))
- [[QUICKSTART]] — build/run commands inline ([QUICKSTART.md](../QUICKSTART.md))
- [[CONTEXT]] — current state + what's next ([CONTEXT.md](../CONTEXT.md))

## Company Brain

- [[ORG_CONTEXT]] — what this company is and its operating context
- [[ORG_MEMORY]] — what the fleet has learned (seeded from the CP103/CP104 extraction)

## Memory

- [[MEMORY]] — long-term memory index ([memory/MEMORY.md](../memory/MEMORY.md))
- [[LEARNINGS]] — append-only error → root-cause → rule log ([memory/LEARNINGS.md](../memory/LEARNINGS.md))
- `memory/daily/` · `memory/topics/` · `memory/archive/` · `memory/maintainer-prompts/` — chronological + deep-dive + compressed memory

## Identity

- [[SOUL]] — identity, personality, boundaries ([identity/SOUL.md](../identity/SOUL.md))
- [[BRAND]] — name rationale, tagline, landing copy ([identity/BRAND.md](../identity/BRAND.md))
- `identity/MEMORY.md` · `identity/HEARTBEAT.md` — agent memory bootstrap + cron checks

## Product & code (folders)

- `src/` — the shipped CLI (`index.ts` + `commands/` + `templates/`)
- `tests/` — Vitest suites (18 tests)
- `eval/` — eval harness for the CLI (to be layered in)
- `scripts/` — inherited harness scripts (memory-search/compress, budget-manager, doc-health-check, auto-switch)
- `hooks/` · `skills/` · `tools/` — skillsmith-specific lifecycle hooks, skills, and dev tools
- `.claude/` — inherited Claude Code harness (rules · skills · hooks · commands · agents)
- `.github/` — CI (`workflows/ci.yml`)
- `MAINTAINER-PROMPTS/` — raw maintainer directives

## Architecture

- The skill spec `skillsmith test` enforces lives in `src/commands/test.ts`; conventions in [[AGENTS]].

## Operations

- Build/test/run: [[QUICKSTART]]. CI: `.github/workflows/ci.yml`. Memory upkeep: `scripts/memory-compress.sh`.

## Decisions

- CLI (not web app): the forge's `src/frontend|backend|db|auth` placeholders were dropped — see [[CONTEXT]] and [[ORG_MEMORY]].
