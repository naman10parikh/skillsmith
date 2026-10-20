import chalk from "chalk";
import { CATALOG } from "../catalog.js";

interface ListOptions {
  category?: string;
  json: boolean;
  limit: string;
}

interface SkillEntry {
  name: string;
  description: string;
  category: string;
  stars: number;
  downloads: number;
}

// The built-in catalog (src/catalog.ts). Stars and downloads stay 0 until the shared registry is live.
const REGISTRY: SkillEntry[] = CATALOG.map((s) => ({ ...s, stars: 0, downloads: 0 }));

export async function listCommand(options: ListOptions): Promise<void> {
  let skills = REGISTRY;

  if (options.category) {
    skills = skills.filter(
      (s) => s.category.toLowerCase() === options.category!.toLowerCase(),
    );
  }

  const limit = parseInt(options.limit, 10);
  skills = skills.slice(0, limit);

  if (options.json) {
    console.log(JSON.stringify(skills, null, 2));
    return;
  }

  console.log(
    chalk.bold(`\n⚡ Skillsmith Registry (${skills.length} skills)\n`),
  );

  // Group by category
  const byCategory = new Map<string, SkillEntry[]>();
  for (const skill of skills) {
    const existing = byCategory.get(skill.category) ?? [];
    existing.push(skill);
    byCategory.set(skill.category, existing);
  }

  for (const [category, categorySkills] of byCategory) {
    console.log(chalk.blue(`  ${category.toUpperCase()}`));
    for (const skill of categorySkills) {
      console.log(
        `    ${chalk.green(skill.name.padEnd(22))} ${chalk.dim(skill.description)}`,
      );
    }
    console.log("");
  }

  console.log(chalk.dim(`  Install: skillsmith install <name>`));
  console.log(chalk.dim(`  Filter:  skillsmith list -c <category>\n`));
}
