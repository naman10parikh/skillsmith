# eval/

Golden evals: binary pass or fail, run by `pnpm build && pnpm eval` and by CI on every push.
[`golden.eval.ts`](golden.eval.ts) holds 24 cases that run the built CLI, MCP server and plugin hook
the way a user would:

- **The validator on ten fixtures** (E3): a complete skill, no frontmatter, frontmatter without a
  description, no trigger, no steps, a path from one machine, blank lines after headings, a heading
  with nothing under it, 2,500 words and 3,100 words, each with and without `--strict`.
- **The scaffolds** (E1, E2): every `init` template passes `test --strict`.
- **The CLI surface** (E4, E5): `--json` exits 1 on a failing skill, and absolute paths work.
- **One verdict everywhere** (E6 to E9): the MCP server's two check tools and the plugin hook agree
  with the CLI on every fixture, and the server lists its four tools, even when stdin closes at once.
- **The rest** (E10 to E15): `install` writes a starter that passes and points nowhere; the
  repository's own skills pass `--strict`; every `init` and `publish` lands in the run log;
  `memory-search` finds the right skill for a plain question; `sandbox-run` without a key stops and
  says why. E15 checks that `list`, `install` and the MCP server read one catalog, that every entry
  installs and passes, and that the README gives the catalog's size.

[`baseline.json`](baseline.json) records the accepted pass count. The scheduled improvement loop
(`scripts/improve.mjs`) fails when the count drops below it and writes a proposal either way. The
unit tests live in [`tests/`](../tests/) and run with `pnpm test`.
