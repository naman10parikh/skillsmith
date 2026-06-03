#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { testCommand } from "./commands/test.js";
import { publishCommand } from "./commands/publish.js";
import { installCommand } from "./commands/install.js";
import { listCommand } from "./commands/list.js";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const program = new Command();

program
  .name("skillsmith")
  .description(
    "Create, test, and share Claude Code skills. The npm registry for AI agent skills.",
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
  .action(initCommand);

program
  .command("test")
  .description("Validate a skill against the Claude Code skill spec")
  .argument("[path]", "Path to skill directory or SKILL.md", ".")
  .option("--strict", "Fail on warnings too", false)
  .option("--json", "Output results as JSON", false)
  .action(testCommand);

program
  .command("publish")
  .description("Publish a skill to the skillsmith registry")
  .argument("[path]", "Path to skill directory", ".")
  .option("--dry-run", "Validate without publishing", false)
  .option("--tag <tag>", "Version tag", "latest")
  .action(publishCommand);

program
  .command("install")
  .description("Install a skill from the registry into your project")
  .argument("<name>", "Skill name to install")
  .option("-g, --global", "Install to ~/.claude/skills/", false)
  .option("--dir <path>", "Custom install directory")
  .action(installCommand);

program
  .command("list")
  .description("Browse available skills in the registry")
  .option("-c, --category <cat>", "Filter by category")
  .option("--json", "Output as JSON", false)
  .option("--limit <n>", "Max results", "20")
  .action(listCommand);

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
