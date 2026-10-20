// Golden evals for skillsmith: binary pass or fail, run by `pnpm eval` and by CI on every push.
// They run the built CLI, MCP server and plugin hook as a user would (`pnpm build` first). The
// checks run in four places: the CLI, the MCP server and the hook are held to one verdict here, so
// the agreement cases fail the moment one copy drifts; the fourth runs inside an E2B microVM
// (`sandbox-run`) and needs a key, so it is proven by a live run instead.
import { describe, it, expect, beforeAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CLI = join(ROOT, "dist/index.js");
const MCP = join(ROOT, "dist/mcp/server.js");
const HOOK = join(ROOT, "hooks/check-skill.cjs");

interface Verdict {
  passed: boolean;
  errors: number;
  warnings: number;
  results: { name: string; passed: boolean; severity: string }[];
}

const FM = "---\nname: demo\ndescription: Demo skill. Use when testing skillsmith.\n---\n\n";
const BODY = "# Demo\n\nDoes one thing.\n\n## When to Use\n\n- When asked.\n\n## Steps\n\n1. Do it.\n\n## Example\n\nUser asks; agent does it.\n\n## Output\n\nA short report.\n";

// name -> [SKILL.md content, passes without --strict, passes with --strict, the failed check it must name]
const FIXTURES: Record<string, [string, boolean, boolean, string | null]> = {
  "complete skill": [FM + BODY, true, true, null],
  "no frontmatter": [BODY, false, false, "Has frontmatter (name, description)"],
  "frontmatter without description": ["---\nname: demo\n---\n\n" + BODY, false, false, "Has frontmatter (name, description)"],
  "no trigger section": [FM + BODY.replace("## When to Use", "## Notes"), false, false, "Has Trigger section"],
  "no steps section": [FM + BODY.replace("## Steps", "## Notes"), false, false, "Has Steps/Action section"],
  "a path from one machine": [FM + BODY.replace("1. Do it.", "1. Open /Users/alex/project."), false, false, "No hardcoded paths"],
  "blank lines after headings": [FM + BODY.replace(/\n\n/g, "\n\n\n"), true, true, null],
  "a heading with nothing under it": [FM + BODY.replace("## Output\n\nA short report.\n", "## Output\n\n## Notes\n\nMore.\n"), true, false, "No empty sections"],
  "2,500 words": [FM + BODY + "word ".repeat(2500), true, false, "Token efficiency"],
  "3,100 words": [FM + BODY + "word ".repeat(3100), false, false, "Token efficiency"],
};

let dir = "";
const skillDir = (name: string) => join(dir, name.replace(/[^a-z0-9]+/gi, "-"));

function cli(args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  return spawnSync("node", [CLI, ...args], { encoding: "utf8", cwd: opts.cwd ?? dir, env: opts.env ?? process.env });
}

function cliVerdict(path: string, strict = false): Verdict {
  return JSON.parse(cli(["test", path, "--json", ...(strict ? ["--strict"] : [])]).stdout) as Verdict;
}

function mcp(calls: { name: string; arguments?: Record<string, unknown> }[]): unknown[] {
  const lines = [
    { jsonrpc: "2.0", id: 0, method: "initialize", params: {} },
    ...calls.map((c, i) =>
      c.name === "tools/list"
        ? { jsonrpc: "2.0", id: i + 1, method: "tools/list", params: {} }
        : { jsonrpc: "2.0", id: i + 1, method: "tools/call", params: { name: c.name, arguments: c.arguments ?? {} } },
    ),
  ].map((l) => JSON.stringify(l));
  const out = spawnSync("node", [MCP], { input: lines.join("\n") + "\n", encoding: "utf8" });
  const byId = new Map<number, { content?: { text: string }[]; tools?: { name: string }[] }>();
  for (const line of out.stdout.split("\n").filter(Boolean)) {
    const msg = JSON.parse(line) as { id: number; result: { content?: { text: string }[] } };
    byId.set(msg.id, msg.result);
  }
  return calls.map((c, i) => {
    const r = byId.get(i + 1);
    return c.name === "tools/list" ? r : r?.content ? JSON.parse(r.content[0].text) : undefined;
  });
}

function hookNote(file: string): string {
  const input = JSON.stringify({ tool_name: "Write", tool_input: { file_path: file } });
  return spawnSync("node", [HOOK], { input, encoding: "utf8" }).stdout.trim();
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "skillsmith-eval-"));
  for (const [name, [content]] of Object.entries(FIXTURES)) {
    mkdirSync(skillDir(name));
    writeFileSync(join(skillDir(name), "SKILL.md"), content);
  }
});

describe("the validator (CLI)", () => {
  for (const [name, [, plain, strict, check]] of Object.entries(FIXTURES)) {
    it(`E3 ${name}: ${plain ? "passes" : "fails"}, ${strict ? "passes" : "fails"} with --strict`, () => {
      expect(cliVerdict(skillDir(name)).passed).toBe(plain);
      const v = cliVerdict(skillDir(name), true);
      expect(v.passed).toBe(strict);
      if (check) expect(v.results.find((r) => r.name === check)?.passed).toBe(false);
    });
  }

  it("E1 a fresh basic scaffold passes --strict with no warnings", () => {
    cli(["init", "fresh-basic"]);
    const v = cliVerdict(join(dir, "fresh-basic"), true);
    expect([v.passed, v.errors, v.warnings]).toEqual([true, 0, 0]);
  });

  it("E2 the advanced and mcp scaffolds pass --strict", () => {
    cli(["init", "fresh-advanced", "-t", "advanced"]);
    cli(["init", "fresh-mcp", "-t", "mcp"]);
    expect(cliVerdict(join(dir, "fresh-advanced"), true).passed).toBe(true);
    expect(cliVerdict(join(dir, "fresh-mcp"), true).passed).toBe(true);
  });

  it("E4 --json exits 1 on a failing skill and 0 on a passing one", () => {
    expect(cli(["test", skillDir("no frontmatter"), "--json"]).status).toBe(1);
    expect(cli(["test", skillDir("complete skill"), "--json"]).status).toBe(0);
  });

  it("E5 an absolute path works from any folder", () => {
    const r = cli(["test", join(skillDir("complete skill"), "SKILL.md"), "--json"], { cwd: tmpdir() });
    expect(JSON.parse(r.stdout).passed).toBe(true);
  });
});

describe("one verdict everywhere", () => {
  it("E6 the MCP skillsmith_validate_spec agrees with the CLI on every fixture", () => {
    const names = Object.keys(FIXTURES);
    const answers = mcp(names.map((n) => ({ name: "skillsmith_validate_spec", arguments: { content: FIXTURES[n][0] } }))) as Verdict[];
    names.forEach((n, i) => {
      const c = cliVerdict(skillDir(n));
      expect([answers[i].passed, answers[i].errors, answers[i].warnings], n).toEqual([c.passed, c.errors, c.warnings]);
    });
  });

  it("E7 the MCP skillsmith_test agrees with the CLI under --strict, even when stdin closes at once", () => {
    const names = Object.keys(FIXTURES);
    const answers = mcp(names.map((n) => ({ name: "skillsmith_test", arguments: { path: skillDir(n), strict: "true" } }))) as Verdict[];
    names.forEach((n, i) => expect(answers[i]?.passed, n).toBe(cliVerdict(skillDir(n), true).passed));
  });

  it("E8 the plugin hook stays silent exactly when the CLI passes", () => {
    for (const n of Object.keys(FIXTURES)) {
      const note = hookNote(join(skillDir(n), "SKILL.md"));
      expect(note === "{}", n).toBe(cliVerdict(skillDir(n)).passed);
    }
  });

  it("E9 the MCP server lists its four tools", () => {
    const [list] = mcp([{ name: "tools/list" }]) as { tools: { name: string }[] }[];
    expect(list.tools.map((t) => t.name).sort()).toEqual(["skillsmith_init", "skillsmith_list", "skillsmith_test", "skillsmith_validate_spec"]);
  });
});

describe("the rest of the product", () => {
  it("E10 install writes a starter skill that passes and sends the agent to no web address", () => {
    cli(["install", "commit-msg", "--dir", "installed"]);
    const file = join(dir, "installed", "commit-msg", "SKILL.md");
    expect(readFileSync(file, "utf8")).not.toMatch(/https?:\/\//);
    expect(cliVerdict(join(dir, "installed", "commit-msg")).passed).toBe(true);
  });

  it("E11 the repository's own skills pass --strict", () => {
    const skills = readdirSync(join(ROOT, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory());
    expect(skills.length).toBeGreaterThanOrEqual(3);
    for (const s of skills) expect(cliVerdict(join(ROOT, "skills", s.name), true).passed, s.name).toBe(true);
  });

  it("E12 every init and publish lands in the run log, failures included", () => {
    const runs = join(dir, "runs.jsonl");
    const env = { ...process.env, SKILLSMITH_RUNS_FILE: runs };
    cli(["init", "logged"], { env });
    cli(["publish", "logged", "--dry-run"], { env });
    cli(["publish", "no-such-skill"], { env });
    const lines = readFileSync(runs, "utf8").trim().split("\n").map((l) => JSON.parse(l) as { cmd: string; ok: boolean });
    expect(lines.map((l) => [l.cmd, l.ok])).toEqual([["init", true], ["publish", true], ["publish", false]]);
  });

  it("E13 memory-search answers a plain question with the right skill", () => {
    const out = JSON.parse(cli(["memory-search", "is this third-party skill safe to install", "--json"]).stdout) as { hits: { file: string }[] };
    expect(out.hits[0]?.file).toBe("skills/vet-untrusted-skill/SKILL.md");
  });

  it("E14 sandbox-run without E2B_API_KEY stops at once, says why and logs the failure", () => {
    const runs = join(dir, "sandbox-runs.jsonl");
    const env: NodeJS.ProcessEnv = { ...process.env, SKILLSMITH_RUNS_FILE: runs };
    delete env.E2B_API_KEY;
    const r = cli(["sandbox-run", skillDir("complete skill")], { env });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("E2B_API_KEY is not set");
    expect(JSON.parse(readFileSync(runs, "utf8").trim()).ok).toBe(false);
  });
});
