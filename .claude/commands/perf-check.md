Performance analysis of the skillsmith CLI.

1. **Build output**: Run `pnpm build` and check `dist/` output sizes
2. **TypeScript compilation**: Time `pnpm lint` (`tsc --noEmit`)
3. **Import analysis**: Find circular imports and large import chains
4. **CLI startup**: Time `node dist/index.js --help` cold start; check dependency load cost
5. **Command latency**: Check `init`/`test`/`list` for unnecessary filesystem/network calls
6. **Bundle weight**: Audit dependency tree (`commander`, `chalk`, `@inquirer/prompts`) for bloat

Focus on the critical path: user runs `skillsmith <command>` → sees output.

Output findings ranked by impact (highest first) with specific fix suggestions.

Do NOT modify any files. Analyze only.
