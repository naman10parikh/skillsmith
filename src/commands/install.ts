import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import chalk from "chalk";
import { CATALOG } from "../catalog.js";

interface InstallOptions {
  global: boolean;
  dir?: string;
}

const REGISTRY_URL = "https://registry.skillsmith.dev";


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
  const catalogEntry = CATALOG.find((s) => s.name === name);

  if (!catalogEntry) {
    // The shared registry is not live, so the starter catalog is the only source.
    console.log(
      chalk.yellow(`  ⚠ Skill "${name}" is not in the starter catalog.`),
    );
    console.log(
      chalk.dim(
        `  Available skills: ${CATALOG.map((s) => s.name).join(", ")}`,
      ),
    );
    console.log(chalk.dim(`  Run: skillsmith list`));
    process.exitCode = 1;
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
