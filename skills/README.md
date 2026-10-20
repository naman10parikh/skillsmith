# skills/

Skillsmith's own skills, one folder per skill (`skills/<name>/SKILL.md`). The Claude Code plugin
loads this folder, and any agent that reads Agent Skills can install one skill from it. Each one
passes `skillsmith test --strict`; golden case E11 keeps it that way.

| Skill | Use it when |
| --- | --- |
| [write-a-skill](write-a-skill/SKILL.md) | Someone asks for a new skill, or keeps repeating the same instructions. |
| [vet-untrusted-skill](vet-untrusted-skill/SKILL.md) | A skill comes from outside your own repositories and you are about to install it. |
| [audit-skill-library](audit-skill-library/SKILL.md) | Agents ignore skills that exist, or a skills folder needs a clean-up. |

The skills under `.claude/skills/` are a general maintainer toolkit shared across the fleet; the
three above are written for Skillsmith's job. See the hub
[`brain/MOC - skillsmith.md`](../brain/MOC%20-%20skillsmith.md).
