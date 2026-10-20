# Skillsmith

<!-- fleet:header:start -->
[![CI](https://img.shields.io/github/actions/workflow/status/naman10parikh/skillsmith/ci.yml?branch=main&style=flat-square&label=ci)](https://github.com/naman10parikh/skillsmith/actions) [![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE) [![Agent-native](https://img.shields.io/badge/agent--native-yes-2f5d8a?style=flat-square)](AGENTS.md) [![MCP server](https://img.shields.io/badge/MCP-server-1e3f60?style=flat-square)](#use-it-from-any-coding-agent) [![Skills](https://img.shields.io/badge/skills-3-2f6b4f?style=flat-square)](skills/) [![Stars](https://img.shields.io/github/stars/naman10parikh/skillsmith?style=flat-square)](https://github.com/naman10parikh/skillsmith/stargazers)

**Create, test and vet SKILL.md skills for any coding agent.**

Skillsmith is an agent-native, recursively self-improving agent employee whose job is skills. Coding agents use it through its skills, its MCP server and its command line. It improves itself through its own evals and a scheduled improvement loop, and a person reviews every change.

[AGENTS.md](AGENTS.md) · [llms.txt](llms.txt) · [Skills](skills/) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [All projects](https://github.com/naman10parikh)
<!-- fleet:header:end -->

Skillsmith (`skillsmith`) helps you write Agent Skills: the `SKILL.md` files that Claude Code,
Gemini CLI, Codex and other coding agents load when a task matches. It scaffolds a skill, checks it
against the rules agents rely on, and checks a skill you did not write inside a throwaway E2B microVM
before you install it. It needs no API key, except `E2B_API_KEY` for that sandbox check.

<!-- fleet:use:start -->
## Use it from any coding agent

**Claude Code**: the plugin brings the skills, sub-agents, hooks and MCP server.

```
/plugin marketplace add naman10parikh/skillsmith
/plugin install skillsmith@skillsmith
```

**Its MCP server**, in any MCP client:

```bash
claude mcp add --transport stdio skillsmith -- npx -y -p github:naman10parikh/skillsmith skillsmith-mcp
codex mcp add skillsmith -- npx -y -p github:naman10parikh/skillsmith skillsmith-mcp
```

Cursor (`.cursor/mcp.json`), Gemini CLI (`.gemini/settings.json`) and most other clients take the same command as JSON:

```json
{
  "mcpServers": {
    "skillsmith": {
      "command": "npx",
      "args": [
        "-y",
        "-p",
        "github:naman10parikh/skillsmith",
        "skillsmith-mcp"
      ]
    }
  }
}
```

**Gemini CLI**: the extension brings the context and the MCP server.

```bash
gemini extensions install https://github.com/naman10parikh/skillsmith
```

**One skill** (3 in all, in [skills/](skills/)), in any agent that reads Agent Skills:

```bash
gemini skills install https://github.com/naman10parikh/skillsmith --path skills/write-a-skill
git clone --depth 1 https://github.com/naman10parikh/skillsmith /tmp/skillsmith && cp -r /tmp/skillsmith/skills/write-a-skill ~/.claude/skills/
```

**The command line:**

```bash
npx -y -p github:naman10parikh/skillsmith skillsmith --help
```

Codex, Cursor, OpenCode, GitHub Copilot and other agents read [AGENTS.md](AGENTS.md); Claude Code reads [CLAUDE.md](CLAUDE.md) and Gemini CLI reads [GEMINI.md](GEMINI.md), which import it. [llms.txt](llms.txt) maps every surface for agents that read first.
<!-- fleet:use:end -->

## Quick start

It needs Node.js 18 or later. The npm name `skillsmith` belongs to a different project, so run it
from GitHub. One alias keeps the commands short:

```bash
alias skillsmith='npx -y -p github:naman10parikh/skillsmith skillsmith'
skillsmith init changelog-entry
#   ✓ SKILL.md
#   ✓ skillsmith.json
skillsmith test changelog-entry --strict
#   ✓ All 11 checks passed!
```

Point it at a skill someone else wrote, and it names what would stop an agent from using it:

```bash
skillsmith test old-skill
#   ✗ Has frontmatter (name, description)
#   ✗ No hardcoded paths
#   ✗ 2 error(s), 2 warning(s), 7 passed
```

Check a downloaded skill inside an E2B microVM before you install it (needs `E2B_API_KEY`):

```bash
skillsmith sandbox-run ./downloaded-skill
#   ✓ frontmatter, title, trigger, steps, tokens, paths
#   ✓ Skill validated in isolation (571ms)
```

## How it works

An agent decides whether to load a skill from one line: the `description` in its YAML frontmatter.
Then it follows the body. So a skill fails in two ways: the agent never finds it, or finds it and
cannot follow it. `skillsmith test` checks for both:

| Check | If it fails |
| --- | --- |
| Frontmatter with `name` and `description` | Error: agents cannot find the skill |
| A title, a trigger section (`## When to Use`), a steps section (`## Steps`) | Error: agents cannot follow it |
| No absolute paths from one machine (such as a home folder) | Error: it breaks on every other machine |
| Under 2,000 words | Warning, and an error over 3,000 |
| An example and an output section, no empty sections | Warning |

`--strict` turns warnings into failures, and `--json` gives a result a script can read; both exit 1
when the skill fails. The same checks run in four places: the CLI, the MCP server (for agents that
check a draft before saving it), a Claude Code hook (it fires after an agent writes a `SKILL.md`)
and `sandbox-run` (inside an E2B microVM, for text you do not trust). The golden evals fail the build
if the first three disagree.

`init` writes skills that pass `test --strict` from the start. The shared registry is not live yet:
`install` writes a self-contained starter skill from a built-in catalog of 8, and `publish` validates a
skill and explains how to share it through GitHub. `init`, `publish`, `install` and `sandbox-run`
append one line per run to `~/.skillsmith/runs.jsonl`: the command, whether it worked and how long it
took.

### Every command

```bash
skillsmith init [name] [-t basic|advanced|mcp]   # scaffold a skill folder
skillsmith test [path] [--strict] [--json]       # check a skill folder or SKILL.md
skillsmith sandbox-run [path] [--json]           # the same checks inside an E2B microVM
skillsmith install <name> [-g] [--dir path]      # a starter skill from the catalog
skillsmith list [-c category] [--json]           # the catalog
skillsmith publish [path] [--dry-run]            # validate a skill for sharing
skillsmith memory-search "<query>"               # BM25 search over Skillsmith's own knowledge
skillsmith mcp                                   # the MCP server (also the skillsmith-mcp bin)
skillsmith --help
skillsmith --version
```

The MCP server's four tools (`skillsmith_init`, `skillsmith_test`, `skillsmith_validate_spec`,
`skillsmith_list`) are described in [AGENTS.md](AGENTS.md).

## Development

```bash
pnpm install      # also builds dist/
pnpm build        # tsc to dist/
pnpm test         # 25 unit tests
pnpm eval         # 23 golden evals against the built CLI, MCP server and hook
pnpm improve      # the self-improvement loop; writes logs/improve/latest.md
```

<!-- fleet:anatomy:start -->
## What it is made of

Every project in this fleet is graded on the same 11 harness components and on self-improvement. Each mark is backed by a file you can open.

| Component | Grade | Where |
| --- | --- | --- |
| Identity | ✅ | identity/SOUL.md:10 (name Skillsmith, tagline), :25 (boundaries); identity/BRAND.md:9; identity/HEARTBEAT.md:1 |
| Memory | ✅ | memory/MEMORY.md:1; src/memory/search.ts:149 (BM25, `skillsmith memory-search`); memory/LEARNINGS.md |
| Skills | ✅ | skills/write-a-skill/SKILL.md:1 (+2 more in skills/) |
| Tools/CLIs | ✅ | package.json:9-10 (skillsmith, skillsmith-mcp); package.json:34 (prepare) |
| Hooks | ✅ | .claude/settings.json:4,24; hooks/hooks.json:4; hooks/check-skill.cjs:18 |
| Sub-agents | ✅ | .claude/agents/skill-reviewer.md:1; .claude/agents/skill-security-auditor.md:1 |
| MCPs | ✅ | src/mcp/server.ts:63 (4 tools); .mcp.json:3 |
| Dispatch | ✅ | scripts/improve.mjs:1 (review, extract, propose, try); .github/workflows/improve.yml:10-12 (daily) |
| Evals | ✅ | eval/golden.eval.ts:87 (23 cases); .github/workflows/ci.yml:32-35 |
| Observability | ✅ | src/observability/runs.ts:43 (runs.jsonl); src/index.ts:54,70,78 (init, publish, install) |
| Sandbox/Infra | ✅ | src/commands/sandbox-run.ts:106 (E2B Sandbox.create) |
| RSI / open-endedness | ✅ | dsip.json:5 (L2); scripts/improve.mjs:1 |

✅ real and tested · 🟡 partial, with the reason in the row · ❌ absent
<!-- fleet:anatomy:end -->

<!-- fleet:footer:start -->
## How it improves itself

It carries its own evals and a self-improvement contract, [`dsip.json`](dsip.json) (level L2). A scheduled loop runs the evals and writes what it would change as a proposal. A person reviews every proposal, and none that lowers a score is accepted. Lessons it learns are kept as rules in its memory files.

## Part of a fleet

One of the agent-native open-source projects by [Naman Parikh](https://github.com/naman10parikh): agent-native systems, operated by agent employees, built to improve and evolve themselves. Each one owns one part of an agent's harness or of the product around it.

Siblings: [agentdial](https://github.com/naman10parikh/agentdial) (identity) · [wikimem](https://github.com/naman10parikh/wikimem) (memory) · [agent-booster](https://github.com/naman10parikh/agent-booster) (tools / CLIs) · [armory](https://github.com/naman10parikh/armory) (MCPs and the component registry) · [agentgrid](https://github.com/naman10parikh/agentgrid) (dispatch) · [agentswarm](https://github.com/naman10parikh/agentswarm) (dispatch) · [agentbench](https://github.com/naman10parikh/agentbench) (evals) · [agentmoney](https://github.com/naman10parikh/agentmoney) (observability) · [claude-harness](https://github.com/naman10parikh/claude-harness) (the whole harness, as a template).

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md); AI-assisted pull requests are welcome. Report a vulnerability privately, as [SECURITY.md](SECURITY.md) explains.

## Star history

[![Star history chart](https://api.star-history.com/svg?repos=naman10parikh/skillsmith&type=Date)](https://star-history.com/#naman10parikh/skillsmith&Date)
<!-- fleet:footer:end -->

## License

MIT © Naman Parikh. See [LICENSE](./LICENSE).
