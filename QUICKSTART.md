# skillsmith — Quickstart

## Use it (no install)

```bash
npx skillsmith init my-skill        # scaffold a new Claude Code skill
npx skillsmith test ./my-skill      # validate it against the skill spec
npx skillsmith list                 # browse the registry
```

## Install globally

```bash
npm install -g skillsmith
skillsmith --help
```

## Develop it (from a clone)

```bash
git clone https://github.com/naman10parikh/skillsmith
cd skillsmith
pnpm install
pnpm build                 # tsc → dist/
pnpm test                  # vitest run (18 tests)
pnpm dev -- init my-skill  # run the CLI from source via tsx
node dist/index.js --help  # run the built CLI
```

## The five commands

`init` (scaffold) · `test` (validate) · `publish` (push to registry) · `install` (pull a skill) · `list` (browse).
Full flag reference: [README.md](README.md). Repo/harness map: [CLAUDE.md](CLAUDE.md) · [AGENTS.md](AGENTS.md).
