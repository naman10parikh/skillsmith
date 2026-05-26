# skillsmith — Agent-Native Harness

> Forged from Energy via harness-forge (CP103). One repo = one recursively self-improving
> agent-native harness. Energy is the control center; this is a self-contained flavor.

## What this is

Skillsmith is a TypeScript CLI for **creating, testing, and sharing Claude Code skills** — the npm registry for AI agent skills. Skills are markdown files (`SKILL.md`) that teach Claude new capabilities. The CLI provides five commands: `init` (scaffold a skill from basic/advanced/mcp templates), `test` (validate against the skill spec — sections, token efficiency, no hardcoded paths), `publish` (validate + push to the GitHub-based registry), `install` (pull a skill into `.claude/skills/`), and `list` (browse the registry). The shipped product is a standalone CLI built with `commander`, `chalk`, and `@inquirer/prompts` — no runtime dependency on Energy.

## Harness components (the formula → where they live in this repo)

This repo is BOTH the product (the CLI) and the harness Claude Code uses to improve the product.

| Formula component        | Lives here                          | What it holds                                                        |
| ------------------------ | ----------------------------------- | -------------------------------------------------------------------- |
| **The product (CLI)**    | `src/` + `package.json` `bin`       | `index.ts` (commander entry) + `commands/` + `templates/`            |
| **Tests**                | `tests/`                            | Vitest suites for templates and validation logic                     |
| **Identity**             | `identity/`                         | SOUL.md · MEMORY.md · HEARTBEAT.md · BRAND.md                        |
| **Memory**               | `memory/` + `brain/`                | MEMORY.md/LEARNINGS.md index + daily/topics/archive; Obsidian graph  |
| **Skills**               | `.claude/skills/` (+ `skills/`)     | 26 inherited Claude Code skills; `skills/` for skillsmith-specific   |
| **Hooks**                | `.claude/hooks/` (+ `hooks/`)       | 14 inherited lifecycle hooks (session-start, pre-compact, etc.)      |
| **Sub-agents**           | `.claude/agents/`                   | 7 sub-agents (code-reviewer, research-agent, architect, …)           |
| **Rules**                | `.claude/rules/`                    | 22 inherited operating rules, glob-loaded every session              |
| **Commands**             | `.claude/commands/`                 | 16 inherited slash commands (/start, /wrap-up, /handoff, …)          |
| **Plugins / MCP**        | `.mcp.json`                         | github · context7 · memory · obsidian (placeholders, env-var refs)   |
| **Eval / observer**      | `eval/`                             | Eval harness for the CLI (to be layered in)                          |

> Note: this is a CLI, not a web app — the forge's `src/frontend|backend|db|auth` placeholders
> were removed. The product lives at `src/` (standard CLI layout: `package.json` + `src/` + `bin`).

## Operating model

You are the user's co-founder. Act, don't ask. Self-improve every session. Test as a user.
Inherited rules in `.claude/rules/` are glob-loaded every session.

## Build / test / run

```bash
pnpm install
pnpm build          # tsc → dist/
pnpm test           # vitest run (18 tests)
pnpm dev -- --help  # run the CLI from source via tsx
node dist/index.js --help   # run the built CLI
```

## Commit convention

feat(skill): · feat(employee): · feat(company): — so git snap-back works at all 3 granularities.
