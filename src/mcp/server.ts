#!/usr/bin/env node
/**
 * skillsmith MCP server
 *
 * Exposes the skillsmith CLI as MCP tools so Claude Code and other MCP
 * clients can scaffold, validate, list, and install skills without leaving
 * the chat interface.
 *
 * Run:
 *   npx skillsmith-mcp          (after `npm install -g @energy/skillsmith`)
 *   node dist/mcp/server.js     (from repo root after `pnpm build`)
 *   pnpm mcp:dev                (dev mode via tsx)
 *
 * Add to .mcp.json:
 *   {
 *     "mcpServers": {
 *       "skillsmith": {
 *         "command": "npx",
 *         "args": ["-y", "@energy/skillsmith", "mcp"]
 *       }
 *     }
 *   }
 */

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { getBasicTemplate, getAdvancedTemplate, getMcpTemplate } from "../templates/index.js";

// ---------------------------------------------------------------------------
// Minimal MCP SDK types (JSON-RPC 2.0 over stdio)
// We inline the protocol shapes so there's no extra dependency.
// ---------------------------------------------------------------------------

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS: McpTool[] = [
  {
    name: "skillsmith_init",
    description:
      "Scaffold a new Claude Code skill in the given directory. Returns the generated file names.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name in kebab-case (e.g. my-skill)" },
        template: {
          type: "string",
          description: "Template: basic | advanced | mcp",
          enum: ["basic", "advanced", "mcp"],
        },
        dir: {
          type: "string",
          description: "Output directory (absolute or relative to cwd). Defaults to <cwd>/<name>.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "skillsmith_test",
    description:
      "Validate a skill directory against the Claude Code skill spec. Returns a list of checks.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path to the skill directory or SKILL.md" },
        strict: {
          type: "string",
          description: "Set to 'true' to fail on warnings too",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "skillsmith_list",
    description: "List available skills in the built-in catalog.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category (optional)" },
      },
    },
  },
  {
    name: "skillsmith_validate_spec",
    description:
      "Check a raw SKILL.md string for spec compliance without writing to disk. Useful for previewing before saving.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Raw SKILL.md content as a string" },
      },
      required: ["content"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function toolInit(params: {
  name: string;
  template?: string;
  dir?: string;
}): Promise<{ files: string[]; outputDir: string }> {
  const { name, template = "basic", dir } = params;

  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error("name must be kebab-case (e.g. my-skill)");
  }

  const outputDir = resolve(dir ?? join(process.cwd(), name));
  await mkdir(outputDir, { recursive: true });

  const files =
    template === "advanced"
      ? getAdvancedTemplate(name)
      : template === "mcp"
        ? getMcpTemplate(name)
        : getBasicTemplate(name);

  const written: string[] = [];
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = join(outputDir, filePath);
    await mkdir(join(fullPath, ".."), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
    written.push(filePath);
  }

  return { files: written, outputDir };
}

interface CheckResult {
  name: string;
  passed: boolean;
  severity: "error" | "warning" | "info";
  message: string;
}

function validateContent(content: string): CheckResult[] {
  const results: CheckResult[] = [];
  const lines = content.split("\n");
  const wordCount = content.split(/\s+/).length;

  results.push({
    name: "Token efficiency",
    passed: wordCount <= 2000,
    severity: wordCount > 3000 ? "error" : "warning",
    message: wordCount <= 2000 ? `${wordCount} words` : `${wordCount} words — target <2,000`,
  });

  for (const { pattern, name: sName } of [
    { pattern: /^#\s+.+/m, name: "Title (H1 heading)" },
    { pattern: /##\s*(When|Trigger)/im, name: "Trigger section" },
    { pattern: /##\s*(Steps|How|Process|Action)/im, name: "Steps/Action section" },
  ]) {
    const found = pattern.test(content);
    results.push({ name: `Has ${sName}`, passed: found, severity: "error", message: found ? `Found` : `Missing` });
  }

  for (const { pattern, name: sName } of [
    { pattern: /##\s*(Example|Usage)/im, name: "Example/Usage section" },
    { pattern: /##\s*(Output|Result|Format)/im, name: "Output format section" },
  ]) {
    const found = pattern.test(content);
    results.push({ name: `Has ${sName}`, passed: found, severity: "warning", message: found ? `Found` : `Consider adding` });
  }

  const emptyHeadings = lines.filter((line, i) => {
    if (!/^#{1,3}\s/.test(line)) return false;
    const next = lines[i + 1]?.trim();
    return !next || /^#{1,3}\s/.test(next);
  });
  results.push({
    name: "No empty sections",
    passed: emptyHeadings.length === 0,
    severity: "warning",
    message: emptyHeadings.length === 0 ? "All sections have content" : `${emptyHeadings.length} empty section(s)`,
  });

  const hardcodedPaths = /\/(Users|home|var|tmp)\/[a-zA-Z]/g.test(content);
  results.push({
    name: "No hardcoded paths",
    passed: !hardcodedPaths,
    severity: "error",
    message: hardcodedPaths ? "Contains hardcoded absolute paths" : "No hardcoded paths",
  });

  return results;
}

async function toolTest(params: { path: string; strict?: string }) {
  const { path: rawPath, strict } = params;
  const resolvedPath = resolve(rawPath);

  const pathStat = await stat(resolvedPath).catch(() => null);
  if (!pathStat) throw new Error(`Path not found: ${resolvedPath}`);

  const skillMdPath = pathStat.isFile() ? resolvedPath : join(resolvedPath, "SKILL.md");
  const skillMdExists = await stat(skillMdPath).then(() => true).catch(() => false);

  if (!skillMdExists) {
    return { passed: false, errors: 1, warnings: 0, results: [{ name: "SKILL.md exists", passed: false, severity: "error", message: "Missing SKILL.md" }] };
  }

  const content = await readFile(skillMdPath, "utf-8");
  const results = validateContent(content);
  const errors = results.filter((r) => !r.passed && r.severity === "error").length;
  const warnings = results.filter((r) => !r.passed && r.severity === "warning").length;
  const isStrict = strict === "true";
  const passed = errors === 0 && (!isStrict || warnings === 0);

  return { passed, errors, warnings, results };
}

// Built-in catalog (same set as list.ts)
const BUILTIN_SKILLS = [
  { name: "commit-msg", description: "Auto-generate conventional commit messages", category: "git" },
  { name: "test-generator", description: "Generate Vitest/Jest tests from source files", category: "testing" },
  { name: "api-scaffolder", description: "Scaffold REST/GraphQL endpoints", category: "backend" },
  { name: "refactor-guide", description: "Step-by-step refactoring with safety checks", category: "code-quality" },
  { name: "debug-assistant", description: "Systematic debugging workflow", category: "debugging" },
  { name: "docs-writer", description: "Generate JSDoc and README docs", category: "documentation" },
  { name: "pr-reviewer", description: "Code review checklist and feedback", category: "code-quality" },
  { name: "env-setup", description: "Environment setup and validation", category: "devops" },
];

function toolList(params: { category?: string }) {
  const { category } = params;
  const skills = category
    ? BUILTIN_SKILLS.filter((s) => s.category === category)
    : BUILTIN_SKILLS;
  return { skills, totalCount: skills.length };
}

function toolValidateSpec(params: { content: string }) {
  const results = validateContent(params.content);
  const errors = results.filter((r) => !r.passed && r.severity === "error").length;
  const warnings = results.filter((r) => !r.passed && r.severity === "warning").length;
  return { passed: errors === 0, errors, warnings, results };
}

// ---------------------------------------------------------------------------
// MCP protocol handler (JSON-RPC 2.0 over stdio)
// ---------------------------------------------------------------------------

async function handleRequest(req: JsonRpcRequest): Promise<JsonRpcResponse> {
  const respond = (result: unknown): JsonRpcResponse => ({
    jsonrpc: "2.0",
    id: req.id,
    result,
  });
  const error = (code: number, message: string, data?: unknown): JsonRpcResponse => ({
    jsonrpc: "2.0",
    id: req.id,
    error: { code, message, data },
  });

  try {
    if (req.method === "initialize") {
      return respond({
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "skillsmith", version: "1.0.0" },
      });
    }

    if (req.method === "tools/list") {
      return respond({ tools: TOOLS });
    }

    if (req.method === "tools/call") {
      const { name, arguments: args = {} } = req.params as { name: string; arguments: Record<string, unknown> };
      let result: unknown;

      switch (name) {
        case "skillsmith_init":
          result = await toolInit(args as Parameters<typeof toolInit>[0]);
          break;
        case "skillsmith_test":
          result = await toolTest(args as Parameters<typeof toolTest>[0]);
          break;
        case "skillsmith_list":
          result = toolList(args as Parameters<typeof toolList>[0]);
          break;
        case "skillsmith_validate_spec":
          result = toolValidateSpec(args as Parameters<typeof toolValidateSpec>[0]);
          break;
        default:
          return error(-32601, `Unknown tool: ${name}`);
      }

      return respond({
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    }

    // notifications (no response needed — return empty result)
    if (req.method.startsWith("notifications/")) {
      return respond({});
    }

    return error(-32601, `Unknown method: ${req.method}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(-32603, msg);
  }
}

// ---------------------------------------------------------------------------
// stdio transport
// ---------------------------------------------------------------------------

async function main() {
  const { createInterface } = await import("node:readline");
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

  process.stdout.write(""); // keep stdout open

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const req = JSON.parse(trimmed) as JsonRpcRequest;
      const response = await handleRequest(req);
      // Only send responses for requests (id present), not notifications
      if (req.id !== undefined) {
        process.stdout.write(JSON.stringify(response) + "\n");
      }
    } catch {
      // Malformed JSON — ignore (MCP spec allows silent drop)
    }
  });

  rl.on("close", () => process.exit(0));
}

main().catch((e) => {
  process.stderr.write(`skillsmith-mcp fatal: ${e}\n`);
  process.exit(1);
});
