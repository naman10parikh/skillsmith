/**
 * The built-in starter catalog: the one list that `skillsmith list`, `skillsmith install` and the MCP tool
 * `skillsmith_list` all read. The shared registry is not live yet, so `install` writes a self-contained starter
 * SKILL.md from an entry here. Add a skill here once; golden case E15 checks that every reader agrees, that every
 * entry installs and passes `test --strict`, and that the README states the catalog's size.
 */
export interface CatalogEntry {
  name: string;
  description: string;
  category: string;
}

export const CATALOG: CatalogEntry[] = [
  { name: "commit-msg", description: "Auto-generate conventional commit messages from staged changes", category: "git" },
  { name: "test-generator", description: "Generate Vitest/Jest tests from source files", category: "testing" },
  { name: "api-scaffolder", description: "Scaffold REST/GraphQL endpoints with validation and tests", category: "backend" },
  { name: "refactor-guide", description: "Step-by-step refactoring with safety checks at each stage", category: "code-quality" },
  { name: "debug-assistant", description: "Systematic debugging workflow with hypothesis testing", category: "debugging" },
  { name: "pr-reviewer", description: "Automated code review checklist for pull requests", category: "code-quality" },
  { name: "migration-planner", description: "Plan and execute database/API migrations safely", category: "backend" },
  { name: "accessibility-audit", description: "WCAG compliance checker for web components", category: "frontend" },
  { name: "perf-profiler", description: "Performance bottleneck detection and fix suggestions", category: "performance" },
  { name: "doc-generator", description: "Generate API docs, READMEs, and changelogs", category: "documentation" },
  { name: "docs-writer", description: "Generate JSDoc and README docs", category: "documentation" },
  { name: "env-setup", description: "Environment setup and validation", category: "devops" },
];
