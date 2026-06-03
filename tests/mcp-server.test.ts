/**
 * L1 unit tests for the MCP server logic.
 * Tests the tool implementations in isolation (no process spawn).
 */
import { describe, it, expect } from "vitest";
import { getBasicTemplate, getAdvancedTemplate, getMcpTemplate } from "../src/templates/index.js";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// ---------------------------------------------------------------------------
// Registry types (inline — registry.ts is the typed stub)
// ---------------------------------------------------------------------------

describe("registry stub types", () => {
  it("SkillEntry interface shape can be constructed", async () => {
    // Import to verify the module compiles + exports
    const mod = await import("../src/mcp/registry.js");
    expect(typeof mod.fetchRegistry).toBe("function");
    expect(typeof mod.fetchSkill).toBe("function");
    expect(typeof mod.publishToRegistry).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// MCP tool logic (inline port of server internals)
// ---------------------------------------------------------------------------

function validateContent(content: string) {
  const results: Array<{ name: string; passed: boolean; severity: string; message: string }> = [];
  const lines = content.split("\n");
  const wordCount = content.split(/\s+/).length;

  results.push({
    name: "Token efficiency",
    passed: wordCount <= 2000,
    severity: wordCount > 3000 ? "error" : "warning",
    message: wordCount <= 2000 ? `${wordCount} words` : `${wordCount} words — target <2,000`,
  });

  for (const { pattern, name } of [
    { pattern: /^#\s+.+/m, name: "Title (H1 heading)" },
    { pattern: /##\s*(When|Trigger)/im, name: "Trigger section" },
    { pattern: /##\s*(Steps|How|Process|Action)/im, name: "Steps/Action section" },
  ]) {
    const found = pattern.test(content);
    results.push({ name: `Has ${name}`, passed: found, severity: "error", message: found ? "Found" : "Missing" });
  }

  const hardcoded = /\/(Users|home|var|tmp)\/[a-zA-Z]/g.test(content);
  results.push({ name: "No hardcoded paths", passed: !hardcoded, severity: "error", message: hardcoded ? "Contains hardcoded paths" : "No hardcoded paths" });

  return results;
}

describe("MCP skillsmith_validate_spec logic", () => {
  it("passes for a well-formed SKILL.md", () => {
    const content = getBasicTemplate("my-skill")["SKILL.md"];
    const results = validateContent(content);
    const errors = results.filter((r) => !r.passed && r.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("flags missing trigger section", () => {
    const content = "# My Skill\n\n## Steps\n\n1. Do stuff\n";
    const results = validateContent(content);
    const triggerError = results.find((r) => r.name.includes("Trigger") && !r.passed);
    expect(triggerError).toBeDefined();
    expect(triggerError?.severity).toBe("error");
  });

  it("flags hardcoded /Users/ paths", () => {
    const content = "# Skill\n\n## When to Use\n\nUse on /Users/naman/project\n\n## Steps\n\n1. Go\n";
    const results = validateContent(content);
    const pathError = results.find((r) => r.name === "No hardcoded paths");
    expect(pathError?.passed).toBe(false);
  });

  it("passes advanced template content", () => {
    const content = getAdvancedTemplate("adv-skill")["SKILL.md"];
    const results = validateContent(content);
    const errors = results.filter((r) => !r.passed && r.severity === "error");
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// .claude-plugin manifest shape
// ---------------------------------------------------------------------------

describe(".claude-plugin manifest", () => {
  it("manifest.json is valid JSON with required fields", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = new URL(".", import.meta.url).pathname;
    const manifestPath = resolve(__dirname, "../.claude-plugin/manifest.json");
    const raw = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBe("skillsmith");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.type).toBe("mcp");
    expect(Array.isArray(manifest.tools)).toBe(true);
    expect(manifest.tools.length).toBeGreaterThan(0);
    expect(manifest.mcpServer.command).toBe("npx");
  });

  it("all declared tools have name and description", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const __dirname = new URL(".", import.meta.url).pathname;
    const manifestPath = resolve(__dirname, "../.claude-plugin/manifest.json");
    const raw = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    for (const tool of manifest.tools) {
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.description).toBe("string");
    }
  });
});
