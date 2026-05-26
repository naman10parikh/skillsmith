import { describe, it, expect } from "vitest";
import {
  getBasicTemplate,
  getAdvancedTemplate,
  getMcpTemplate,
} from "../src/templates/index.js";

describe("getBasicTemplate", () => {
  it("generates SKILL.md with correct title", () => {
    const files = getBasicTemplate("my-cool-skill");
    expect(files["SKILL.md"]).toContain("# My Cool Skill");
  });

  it("generates skillsmith.json with correct name", () => {
    const files = getBasicTemplate("test-skill");
    const config = JSON.parse(files["skillsmith.json"]);
    expect(config.name).toBe("test-skill");
    expect(config.version).toBe("1.0.0");
    expect(config.license).toBe("MIT");
  });

  it("includes required sections in SKILL.md", () => {
    const files = getBasicTemplate("example");
    const content = files["SKILL.md"];
    expect(content).toContain("## When to Use");
    expect(content).toContain("## Steps");
    expect(content).toContain("## Example");
    expect(content).toContain("## Output Format");
  });

  it("returns exactly 2 files", () => {
    const files = getBasicTemplate("test");
    expect(Object.keys(files)).toHaveLength(2);
    expect(files["SKILL.md"]).toBeDefined();
    expect(files["skillsmith.json"]).toBeDefined();
  });
});

describe("getAdvancedTemplate", () => {
  it("includes basic template files plus knowledge and examples", () => {
    const files = getAdvancedTemplate("advanced-skill");
    expect(files["SKILL.md"]).toBeDefined();
    expect(files["skillsmith.json"]).toBeDefined();
    expect(files["knowledge/README.md"]).toBeDefined();
    expect(files["knowledge/.gitkeep"]).toBeDefined();
    expect(files["examples/basic.md"]).toBeDefined();
  });

  it("has 5 files total", () => {
    const files = getAdvancedTemplate("test");
    expect(Object.keys(files)).toHaveLength(5);
  });
});

describe("getMcpTemplate", () => {
  it("generates MCP-specific SKILL.md", () => {
    const files = getMcpTemplate("weather-api");
    const content = files["SKILL.md"];
    expect(content).toContain("MCP");
    expect(content).toContain("weather-api");
    expect(content).toContain("## Prerequisites");
    expect(content).toContain("## Available MCP Tools");
  });

  it("includes mcp config in skillsmith.json", () => {
    const files = getMcpTemplate("data-fetcher");
    const config = JSON.parse(files["skillsmith.json"]);
    expect(config.category).toBe("mcp");
    expect(config.tags).toContain("mcp");
    expect(config.mcp).toBeDefined();
    expect(config.mcp.tools).toHaveLength(2);
  });

  it("returns exactly 2 files", () => {
    const files = getMcpTemplate("test");
    expect(Object.keys(files)).toHaveLength(2);
  });
});

describe("title casing", () => {
  it("converts kebab-case to Title Case", () => {
    const files = getBasicTemplate("my-awesome-skill");
    expect(files["SKILL.md"]).toContain("# My Awesome Skill");
  });

  it("handles single word", () => {
    const files = getBasicTemplate("debug");
    expect(files["SKILL.md"]).toContain("# Debug");
  });
});
