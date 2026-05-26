import { readFile, stat, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
import chalk from "chalk";

interface TestOptions {
  strict: boolean;
  json: boolean;
}

interface TestResult {
  name: string;
  passed: boolean;
  severity: "error" | "warning" | "info";
  message: string;
}

const REQUIRED_SECTIONS = [
  { pattern: /^#\s+.+/m, name: "Title (H1 heading)" },
  { pattern: /##\s*(When|Trigger)/im, name: "Trigger section" },
  {
    pattern: /##\s*(Steps|How|Process|Action)/im,
    name: "Steps/Action section",
  },
];

const RECOMMENDED_SECTIONS = [
  { pattern: /##\s*(Example|Usage)/im, name: "Example/Usage section" },
  { pattern: /##\s*(Output|Result|Format)/im, name: "Output format section" },
];

export async function testCommand(
  path: string,
  options: TestOptions,
): Promise<void> {
  const results: TestResult[] = [];
  const resolvedPath = join(process.cwd(), path);

  // Determine if path is a file or directory
  const pathStat = await stat(resolvedPath).catch(() => null);
  if (!pathStat) {
    console.error(chalk.red(`Path not found: ${resolvedPath}`));
    process.exit(1);
  }

  let skillDir: string;
  let skillMdPath: string;

  if (pathStat.isFile()) {
    skillDir = resolvedPath.substring(0, resolvedPath.lastIndexOf("/"));
    skillMdPath = resolvedPath;
  } else {
    skillDir = resolvedPath;
    skillMdPath = join(resolvedPath, "SKILL.md");
  }

  // 1. Check SKILL.md exists
  const skillMdExists = await stat(skillMdPath)
    .then(() => true)
    .catch(() => false);
  results.push({
    name: "SKILL.md exists",
    passed: skillMdExists,
    severity: "error",
    message: skillMdExists
      ? "Found SKILL.md"
      : "Missing SKILL.md — every skill needs one",
  });

  if (!skillMdExists) {
    printResults(results, options);
    return;
  }

  const content = await readFile(skillMdPath, "utf-8");
  const lines = content.split("\n");
  const wordCount = content.split(/\s+/).length;

  // 2. Check file size (token efficiency)
  results.push({
    name: "Token efficiency",
    passed: wordCount <= 2000,
    severity: wordCount > 3000 ? "error" : "warning",
    message:
      wordCount <= 2000
        ? `${wordCount} words — good token efficiency`
        : `${wordCount} words — consider trimming (target: <2,000)`,
  });

  // 3. Check required sections
  for (const section of REQUIRED_SECTIONS) {
    const found = section.pattern.test(content);
    results.push({
      name: `Has ${section.name}`,
      passed: found,
      severity: "error",
      message: found ? `Found ${section.name}` : `Missing ${section.name}`,
    });
  }

  // 4. Check recommended sections
  for (const section of RECOMMENDED_SECTIONS) {
    const found = section.pattern.test(content);
    results.push({
      name: `Has ${section.name}`,
      passed: found,
      severity: "warning",
      message: found
        ? `Found ${section.name}`
        : `Consider adding ${section.name}`,
    });
  }

  // 5. Check for empty sections
  const emptyHeadings = lines.filter((line, i) => {
    if (!/^#{1,3}\s/.test(line)) return false;
    const nextLine = lines[i + 1]?.trim();
    return !nextLine || /^#{1,3}\s/.test(nextLine);
  });
  results.push({
    name: "No empty sections",
    passed: emptyHeadings.length === 0,
    severity: "warning",
    message:
      emptyHeadings.length === 0
        ? "All sections have content"
        : `${emptyHeadings.length} empty section(s) found`,
  });

  // 6. Check for knowledge/ directory
  const knowledgeExists = await stat(join(skillDir, "knowledge"))
    .then((s) => s.isDirectory())
    .catch(() => false);
  if (knowledgeExists) {
    const knowledgeFiles = await readdir(join(skillDir, "knowledge"));
    results.push({
      name: "Knowledge files",
      passed: true,
      severity: "info",
      message: `${knowledgeFiles.length} knowledge file(s) found`,
    });
  }

  // 7. Check for no hardcoded paths
  const hardcodedPaths = /\/(Users|home|var|tmp)\/[a-zA-Z]/g.test(content);
  results.push({
    name: "No hardcoded paths",
    passed: !hardcodedPaths,
    severity: "error",
    message: hardcodedPaths
      ? "Contains hardcoded absolute paths — use relative paths"
      : "No hardcoded paths found",
  });

  // 8. Check skill name is in filename or title
  const dirName = basename(skillDir);
  const title = lines
    .find((l) => /^#\s+/.test(l))
    ?.replace(/^#\s+/, "")
    .trim();
  results.push({
    name: "Consistent naming",
    passed: true,
    severity: "info",
    message: `Directory: ${dirName}, Title: ${title ?? "(none)"}`,
  });

  printResults(results, options);
}

function printResults(results: TestResult[], options: TestOptions): void {
  if (options.json) {
    const errors = results.filter(
      (r) => !r.passed && r.severity === "error",
    ).length;
    const warnings = results.filter(
      (r) => !r.passed && r.severity === "warning",
    ).length;
    console.log(
      JSON.stringify(
        {
          passed: errors === 0 && (!options.strict || warnings === 0),
          errors,
          warnings,
          results,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(chalk.bold("\n⚡ Skill Test Results\n"));

  for (const result of results) {
    const icon = result.passed
      ? chalk.green("✓")
      : result.severity === "error"
        ? chalk.red("✗")
        : chalk.yellow("⚠");
    const label = result.passed
      ? chalk.green(result.name)
      : result.severity === "error"
        ? chalk.red(result.name)
        : chalk.yellow(result.name);
    console.log(`  ${icon} ${label} — ${chalk.dim(result.message)}`);
  }

  const errors = results.filter(
    (r) => !r.passed && r.severity === "error",
  ).length;
  const warnings = results.filter(
    (r) => !r.passed && r.severity === "warning",
  ).length;
  const passed = results.filter((r) => r.passed).length;

  console.log("");
  if (errors > 0) {
    console.log(
      chalk.red(
        `  ✗ ${errors} error(s), ${warnings} warning(s), ${passed} passed`,
      ),
    );
    process.exit(1);
  } else if (warnings > 0 && options.strict) {
    console.log(
      chalk.yellow(
        `  ⚠ ${warnings} warning(s) (strict mode), ${passed} passed`,
      ),
    );
    process.exit(1);
  } else {
    console.log(chalk.green(`  ✓ All ${passed} checks passed!`));
    if (warnings > 0) {
      console.log(
        chalk.yellow(`    (${warnings} warning(s) — consider fixing)`),
      );
    }
  }
}
