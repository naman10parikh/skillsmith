---
name: audit-skill-library
description: Check every skill in a skills folder with skillsmith and fix what stops agents from finding or following them, worst first. Use when agents ignore skills that exist, after copying skills between projects, or when someone asks to audit, clean up or check a set of skills.
---

# Audit a Skill Library

Skills pile up. They get copied from other projects, written for an older agent, or saved without
the frontmatter an agent needs to find them. This skill checks a whole folder at once and fixes the
failures that matter most.

## When to Use

- An agent does not pick up a skill that exists.
- Skills were copied in from another repository, or from another agent's format.
- Someone asks to audit, clean up or check the skills in a project.

## Steps

1. **Find the skills.** List every folder with a `SKILL.md` under the target, such as
   `.claude/skills/`, `skills/` or `~/.claude/skills/`.
2. **Check each one.** Run `skillsmith test <folder> --json` and collect `passed`, `errors`,
   `warnings` and the failed checks. The command exits 1 when a skill fails, so a shell loop can
   list the failures:
   `for d in .claude/skills/*/; do skillsmith test "$d" --json > /dev/null || echo "FAIL $d"; done`
3. **Sort by harm.** First, missing frontmatter (`name` and `description`): the agent cannot find the
   skill at all. Next, a missing trigger or steps section: the agent finds it but cannot follow it.
   Then absolute paths from someone's machine, then size over 2,000 words, then warnings.
4. **Fix the top ones.** Add frontmatter whose description says when to use the skill, add the
   missing sections, and swap absolute paths for relative ones. Change only what the check names.
5. **Check again.** Repeat step 2 until every skill passes, or list the ones left and why.

## Example

Request: "Our agents ignore half the skills in this repository."

1. 26 skills found under `.claude/skills/`, and 9 fail.
2. 7 of the 9 have no frontmatter; 2 carry a path from the author's machine.
3. Frontmatter added to 7 and paths made relative in 2. The second run shows 26 of 26 passing.

## Output

A table with one row per skill (its name, passed or failed, and the failed checks), then what was
fixed and anything left, with the reason.
