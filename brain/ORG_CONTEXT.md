---
type: company-brain
status: active
created: 2026-05-25
updated: 2026-05-26
tags: [skillsmith, company-brain]
related: ["[[MOC - skillsmith]]", "[[ORG_MEMORY]]"]
---

# skillsmith — ORG_CONTEXT (the company brain's context)

Every agent reads this before acting. "If it is recorded, it happened to the AI."

skillsmith is a standalone, public, open-source TypeScript CLI for **creating, testing, and
sharing Claude Code skills** — positioned as the npm-style registry for AI-agent skills. A
skill is a `SKILL.md` markdown file that teaches Claude a new capability; the CLI gives authors
a toolchain to scaffold one with best practices (`init`), validate it against the skill spec
(`test`), and share it through a GitHub-based registry (`publish` / `install` / `list`). The
shipped product depends only on `commander`, `chalk`, and `@inquirer/prompts` — there is no
runtime dependency on Energy.

This repo is dual-purpose: it is both the product (the CLI in `src/`) and an agent-native
harness (`.claude/`, `brain/`, `memory/`, `identity/`, `eval/`) that Claude Code uses to keep
improving that product. It was forged from the Energy platform via the CP103 harness-forge
recipe and decoupled (zero `@energy/*` references, no monorepo `workspace:` refs) so it can
live and ship on its own. The operating model is co-founder mode: act, don't ask; test as a
user; self-improve every session; one source of truth per topic.

See [[MOC - skillsmith]] for the full navigation graph and [[ORG_MEMORY]] for what the fleet
has learned.
