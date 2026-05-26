# skillsmith

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/skillsmith.svg)](https://www.npmjs.com/package/skillsmith)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

**Create, test, and share Claude Code skills.** The npm registry for AI agent skills.

Claude Code skills are markdown files that teach Claude new capabilities. Skillsmith gives you the toolchain: scaffold with best practices, validate against the spec, and publish to a shared registry.

> **Agent-native repo.** Skillsmith is both a CLI you run *and* a self-improving agent harness. The shipped product is the CLI in `src/`. The repo around it (`.claude/`, `brain/`, `memory/`, `identity/`, `eval/`) is the harness Claude Code uses to keep improving the tool itself. See [CLAUDE.md](CLAUDE.md) for the harness map. Forged from [Energy](https://github.com/naman10parikh/Energy) via the CP103 harness-forge recipe.

## Install

```bash
npm install -g skillsmith
```

Or use directly:

```bash
npx skillsmith init my-skill
```

## Commands

### `skillsmith init [name]`

Scaffold a new skill with best practices.

```bash
npx skillsmith init my-skill              # Basic template
npx skillsmith init my-skill -t advanced  # With knowledge/ and examples/
npx skillsmith init my-skill -t mcp       # MCP server wrapper
```

**Templates:**

| Template   | Files                     | Use Case                    |
| ---------- | ------------------------- | --------------------------- |
| `basic`    | SKILL.md, skillsmith.json | Single-file skills          |
| `advanced` | + knowledge/, examples/   | Skills with reference docs  |
| `mcp`      | MCP-specific SKILL.md     | Skills wrapping MCP servers |

### `skillsmith test [path]`

Validate a skill against the Claude Code skill spec.

```bash
npx skillsmith test .                     # Test current directory
npx skillsmith test ./my-skill            # Test specific skill
npx skillsmith test ./my-skill --strict   # Fail on warnings too
npx skillsmith test ./my-skill --json     # JSON output for CI
```

**Checks:**

- SKILL.md exists
- Token efficiency (< 2,000 words)
- Required sections: title, trigger, steps
- Recommended sections: examples, output format
- No empty sections
- No hardcoded paths
- Consistent naming

### `skillsmith publish [path]`

Publish a skill to the registry.

```bash
npx skillsmith publish .                  # Publish current skill
npx skillsmith publish . --dry-run        # Validate only
npx skillsmith publish . --tag beta       # Publish with tag
```

### `skillsmith install <name>`

Install a skill from the registry.

```bash
npx skillsmith install commit-msg         # Install to .claude/skills/
npx skillsmith install commit-msg -g      # Install globally
npx skillsmith install commit-msg --dir ./skills
```

### `skillsmith list`

Browse available skills.

```bash
npx skillsmith list                       # All skills
npx skillsmith list -c testing            # Filter by category
npx skillsmith list --json                # JSON output
```

## Skill Anatomy

A Claude Code skill is a markdown file (SKILL.md) that tells Claude **when** to activate and **what** to do:

```markdown
# My Skill

One-line description.

## When to Use

- When the user asks to [trigger condition]
- When editing [file patterns]

## Steps

1. Read the relevant files
2. Apply the pattern
3. Verify the output

## Example

User: "example prompt"
Claude: [expected behavior]
```

## Registry

The skillsmith registry is GitHub-based. To list your skill:

1. Create a repo with a `SKILL.md` and `skillsmith.json`
2. Add the topic `skillsmith-skill` to your repo
3. Run `skillsmith publish` to validate

## Development

```bash
git clone https://github.com/naman10parikh/skillsmith
cd skillsmith
pnpm install
pnpm dev -- init test-skill    # Test init command
pnpm test                      # Run test suite (vitest)
pnpm build                     # Compile to dist/
```

## License

MIT
