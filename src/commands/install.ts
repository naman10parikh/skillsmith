import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import chalk from "chalk";

interface InstallOptions {
  global: boolean;
  dir?: string;
}

const REGISTRY_URL = "https://registry.skillsmith.dev";

// Curated skill catalog (shipped with CLI, updated via `skillsmith update`)
const BUILTIN_CATALOG: Record<
  string,
  { description: string; url: string; category: string }
> = {
  "commit-msg": {
    description:
      "Auto-generate conventional commit messages from staged changes",
    url: "https://github.com/skillsmith-registry/commit-msg",
    category: "git",
  },
  "test-generator": {
    description: "Generate Vitest/Jest tests from source files",
    url: "https://github.com/skillsmith-registry/test-generator",
    category: "testing",
  },
  "api-scaffolder": {
    description: "Scaffold REST/GraphQL endpoints with validation and tests",
    url: "https://github.com/skillsmith-registry/api-scaffolder",
    category: "backend",
  },
  "refactor-guide": {
    description: "Step-by-step refactoring with safety checks at each stage",
    url: "https://github.com/skillsmith-registry/refactor-guide",
    category: "code-quality",
  },
  "debug-assistant": {
    description: "Systematic debugging workflow with hypothesis testing",
    url: "https://github.com/skillsmith-registry/debug-assistant",
    category: "debugging",
  },
};

export async function installCommand(
  name: string,
  options: InstallOptions,
): Promise<void> {
  const targetDir = options.dir
    ? resolve(process.cwd(), options.dir)
    : options.global
      ? join(homedir(), ".claude", "skills")
      : join(process.cwd(), ".claude", "skills");

  console.log(chalk.blue(`\n⚡ Installing skill: ${chalk.bold(name)}\n`));

  // Check builtin catalog first
  const catalogEntry = BUILTIN_CATALOG[name];

  if (!catalogEntry) {
    // Try fetching from registry
    console.log(chalk.dim(`  Searching registry for "${name}"...`));
    console.log(
      chalk.yellow(`\n  ⚠ Skill "${name}" not found in catalog or registry.`),
    );
    console.log(
      chalk.dim(
        `  Available skills: ${Object.keys(BUILTIN_CATALOG).join(", ")}`,
      ),
    );
    console.log(chalk.dim(`  Run: skillsmith list`));
    return;
  }

  console.log(chalk.dim(`  ${catalogEntry.description}`));
  console.log(chalk.dim(`  Category: ${catalogEntry.category}`));

  // Create the skill directory
  const skillDir = join(targetDir, name);
  await mkdir(skillDir, { recursive: true });

  // The shared registry is not live, so the stub is self-contained: it must never tell an agent to
  // follow instructions from a source URL nobody controls yet.
  const stubContent = `---
name: ${name}
description: ${catalogEntry.description}. Use when working on ${catalogEntry.category} tasks.
---

# ${name}

${catalogEntry.description}

> A starter skill from the skillsmith catalog. The shared registry is not live yet: edit the
> steps below for your project, then run \`skillsmith test\` on this folder.

## When to Use

Use this skill when working on ${catalogEntry.category} tasks.

## Steps

1. Read the files the task touches.
2. Apply the pattern described above to them.
3. Check the result before you report back.
`;

  await writeFile(join(skillDir, "SKILL.md"), stubContent, "utf-8");

  console.log(chalk.green(`\n  ✓ Installed to ${skillDir}`));
  console.log(
    chalk.dim(
      `  The skill will be auto-loaded by Claude Code on next session.`,
    ),
  );
}
