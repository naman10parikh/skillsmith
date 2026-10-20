---
name: write-a-skill
description: Write a new Agent Skill (a SKILL.md) that coding agents will find and follow, then check it with skillsmith. Use when someone asks to "make a skill", to "teach the agent to always do X", or to turn instructions they keep repeating into a reusable skill.
---

# Write a Skill

An Agent Skill is one folder with a `SKILL.md`. Claude Code, Gemini CLI, Codex and other agents read
its frontmatter `description` to decide when to load it, then follow its steps. A skill that is hard
to find, or vague to follow, never gets used. This skill writes one that is easy to find and easy to
follow.

## When to Use

- Someone asks for a new skill, or for the agent to "always do X this way".
- The same set of instructions has been typed into a chat more than twice.
- A skill exists but agents never pick it up, because its description does not say when to use it.

## Steps

1. **Scaffold it.** Run `npx -y -p github:naman10parikh/skillsmith skillsmith init <name>`. Add
   `-t advanced` for reference files in `knowledge/`, or `-t mcp` for a skill that drives an MCP
   server. The name is kebab-case and becomes the folder name.
2. **Write the description first.** In the frontmatter, say what the skill does and, in the same
   line, when to use it: "Use when ...". Put in the words a user would actually type. This line is
   all an agent sees before it decides to load the skill.
3. **Fill the sections.** `## When to Use` lists the triggers. `## Steps` is a numbered list of
   actions with the exact commands. `## Example` shows one real request and what the agent does.
   `## Output` says what the agent reports back.
4. **Keep it short.** Stay under 2,000 words. Move long reference material into `knowledge/` and
   point to it. Use relative paths only, never a path from your own machine.
5. **Check it.** Run `skillsmith test <folder> --strict` and fix every error and warning. Add
   `--json` for a result a script can read; it exits 1 when the skill fails.
6. **Install it where agents look.** Copy the folder into `.claude/skills/` for one project, or into
   `~/.claude/skills/` for every project. Start a new session and ask for the task in plain words to
   see the agent pick the skill up.

## Example

Request: "Make a skill so the agent always writes changelog entries the same way."

1. `skillsmith init changelog-entry`
2. Description: "Write a CHANGELOG.md entry in Keep a Changelog form. Use when a change is merged or
   someone asks to update the changelog."
3. Steps: read the diff, pick Added, Changed or Fixed, write one line per change, link the pull
   request.
4. `skillsmith test changelog-entry --strict` prints `All 11 checks passed!`

## Output

The path of the new skill folder, the `skillsmith test --strict` result with every check passed, and
one sentence a user can type to trigger the skill.
