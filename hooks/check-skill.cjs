#!/usr/bin/env node
/**
 * check-skill: a PostToolUse hook for Edit, Write and MultiEdit.
 *
 * After an agent writes or edits a SKILL.md, it runs the checks that decide whether another agent can
 * find and follow the skill: frontmatter with name and description, a title, a trigger section, a
 * steps section, no absolute paths from someone's machine, and a size limit. The rules are the error
 * checks of `skillsmith test`, so the hook and the CLI agree (eval/golden.eval.ts checks that). It
 * never blocks and never edits the file. It is self-contained, so it runs from a plugin checkout
 * without a build.
 *
 * Input: the hook JSON on stdin. Output: {} or an additionalContext note.
 * Test: echo '{"tool_name":"Write","tool_input":{"file_path":"skills/write-a-skill/SKILL.md"}}' | node hooks/check-skill.cjs
 */
const fs = require("fs");
const path = require("path");

function problems(content) {
  const found = [];
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!fm || !/^name:\s*\S/m.test(fm[1]) || !/^description:\s*\S/m.test(fm[1])) {
    found.push("frontmatter with name and description (agents use them to find the skill)");
  }
  if (!/^#\s+.+/m.test(content)) found.push("a title (an H1 heading)");
  if (!/##\s*(When|Trigger)/im.test(content)) found.push("a trigger section (## When to Use)");
  if (!/##\s*(Steps|How|Process|Action)/im.test(content)) found.push("a steps section (## Steps)");
  if (/\/(Users|home|var|tmp)\/[a-zA-Z]/.test(content)) found.push("no absolute paths from one machine (use relative paths)");
  const words = content.split(/\s+/).length;
  if (words > 3000) found.push(`a size under 3,000 words (it has ${words}; aim for 2,000)`);
  return found;
}

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let note = "";
  try {
    const { tool_input: input } = JSON.parse(raw || "{}");
    const given = String(input?.file_path ?? "");
    if (path.basename(given) === "SKILL.md") {
      const file = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd(), given);
      if (fs.existsSync(file)) {
        const missing = problems(fs.readFileSync(file, "utf8"));
        if (missing.length) {
          note = `skillsmith: ${given} needs ${missing.join("; ")}. Fix these before moving on, then run \`skillsmith test ${path.dirname(given)} --strict\` for the full check.`;
        }
      }
    }
  } catch {
    note = ""; // a hook must never break the agent's turn
  }
  process.stdout.write(
    note ? JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: note } }) + "\n" : "{}\n",
  );
});
