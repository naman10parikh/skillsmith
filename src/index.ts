#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { testCommand } from "./commands/test.js";
import { publishCommand } from "./commands/publish.js";
import { installCommand } from "./commands/install.js";
import { listCommand } from "./commands/list.js";
import { memorySearchCommand } from "./commands/memory-search.js";
import { sandboxRunCommand } from "./commands/sandbox-run.js";
import { logRun } from "./observability/runs.js";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const program = new Command();

/**
 * Wrap a command that changes files so every run lands in the audit trail
 * (~/.skillsmith/runs.jsonl, or SKILLSMITH_RUNS_FILE). It logs on process exit,
 * so a command that calls process.exit(1) is recorded as a failure too.
 */
function audited<A extends unknown[]>(
  cmd: string,
  action: (...args: A) => Promise<void>,
): (...args: A) => Promise<void> {
  return async (...args: A) => {
    const started = Date.now();
    const positional = args.filter((a): a is string => typeof a === "string");
    process.once("exit", (code) =>
      logRun({ cmd, args: { positional }, ok: code === 0, durationMs: Date.now() - started }),
    );
    await action(...args);
  };
}

program
  .name("skillsmith")
  .description(
    "Create, test and vet SKILL.md skills for any coding agent.",
  )
  .version("1.0.0");

program
  .command("init")
  .description("Scaffold a new Claude Code skill with best practices")
  .argument("[name]", "Skill name (kebab-case)")
  .option(
    "-t, --template <type>",
    "Template type: basic, advanced, mcp",
    "basic",
  )
  .option("-d, --dir <path>", "Output directory", ".")
  .action(audited("init", initCommand));

program
  .command("test")
  .description("Validate a skill against the Claude Code skill spec")
  .argument("[path]", "Path to skill directory or SKILL.md", ".")
  .option("--strict", "Fail on warnings too", false)
  .option("--json", "Output results as JSON", false)
  .action(testCommand);

program
  .command("publish")
  .description("Validate a skill for sharing (the shared registry is not live yet)")
  .argument("[path]", "Path to skill directory", ".")
  .option("--dry-run", "Validate without publishing", false)
  .option("--tag <tag>", "Version tag", "latest")
  .action(audited("publish", publishCommand));

program
  .command("install")
  .description("Install a starter skill from the built-in catalog into your project")
  .argument("<name>", "Skill name to install")
  .option("-g, --global", "Install to ~/.claude/skills/", false)
  .option("--dir <path>", "Custom install directory")
  .action(audited("install", installCommand));

program
  .command("list")
  .description("Browse the built-in skill catalog")
  .option("-c, --category <cat>", "Filter by category")
  .option("--json", "Output as JSON", false)
  .option("--limit <n>", "Max results", "20")
  .action(listCommand);

program
  .command("memory-search")
  .description(
    "BM25 search over skillsmith's own knowledge corpus (brain/, memory/, identity/, docs)",
  )
  .argument("<query>", "Search query")
  .option("-n, --limit <n>", "Max results", "5")
  .option("--json", "Output results as JSON", false)
  .action(memorySearchCommand);

program
  .command("sandbox-run")
  .description(
    "Validate an untrusted skill inside an isolated E2B sandbox (Firecracker microVM)",
  )
  .argument("[path]", "Path to skill directory or SKILL.md", ".")
  .option("-t, --template <id>", "E2B sandbox template", "base")
  .option("--json", "Output results as JSON", false)
  .action(sandboxRunCommand);

program
  .command("mcp")
  .description("Start the skillsmith MCP server (JSON-RPC 2.0 over stdio)")
  .action(() => {
    // Re-exec the MCP server entry point so it owns stdin/stdout exclusively.
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const serverPath = join(__dirname, "mcp", "server.js");
    const child = spawn(process.execPath, [serverPath], { stdio: "inherit" });
    child.on("exit", (code) => process.exit(code ?? 0));
  });

program.parse();
