# skillsmith — Session Context

- **Forged:** 2026-05-25 from Energy (CP103 multi-repo extraction, harness-forge recipe).
- **Status:** Shipped. Standalone public repo. Product CLI extracted, decoupled, build + tests green.
- **Product:** TypeScript CLI (`src/` + `package.json` bin) — create/test/share Claude Code skills.
- **Decoupling:** Zero `@energy/*` references repo-wide. No `AGENT_FORMAT_EXTENSION` usage. No monorepo `workspace:` refs. Inherited harness files (hooks/commands/skills) retargeted to skillsmith's own `pnpm build`/`lint`/`test`.
- **Deps:** commander, chalk, @inquirer/prompts (+ dev: typescript, tsx, vitest, @types/node).
- **Verified:** `pnpm build` exit 0 · `pnpm test` 18/18 · `node dist/index.js --help`/`--version` · `init`→`test`→`list` end-to-end.
- **Harness layer (inherited):** 22 rules · 26 skills · 14 hooks · 16 commands · 7 sub-agents · brain/ · identity/ · memory/.
- **Secrets:** none. `.env.example` only (placeholders). `.mcp.json` uses env-var refs.
