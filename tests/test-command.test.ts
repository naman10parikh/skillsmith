import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("skill validation logic", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `skillsmith-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("detects missing SKILL.md", async () => {
    const { stat } = await import("node:fs/promises");
    const exists = await stat(join(testDir, "SKILL.md"))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it("detects required sections in valid SKILL.md", async () => {
    const content = `# My Skill

A great skill.

## When to Use

When you need it.

## Steps

1. Do this
2. Do that

## Example

Example here.
`;
    await writeFile(join(testDir, "SKILL.md"), content);

    const titleMatch = /^#\s+.+/m.test(content);
    const triggerMatch = /##\s*(When|Trigger)/im.test(content);
    const stepsMatch = /##\s*(Steps|How|Process|Action)/im.test(content);

    expect(titleMatch).toBe(true);
    expect(triggerMatch).toBe(true);
    expect(stepsMatch).toBe(true);
  });

  it("detects missing trigger section", () => {
    const content = `# My Skill

## Steps

1. Do stuff
`;
    const triggerMatch = /##\s*(When|Trigger)/im.test(content);
    expect(triggerMatch).toBe(false);
  });

  it("detects hardcoded paths", () => {
    const content = `# Skill

Use /Users/john/project/file.ts
`;
    const hasHardcoded = /\/(Users|home|var|tmp)\/[a-zA-Z]/g.test(content);
    expect(hasHardcoded).toBe(true);
  });

  it("passes clean content without hardcoded paths", () => {
    const content = `# Skill

Use relative paths like ./src/index.ts
`;
    const hasHardcoded = /\/(Users|home|var|tmp)\/[a-zA-Z]/g.test(content);
    expect(hasHardcoded).toBe(false);
  });

  it("counts words for token efficiency", () => {
    const short = "This is a short skill description";
    const shortCount = short.split(/\s+/).length;
    expect(shortCount).toBeLessThan(2000);

    const long = "word ".repeat(3000);
    const longCount = long.split(/\s+/).length;
    expect(longCount).toBeGreaterThan(2000);
  });

  it("detects empty sections", () => {
    const lines = [
      "# Title",
      "Some intro text",
      "## Section 1",
      "## Section 2",
      "Content here",
    ];
    const emptyHeadings = lines.filter((line, i) => {
      if (!/^#{1,3}\s/.test(line)) return false;
      const nextLine = lines[i + 1]?.trim();
      return !nextLine || /^#{1,3}\s/.test(nextLine);
    });
    expect(emptyHeadings).toHaveLength(1);
    expect(emptyHeadings[0]).toBe("## Section 1");
  });
});
