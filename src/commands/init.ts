import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { input, select } from "@inquirer/prompts";
import {
  getBasicTemplate,
  getAdvancedTemplate,
  getMcpTemplate,
} from "../templates/index.js";

interface InitOptions {
  template: "basic" | "advanced" | "mcp";
  dir: string;
}

export async function initCommand(
  name: string | undefined,
  options: InitOptions,
): Promise<void> {
  const skillName =
    name ??
    (await input({
      message: "Skill name (kebab-case):",
      validate: (v) =>
        /^[a-z][a-z0-9-]*$/.test(v) || "Use kebab-case (e.g., my-skill)",
    }));

  const template =
    options.template ??
    (await select({
      message: "Template:",
      choices: [
        { name: "Basic — single SKILL.md", value: "basic" as const },
        {
          name: "Advanced — SKILL.md + knowledge/ + examples/",
          value: "advanced" as const,
        },
        { name: "MCP — skill that wraps an MCP server", value: "mcp" as const },
      ],
    }));

  const dir = join(options.dir, skillName);

  console.log(
    chalk.blue(
      `\n⚡ Scaffolding skill: ${chalk.bold(skillName)} (${template})\n`,
    ),
  );

  await mkdir(dir, { recursive: true });

  const files = getTemplateFiles(skillName, template);

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = join(dir, filePath);
    const parentDir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    if (parentDir !== dir) {
      await mkdir(parentDir, { recursive: true });
    }
    await writeFile(fullPath, content, "utf-8");
    console.log(chalk.green(`  ✓ ${filePath}`));
  }

  console.log(chalk.green(`\n✅ Skill "${skillName}" created at ${dir}`));
  console.log(chalk.dim(`\nNext steps:`));
  console.log(
    chalk.dim(`  1. Edit ${skillName}/SKILL.md with your skill logic`),
  );
  console.log(chalk.dim(`  2. Run: skillsmith test ${dir}`));
  console.log(chalk.dim(`  3. Run: skillsmith publish ${dir}`));
}

function getTemplateFiles(
  name: string,
  template: "basic" | "advanced" | "mcp",
): Record<string, string> {
  switch (template) {
    case "basic":
      return getBasicTemplate(name);
    case "advanced":
      return getAdvancedTemplate(name);
    case "mcp":
      return getMcpTemplate(name);
  }
}
