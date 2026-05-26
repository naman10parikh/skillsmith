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
