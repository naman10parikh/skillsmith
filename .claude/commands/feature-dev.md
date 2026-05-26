Full feature development lifecycle for: $ARGUMENTS

## Process

### 1. Research Phase

- Check if similar feature exists in the codebase
- Search ecosystem repos for reference implementations (use /ecosystem-reference skill)
- Review VISION.md for architectural guidance
- Check memory/LEARNINGS.md for relevant past learnings

### 2. Plan Phase

- Break the feature into tasks (use TodoWrite)
- Identify files that need modification
- Choose the right approach: direct implementation, sub-agents, or Agent Teams with worktrees
- If >3 files change across different domains → use Agent Teams with worktree isolation

### 3. Implement Phase

- Write TypeScript strict mode code (no `any`, no default exports)
- Follow existing patterns in the codebase
- Keep files under 400 lines
- Add comments only for non-obvious intent

### 4. Test Phase

- Run `pnpm lint` (`tsc --noEmit` TypeScript check)
- Run `pnpm build` (build check)
- Run `pnpm test` (vitest)
- Verify the CLI works end-to-end: `node dist/index.js --help` and exercise the changed command

### 5. Ship Phase

- Commit with conventional commit message
- Push to main (auto-deploys via GitHub Action)
- Curl production endpoint to verify
- Screenshot production if UI feature
- Update daily log with what was done

Do NOT skip any phase. One feature at a time. Ship it before starting the next.
