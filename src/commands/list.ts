import chalk from "chalk";

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

// Curated registry — grows as community publishes skills
const REGISTRY: SkillEntry[] = [
  {
    name: "commit-msg",
    description: "Auto-generate conventional commit messages",
    category: "git",
    stars: 0,
    downloads: 0,
  },
  {
    name: "test-generator",
    description: "Generate Vitest/Jest tests from source files",
    category: "testing",
    stars: 0,
    downloads: 0,
  },
  {
    name: "api-scaffolder",
    description: "Scaffold REST/GraphQL endpoints with validation",
    category: "backend",
    stars: 0,
    downloads: 0,
  },
  {
    name: "refactor-guide",
    description: "Step-by-step refactoring with safety checks",
    category: "code-quality",
    stars: 0,
    downloads: 0,
  },
  {
    name: "debug-assistant",
    description: "Systematic debugging with hypothesis testing",
    category: "debugging",
    stars: 0,
    downloads: 0,
  },
  {
    name: "pr-reviewer",
    description: "Automated code review checklist for pull requests",
    category: "code-quality",
    stars: 0,
    downloads: 0,
  },
  {
    name: "migration-planner",
    description: "Plan and execute database/API migrations safely",
    category: "backend",
    stars: 0,
    downloads: 0,
  },
  {
    name: "accessibility-audit",
    description: "WCAG compliance checker for web components",
    category: "frontend",
    stars: 0,
    downloads: 0,
  },
  {
    name: "perf-profiler",
    description: "Performance bottleneck detection and fix suggestions",
    category: "performance",
    stars: 0,
    downloads: 0,
  },
  {
    name: "doc-generator",
    description: "Generate API docs, READMEs, and changelogs",
    category: "documentation",
    stars: 0,
    downloads: 0,
  },
];

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
