# hooks/

The Claude Code plugin's hooks. [`hooks.json`](hooks.json) wires one `PostToolUse` hook,
[`check-skill.cjs`](check-skill.cjs): after an agent writes or edits a `SKILL.md`, it checks what
decides whether another agent can find and follow the skill (frontmatter with `name` and
`description`, a title, a trigger section, a steps section, no absolute paths from one machine, a
size limit) and names anything missing. It never blocks and never edits the file. Its rules are the
error checks of `skillsmith test`, and golden case E8 fails CI if the two disagree. The same hook runs
for maintainers through `.claude/settings.json`, beside the general safety hooks in `.claude/hooks/`.

Test it: `echo '{"tool_name":"Write","tool_input":{"file_path":"skills/write-a-skill/SKILL.md"}}' | node hooks/check-skill.cjs`
prints `{}` for a good skill, or a note naming what to fix.
