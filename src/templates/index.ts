export function getBasicTemplate(name: string): Record<string, string> {
  const title = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    "SKILL.md": `---
name: ${name}
description: ${title}. Use when [the one-line situation that should trigger this skill].
---

# ${title}

One-line description of what this skill does.

## When to Use

Describe the trigger conditions. When should Claude activate this skill?

- Keyword triggers (e.g., "when the user asks to...")
- File pattern triggers (e.g., "when editing *.tsx files")
- Context triggers (e.g., "when working on authentication")

## Steps

1. First, do this
2. Then do this
3. Finally, do this

## Example

\`\`\`
User: "example prompt that triggers this skill"
Claude: [expected behavior]
\`\`\`

## Output Format

Describe what the skill produces (files, terminal output, etc.)
`,
    "skillsmith.json": JSON.stringify(
      {
        name,
        version: "1.0.0",
        description: `${title} — a Claude Code skill`,
        category: "general",
        tags: [],
        author: "",
        license: "MIT",
      },
      null,
      2,
    ),
  };
}

export function getAdvancedTemplate(name: string): Record<string, string> {
  const basic = getBasicTemplate(name);
  return {
    ...basic,
    "knowledge/README.md": `# Knowledge Files

Place reference documents, cheat sheets, and context files here.
These are loaded when the skill is activated, providing Claude with
domain-specific knowledge.

## Naming Convention

- \`{topic}.md\` — general reference
- \`{topic}-examples.md\` — example collections
- \`{topic}-patterns.md\` — design patterns and anti-patterns
`,
    "knowledge/.gitkeep": "",
    "examples/basic.md": `# Basic Example

## Input

\`\`\`
User: "example prompt"
\`\`\`

## Expected Output

\`\`\`
Claude produces this output
\`\`\`

## Notes

- Key considerations for this example
`,
  };
}

export function getMcpTemplate(name: string): Record<string, string> {
  const title = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    "SKILL.md": `---
name: ${name}
description: ${title}, through the ${name} MCP server. Use when [the one-line situation that should trigger this skill].
---

# ${title}

Skill that wraps the \`${name}\` MCP server for enhanced capabilities.

## When to Use

- When the user needs [capability]
- When working with [domain]

## Prerequisites

Add the MCP server to \`.mcp.json\` (put the server's real package in place of the brackets):

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "npx",
      "args": ["-y", "[the ${name} MCP server package]"]
    }
  }
}
\`\`\`

## Steps

1. Check if MCP server is available
2. Use the MCP tools: \`${name}_tool1\`, \`${name}_tool2\`
3. Process and format results

## Example

User: "[a request this skill handles]"
Claude: calls \`${name}_tool1\`, then reports [the result]

## Available MCP Tools

| Tool | Description |
|------|-------------|
| \`${name}_tool1\` | Description |
| \`${name}_tool2\` | Description |

## Output Format

Describe the expected output format.
`,
    "skillsmith.json": JSON.stringify(
      {
        name,
        version: "1.0.0",
        description: `${title} — MCP-powered Claude Code skill`,
        category: "mcp",
        tags: ["mcp"],
        author: "",
        license: "MIT",
        mcp: {
          server: `[the ${name} MCP server package]`,
          tools: [`${name}_tool1`, `${name}_tool2`],
        },
      },
      null,
      2,
    ),
  };
}
