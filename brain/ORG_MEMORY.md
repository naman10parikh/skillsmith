---
type: company-brain
status: active
created: 2026-05-25
updated: 2026-05-26
tags: [skillsmith, company-brain]
related: ["[[MOC - skillsmith]]", "[[ORG_CONTEXT]]"]
---

# skillsmith — ORG_MEMORY (the company brain's memory)

Every agent writes back here after acting. The fleet inherits every workflow's learnings.

## Seeded learnings (from the CP103 extraction + CP104 doc standardization)

- **CLI, not web app.** skillsmith ships a standard CLI layout (`package.json` + `src/` + `bin`).
  The harness-forge's generic `src/frontend|backend|db|auth` placeholders were removed during
  extraction — keeping them would have implied a server the product doesn't have.
- **Full decoupling is the bar for an extracted repo.** "Done" meant zero `@energy/*` imports,
  no `AGENT_FORMAT_EXTENSION` usage, and no monorepo `workspace:` refs — verified by a green
  build + 18/18 tests + an end-to-end `init`→`test`→`list` run, not just "it compiles."
- **Public repos must be scrubbed for personal/internal tokens.** `.env.example` was trimmed from
  Energy's full key list to the single GitHub-PAT the MCP layer needs; the prompts directory was
  renamed to `maintainer-prompts`. scrub-public verifies 0 residual Energy-personal/internal tokens.

See [[ORG_CONTEXT]] for the product context and [[MOC - skillsmith]] for navigation.
