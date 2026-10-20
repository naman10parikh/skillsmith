@AGENTS.md

# CLAUDE.md: what is specific to Claude Code here

AGENTS.md (imported above) is the one source: what Skillsmith does, its tools, where things live and
what not to do. This file adds only what Claude Code loads or needs.

## What Claude Code loads in this repository

- **Rules:** `.claude/rules/*.md`, glob-loaded every session (the fleet's shared operating rules).
- **Hooks:** `.claude/settings.json` wires `block-dangerous-commands.cjs` (Bash) and
  `protect-secrets.cjs` (Read, Edit, Write, Bash) before each tool call, and `hooks/check-skill.cjs`
  after each Edit or Write: when the file is a `SKILL.md`, it names anything that would stop another
  agent finding or following the skill. Fix what it names before moving on.
- **Sub-agents:** `.claude/agents/`, flat. Use `skill-reviewer` after writing a skill and
  `skill-security-auditor` before installing one from outside.
- **MCP:** `.mcp.json` starts only Skillsmith's own server, because the plugin ships that file to
  strangers. The maintainer servers (a local build of the server, GitHub, Context7, memory, the
  Obsidian vault in `brain/`) live in `.mcp.dev.json`: start Claude Code with
  `claude --mcp-config .mcp.dev.json` to load them.
- **Plugin:** `.claude-plugin/plugin.json` bundles the skills, the two Skillsmith sub-agents, the
  check-skill hook and the MCP server. Check it with `claude plugin validate .`. The older
  `.claude-plugin/manifest.json` is kept because the unit tests read it.

## Operating model

You are the maintainer's co-founder, not an assistant: act, then verify. Test as a user: scaffold a
real skill, run `skillsmith test` on it and read the output. "It compiles" means nothing. When a tool
fails, try another route before you report a block.

## Before you say done

```bash
pnpm build && pnpm test && pnpm eval
node dist/index.js test skills/write-a-skill --strict
claude plugin validate .
```
