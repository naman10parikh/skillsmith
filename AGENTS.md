# AGENTS.md — skillsmith Agent Conventions

> How agents (Claude Code, sub-agents, future autonomous loops) operate in **this** repo.
> skillsmith is a TypeScript CLI for creating, testing, and sharing Claude Code skills —
> and an agent-native harness that improves that CLI. This file is the orchestration contract;
> it co-evolves with the repo. For the human front door see [README.md](README.md); for the
> harness component map see [CLAUDE.md](CLAUDE.md).

## What an agent works on here

The shipped product is the CLI in `src/`. Everything else is the harness the agent uses to
keep improving the CLI. An agent's job is to extend the five commands (`init`, `test`,
`publish`, `install`, `list`), keep the test suite green, and improve the harness around them.

## Directory map (this repo)

```
src/                 # THE PRODUCT — commander CLI
  index.ts           #   entry point: defines the 5 commands + flags
  commands/          #   one file per command: init · test · publish · install · list
  templates/         #   skill scaffolds (basic · advanced · mcp) emitted by `init`
tests/               # Vitest suites — templates.test.ts + test-command.test.ts (18 tests)
eval/                # eval harness for the CLI (golden tasks; to be layered in)
identity/            # agent identity — SOUL.md · MEMORY.md · HEARTBEAT.md · BRAND.md
memory/              # long-term memory — MEMORY.md + LEARNINGS.md + daily/topics/archive/
brain/               # Obsidian knowledge graph — MOC + ORG_CONTEXT + ORG_MEMORY (navigation)
hooks/               # skillsmith-specific lifecycle hooks (separate from .claude/hooks/)
skills/              # skillsmith-specific Claude Code skills (separate from .claude/skills/)
tools/               # auxiliary dev tools (separate from the shipped src/ product)
scripts/             # inherited harness scripts — memory-search/compress, budget-manager, …
MAINTAINER-PROMPTS/  # raw maintainer directives (one file per prompt)
.claude/             # inherited Claude Code harness — rules/ skills/ hooks/ commands/ agents/
.github/             # CI — workflows/ci.yml (build + test on push)
.mcp.json            # MCP servers: github · context7 · memory · obsidian (env-var refs)
```

## Operating rules for agents

1. **Test before you signal done.** `pnpm build` (0 TS errors) → `pnpm test` (18/18) →
   exercise the actual command (`pnpm dev -- init test-skill`). "It compiles" is not done.
2. **One source of truth.** Update docs in place; never create `*-v2.md`. The brain graph
   (`brain/`) navigates to canonical files — it does not duplicate them.
3. **Inherited rules apply.** `.claude/rules/*.md` are glob-loaded every session; follow them.
4. **Strict TypeScript.** No `any`, no default exports, files under 400 lines, named exports.
5. **No secrets.** skillsmith ships with zero required API keys. `.env.example` lists only the
   optional MCP-server keys; never commit a real `.env`.

## Skill spec (what `skillsmith test` enforces)

A Claude Code skill is a `SKILL.md` markdown file. `skillsmith test` validates:
required sections (title, trigger, steps), token efficiency (< 2,000 words), no empty
sections, no hardcoded absolute paths, consistent naming. When an agent edits the
validation logic in `src/commands/test.ts`, it MUST keep `tests/test-command.test.ts` green.

## Commit grammar

Conventional commits, scoped so git snap-back works at three granularities:

| Scope                | Use for                                                            |
| -------------------- | ----------------------------------------------------------------- |
| `feat(skill):`       | a single skill / template change inside the product               |
| `feat(employee):`    | an agent-level change (identity, a sub-agent, a hook)             |
| `feat(company):`     | a repo-wide change (harness structure, CI, multi-area refactor)   |

Also standard: `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. One logical change per commit.
