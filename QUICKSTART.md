# Skillsmith — Quickstart

## Use it (no install)

It needs Node.js 18 or later. The npm name `skillsmith` belongs to another project, so run it from
GitHub:

```bash
npx -y -p github:naman10parikh/skillsmith skillsmith init my-skill          # scaffold a skill
npx -y -p github:naman10parikh/skillsmith skillsmith test my-skill --strict  # check it
```

## Keep the commands short

```bash
alias skillsmith='npx -y -p github:naman10parikh/skillsmith skillsmith'
skillsmith --help
```

A global `npm install -g github:naman10parikh/skillsmith` does not work yet: npm skips the build
tools when it installs a GitHub package globally, so the build step fails. The alias runs the same
code through npx.

## Develop it (from a clone)

```bash
git clone https://github.com/naman10parikh/skillsmith
cd skillsmith
pnpm install               # also builds dist/
pnpm test                  # 25 unit tests
pnpm eval                  # 23 golden evals
node dist/index.js --help  # run the built CLI
```

## The commands

`init` (scaffold) · `test` (check) · `sandbox-run` (check inside an E2B microVM) · `install` (a starter
from the catalog) · `list` (the catalog) · `publish` (validate for sharing) · `memory-search` ·
`mcp`. Full reference: [AGENTS.md](AGENTS.md). Overview: [README.md](README.md).
