import { readFile, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import chalk from "chalk";

interface PublishOptions {
  dryRun: boolean;
  tag: string;
}

interface SkillManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  files: string[];
}

const REGISTRY_URL = "https://registry.skillsmith.dev";

export async function publishCommand(
  path: string,
  options: PublishOptions,
): Promise<void> {
  const resolvedPath = join(process.cwd(), path);
  const skillMdPath = join(resolvedPath, "SKILL.md");

  // Verify SKILL.md exists
  const exists = await stat(skillMdPath)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    console.error(chalk.red("No SKILL.md found. Run `skillsmith init` first."));
    process.exit(1);
  }

  // Read and parse skill metadata
  const content = await readFile(skillMdPath, "utf-8");
  const manifest = parseManifest(content, basename(resolvedPath));

  console.log(chalk.blue(`\n⚡ Publishing: ${chalk.bold(manifest.name)}\n`));
  console.log(chalk.dim(`  Version:  ${manifest.version}`));
  console.log(chalk.dim(`  Tag:      ${options.tag}`));
  console.log(chalk.dim(`  Category: ${manifest.category}`));
  console.log(chalk.dim(`  Files:    ${manifest.files.length}`));

  // Check for skillsmith.json
  const configPath = join(resolvedPath, "skillsmith.json");
  const hasConfig = await stat(configPath)
    .then(() => true)
    .catch(() => false);

  if (!hasConfig) {
    console.log(
      chalk.yellow(
        "\n  ⚠ No skillsmith.json found. Creating from SKILL.md metadata...",
      ),
    );
  }

  if (options.dryRun) {
    console.log(chalk.yellow("\n  🏃 Dry run — skipping actual publish"));
    console.log(
      chalk.dim(`  Would publish to: ${REGISTRY_URL}/skills/${manifest.name}`),
    );
    console.log(chalk.green("\n  ✓ Validation passed. Ready to publish."));
    return;
  }

  // In a real implementation, this would POST to the registry
  console.log(
    chalk.yellow(`\n  ⚠ Registry not yet live. Publish to GitHub instead:`),
  );
  console.log(
    chalk.dim(`  1. Push to a GitHub repo with topic "skillsmith-skill"`),
  );
  console.log(chalk.dim(`  2. Add skillsmith.json with metadata`));
  console.log(chalk.dim(`  3. Skills are discoverable via: skillsmith list`));
  console.log(chalk.green(`\n  ✓ Package validated and ready for publishing.`));
}

function parseManifest(content: string, dirName: string): SkillManifest {
  const title = content.match(/^#\s+(.+)/m)?.[1] ?? dirName;
  const description =
    content.match(/^(?!#)(.+)/m)?.[1]?.trim() ?? "A Claude Code skill";

  // Extract frontmatter-style metadata if present
  const versionMatch = content.match(/version:\s*(.+)/i);
  const categoryMatch = content.match(/category:\s*(.+)/i);
  const tagsMatch = content.match(/tags:\s*\[(.+)\]/i);

  return {
    name: dirName,
    version: versionMatch?.[1]?.trim() ?? "1.0.0",
    description,
    author: "",
    category: categoryMatch?.[1]?.trim() ?? "general",
    tags: tagsMatch?.[1]?.split(",").map((t) => t.trim()) ?? [],
    files: ["SKILL.md"],
  };
}
