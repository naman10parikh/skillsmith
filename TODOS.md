# skillsmith — TODOS

Community and maintainer roadmap. Check items as they land; unchecked items are open for contributions.

## Legend

- `[x]` Done (merged)
- `[ ]` Open — contributions welcome
- `[~]` In progress

---

## PKG — Package / Registry (npm `@energy/skillsmith`)

- [x] **PKG-01** Scope package name to `@energy/skillsmith` (`package.json` line 3)
- [x] **PKG-02** Set `publishConfig.access: "public"` so scoped package publishes publicly
- [x] **PKG-03** Wire `exports[./mcp]` to `dist/mcp/server.js` for MCP consumers
- [x] **PKG-04** Include `.claude-plugin` in `files[]` so the plugin bundle ships with the npm tarball
- [ ] **PKG-05** *(chairman-blocked)* Claim the `@energy` npm org at https://www.npmjs.com/org/create — required before `npm publish` succeeds for the scoped name
- [ ] **PKG-06** *(chairman-blocked)* Run first publish: `npm publish --access public` after `@energy` org is live
- [ ] **PKG-07** Add `"repository.directory": "."` sub-path for monorepo consumers if skillsmith moves into a workspace

## REG — Registry service (registry.skillsmith.dev)

- [x] **REG-01** Stub + document registry API contract in `src/mcp/registry.ts` (typed interfaces + HTTP helpers)
- [ ] **REG-02** *(chairman-blocked)* Deploy backing service — simplest option: a GitHub repo at `github.com/energy/skillsmith-registry` with an `index.json` served via raw/CDN; update `REGISTRY_URL` constants in `src/commands/publish.ts`, `list.ts`, `install.ts`, and `src/mcp/registry.ts`
- [ ] **REG-03** Add `skillsmith update` command to refresh the local catalog from the live registry
- [ ] **REG-04** Implement auth token flow for `skillsmith publish` — currently validates manifest but does not POST (registry not live)
- [ ] **REG-05** Community skill submissions: document how to submit a skill via PR to the registry repo

## MCP — MCP server (`skillsmith mcp` / `skillsmith-mcp`)

- [x] **MCP-01** Create `src/mcp/server.ts` — JSON-RPC 2.0 over stdio, 4 tools: `skillsmith_init`, `skillsmith_test`, `skillsmith_list`, `skillsmith_validate_spec`
- [x] **MCP-02** Wire `skillsmith mcp` subcommand in `src/index.ts` (re-execs `dist/mcp/server.js`)
- [x] **MCP-03** `skillsmith-mcp` binary in `package.json bin{}` → `dist/mcp/server.js`
- [x] **MCP-04** `exports["./mcp"]` in `package.json` for programmatic consumers
- [ ] **MCP-05** Add `skillsmith_install` tool to MCP server (install a skill from registry into `.claude/skills/`)
- [ ] **MCP-06** Add `skillsmith_publish` tool (dry-run by default; full publish when auth token available)
- [ ] **MCP-07** Integration test: spawn `node dist/mcp/server.js`, send `{"jsonrpc":"2.0","id":1,"method":"tools/list"}`, assert response shape
- [ ] **MCP-08** Publish to the official MCP server registry once `@energy` npm org is live

## PLUGIN — `.claude-plugin` bundle

- [x] **PLG-01** Create `.claude-plugin/manifest.json` with `type: "mcp"`, tool list, permission declarations, `mcpServer` launch config
- [ ] **PLG-02** Add `assets/icon.png` (512×512, referenced in manifest `icon` field)
- [ ] **PLG-03** Add `.claude-plugin/README.md` — plugin-specific install instructions for Claude Code marketplace
- [ ] **PLG-04** *(chairman-blocked)* Submit to Claude Code plugin marketplace once `@energy` npm org is live and package is published

## EVAL — Eval harness

- [ ] **EVAL-01** Layer in golden tasks under `eval/` (L3 evals): `init → test → validate` end-to-end pipeline
- [ ] **EVAL-02** Add a `pnpm eval` script that runs golden tasks and reports pass/fail
- [ ] **EVAL-03** Connect to AutoLab (Energy) for nightly harness self-improvement runs

## TEST — Test coverage

- [x] **TEST-01** Vitest suite for template generation (11 tests)
- [x] **TEST-02** Vitest suite for skill validation logic (7 tests)
- [x] **TEST-03** Vitest suite for MCP server logic + registry types + plugin manifest (7 tests)
- [ ] **TEST-04** Integration test: `skillsmith init + test` pipeline in a real temp directory
- [ ] **TEST-05** MCP protocol integration test (spawn + JSON-RPC handshake)

## DOCS

- [ ] **DOC-01** Add `.mcp.json` snippet to README showing how to add skillsmith as an MCP server
- [ ] **DOC-02** Add `.claude-plugin` install instructions to README
- [ ] **DOC-03** Document registry API endpoints (once REG-02 lands)

---

*Last updated: 2026-06-03 (CP117 WAVE-D — MCP server + .claude-plugin + registry stub)*
