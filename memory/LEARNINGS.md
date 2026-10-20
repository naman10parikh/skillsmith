# skillsmith — LEARNINGS (append-only)

Every error → root cause → rule. Auto-compressed when >500 lines (memory-compress.sh).

## 2026-05-25 — Extraction must be verified as a user, not by compile

- **What broke:** "It compiles" is not proof an extracted CLI works standalone.
- **Root cause:** A decoupled repo can still carry dangling monorepo assumptions (`@energy/*`, `workspace:` refs) that only surface at runtime.
- **Rule:** Gate extraction on green `pnpm build` + full `pnpm test` (18/18) + an end-to-end `init`→`test`→`list` run before declaring done.

## 2026-05-26 — A public repo inherits Energy's full `.env.example` by default

- **What broke:** skillsmith's `.env.example` was a verbatim copy of Energy's (Anthropic, E2B, Clerk, Stripe, Twilio, WhatsApp, Supabase, …) — misleading for a CLI that needs zero secrets.
- **Root cause:** harness-forge copies the env template wholesale; it doesn't know the product's real surface.
- **Rule:** After extraction, trim `.env.example` to the repo's actual needs. skillsmith → just the optional GitHub PAT for the `github` MCP server.

## 2026-10-19 — The validator passed skills no agent could load

- **What broke:** `skillsmith test` passed a SKILL.md with no frontmatter, which Claude Code and other agents cannot find, and `install` wrote a skill telling the agent to "follow the instructions in the source repository" at a GitHub account that does not exist. Absolute paths and `--json` also misbehaved: `test /abs/path` looked in the wrong folder, and `--json` exited 0 on a failing skill.
- **Root cause:** the checks encoded an older idea of a skill (sections only), the install stub pointed at a planned registry, and `path.join(cwd, path)` was used where `path.resolve` was meant.
- **Rule:** every check must match what agents actually read, starting with frontmatter `name` and `description`; a generated skill never sends an agent to a source nobody controls; the CLI, the MCP server and the hook must agree, and `eval/golden.eval.ts` fails CI when they drift.

## 2026-10-20: The catalog was written three times and the copies disagreed

- **What broke:** `list` showed 10 starter skills, `install` knew 5 and the MCP tool `skillsmith_list` returned 8.
  `list` offered skills that `install` then said did not exist.
- **Root cause:** each reader kept its own copy of the catalog, and nothing compared them.
- **Rule:** the catalog is one list, `CATALOG` in `src/catalog.ts`. Golden case E15 fails when the readers disagree,
  when an entry does not install and pass, or when the README gives the wrong size.
