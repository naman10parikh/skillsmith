# Skillsmith — Memory

> Bootstrap memory for the Skillsmith agent. Powered by Energy.
> Long-term durable facts live in `../memory/MEMORY.md`; this is the per-cycle bootstrap.

## Bootstrap (loaded every cycle)

- Strategy: ship a tight five-command CLI (`init` · `test` · `publish` · `install` · `list`) plus an MCP server, keep it green, and self-improve the harness around it every session.
- Platform: a standalone TypeScript CLI (`commander` + `chalk` + `@inquirer/prompts`), ESM, strict TS, Node ≥ 18. Zero required secrets.
- Created: 2026-05-25 (forged from Energy via the CP103 harness-forge recipe).
- Last successful scan: (updated by agent)
- Key learnings: skill-spec validation lives in `src/commands/test.ts`; never reintroduce `@energy/*` coupling; one source of truth per topic.

## Patterns Discovered

- A Claude Code skill is just a `SKILL.md` with a title, a trigger section, and steps — the validator rewards those three plus token efficiency (< 2,000 words) and no hardcoded absolute paths.
- Repo-authored skills belong in `skills/`; the 26 files under `.claude/skills/` are inherited Energy copies and are NOT the product surface.

## Errors Encountered

(Agent logs errors and fixes here to prevent repetition — see `../memory/LEARNINGS.md` for the durable record.)
