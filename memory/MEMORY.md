# skillsmith — Long-Term Memory (index)

> Inherited memory-harness structure. One line per durable fact.
> Layers: this index → topics/ deep-dives → daily/ logs → archive/ (compressed >30d, never deleted).

## Architecture Decisions

- **2026-05-25** — skillsmith ships as a CLI, not a web app. Standard layout: `package.json` + `src/` (`index.ts` + `commands/` + `templates/`) + `bin`. The forge's `src/frontend|backend|db|auth` placeholders were dropped on extraction.
- **2026-05-25** — Five commands define the product: `init` · `test` · `publish` · `install` · `list`. The registry is GitHub-based (repos tagged `skillsmith-skill`).

## Key Patterns

- **Skill spec validation** lives in `src/commands/test.ts`: required sections (title/trigger/steps), token efficiency (< 2,000 words), no empty sections, no hardcoded absolute paths, consistent naming. Edits there must keep `tests/test-command.test.ts` green.

## Technology Choices

- Runtime deps: `commander`, `chalk`, `@inquirer/prompts`. Dev: `typescript`, `tsx`, `vitest`, `@types/node`. Strict TS, ESM (`"type": "module"`), Node ≥ 18.

## People & Resources

- Forged from the Energy platform via the CP103 harness-forge recipe. See `package.json` for author/maintainer.

## What NOT to Do

- Don't reintroduce `@energy/*` imports, `AGENT_FORMAT_EXTENSION`, or monorepo `workspace:` refs — the repo is intentionally standalone.
- Don't commit a real `.env` — the CLI needs zero secrets; `.env.example` only lists the optional MCP GitHub PAT.

## Operating Model

- Co-founder mode: act, don't ask; test as a user; self-improve every session; one source of truth per topic. Inherited `.claude/rules/*.md` glob-load every session.

## Topic Files Index

- (none yet — add deep-dive notes under `memory/topics/` and link them here)
