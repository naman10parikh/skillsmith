# AGENTS.md: Skillsmith

> The one set of instructions for every coding agent (Codex, Cursor, OpenCode, Copilot, Claude Code,
> Gemini CLI) and for people. `CLAUDE.md` and `GEMINI.md` import this file. The brain hub is
> [`brain/MOC - skillsmith.md`](./brain/MOC%20-%20skillsmith.md).

## What it does

Skillsmith (`skillsmith`) helps people and agents write Agent Skills: a folder with a `SKILL.md` that
Claude Code, Gemini CLI, Codex and other agents load when its frontmatter `description` matches the
task. It scaffolds a skill from a template, checks it against the rules agents rely on (frontmatter
`name` and `description`, a title, a trigger section, steps, a size limit, no absolute paths from one
machine), and vets an untrusted skill inside an E2B microVM before anyone installs it. It needs no
API key; only `sandbox-run` needs `E2B_API_KEY`.

## Its tools and how to call them

**Command line.** Run `npx -y -p github:naman10parikh/skillsmith skillsmith <command>`. The npm name
`skillsmith` belongs to a different project, so do not `npm i skillsmith`.

| Command | What it does |
| --- | --- |
| `init [name] [-t basic\|advanced\|mcp] [-d dir]` | Scaffold a skill folder. Every template ships frontmatter and passes `test --strict`. |
| `test [path] [--strict] [--json]` | Check a skill folder or `SKILL.md`. Exits 1 on an error (on a warning too with `--strict`), also with `--json`. |
| `sandbox-run [path] [-t template] [--json]` | Run the same checks inside a fresh E2B microVM, so untrusted text is parsed off the host. Needs `E2B_API_KEY`. |
| `install <name> [-g] [--dir path]` | Write a starter skill from the built-in catalog into `.claude/skills/` (or `~/.claude/skills/` with `-g`). |
| `list [-c category] [--json]` | Show the built-in catalog. |
| `publish [path] [--dry-run]` | Validate a skill for sharing and print how to share it through GitHub. The shared registry is not live yet. |
| `memory-search "<query>" [--json]` | BM25 search over Skillsmith's own knowledge (memory/, brain/, identity/, skills/, the top docs). |
| `mcp` | Start the MCP server (same as the `skillsmith-mcp` bin). |
| `--help`, `--version` | Help and version. |

`init`, `publish`, `install` and `sandbox-run` append one line per run to `~/.skillsmith/runs.jsonl`
(or to `SKILLSMITH_RUNS_FILE`): the command, its arguments, whether it worked and how long it took.

**MCP server.** `npx -y -p github:naman10parikh/skillsmith skillsmith-mcp` speaks JSON-RPC over stdio.

| Tool | What it does |
| --- | --- |
| `skillsmith_init` | Scaffold a skill (`name`, optional `template` and `dir`). |
| `skillsmith_test` | Check a skill folder or `SKILL.md` on disk (`path`, optional `strict: "true"`). |
| `skillsmith_validate_spec` | Check raw `SKILL.md` text without writing to disk (`content`). |
| `skillsmith_list` | List the built-in catalog (optional `category`). |

**Skills** (in [`skills/`](skills/)): `write-a-skill`, `vet-untrusted-skill` and `audit-skill-library`.

**Sub-agents** (in `.claude/agents/`): `skill-reviewer` (judges whether an agent will find and follow
a skill) and `skill-security-auditor` (hunts an untrusted skill for secrets access, exfiltration,
destructive commands and hidden text), plus a general toolkit: `architect`, `code-reviewer`,
`loop-auditor`, `performance-analyzer`, `research-agent`, `security-reviewer`, `test-writer`. They
read and report; the parent edits.

## Where things live

| Path | What lives here |
| --- | --- |
| `src/index.ts`, `src/commands/` | The CLI: one file per command. `src/commands/test.ts` holds the validator. |
| `src/templates/` | The basic, advanced and mcp scaffolds `init` writes. |
| `src/mcp/server.ts`, `src/mcp/registry.ts` | The MCP server (its own copy of the validator) and the registry contract (not live). |
| `src/memory/search.ts`, `src/observability/runs.ts` | BM25 memory search and the run log. |
| `hooks/check-skill.cjs`, `hooks/hooks.json` | The plugin hook: after a `SKILL.md` is written, it names anything that would stop an agent using it. |
| `tests/`, `eval/` | 25 unit tests and 23 golden evals (including CLI, MCP and hook agreement). |
| `identity/`, `memory/`, `brain/` | SOUL, BRAND, HEARTBEAT and MEMORY; long-term memory and append-only LEARNINGS; the Obsidian brain. |
| `skills/`, `.claude/` | Skillsmith's own skills, and the maintainer harness (rules, agents, settings, general hooks). |
| `.claude-plugin/`, `gemini-extension.json`, `.well-known/agent-card.json` | Claude Code plugin, Gemini CLI extension, A2A agent card. |
| `dsip.json`, `scripts/improve.mjs`, `.github/workflows/` | The self-improvement contract, its loop, CI and the daily loop. |

## Build, test, run

```bash
pnpm install      # Node >= 18; also builds dist/ (the prepare script)
pnpm test         # 25 unit tests
pnpm eval         # 23 golden evals against the built CLI, MCP server and hook
pnpm improve      # the self-improvement loop; writes logs/improve/latest.md
node dist/index.js test skills/write-a-skill --strict
```

Never claim a `src/` change works until `pnpm build && pnpm test && pnpm eval` are green and you have
run the real command on a real skill.

## Editing rules

- **One verdict everywhere.** The checks live in `src/commands/test.ts`, `src/mcp/server.ts`,
  `hooks/check-skill.cjs` and the script inside `src/commands/sandbox-run.ts`. Change all four
  together and add a fixture to `eval/golden.eval.ts` that failed before the change.
- **Templates pass their own test.** Every `init` template must pass `test --strict`; golden cases
  E1 and E2 enforce it.
- **No dead ends for agents.** A generated or installed skill never tells an agent to follow
  instructions from a source nobody controls, and never names a command the CLI does not have.
- **Honest about the registry.** `publish` and `install` work against a built-in catalog until the
  shared registry exists. Do not describe it as live.

## Commit grammar

```
feat(skill):    a new or changed capability
feat(employee): an agent-role or persona change
feat(company):  a repository-wide structural change
fix: / docs: / refactor: / test: / chore:  conventional commits
```

## Memory and brain

- A new durable decision: one line in [memory/MEMORY.md](./memory/MEMORY.md) under the right header.
- An error fixed: a root-cause entry in [memory/LEARNINGS.md](./memory/LEARNINGS.md), ending in a rule.
- Anything worth finding later: link it from the [MOC](./brain/MOC%20-%20skillsmith.md).

## What not to do

- Never print, log or commit `E2B_API_KEY` or any other key.
- Never install an untrusted skill without `sandbox-run` or a full read (the `vet-untrusted-skill` skill).
- Never let the four copies of the checks drift apart.
- Never add a check that agents do not need, or drop one they do.
