/**
 * sandbox-run — validate an UNTRUSTED skill inside an isolated E2B sandbox.
 *
 * Registry skills are third-party markdown. `skillsmith install` pulls them
 * onto the user's machine, so the validation/preview step is the natural
 * isolation point: this command boots a Firecracker microVM via the E2B SDK,
 * uploads the skill, and runs the spec checks INSIDE the sandbox — the
 * untrusted content is parsed off-host. Pattern: Energy's container-runner
 * (E2B sandbox lifecycle) applied to skillsmith's core action (validation).
 *
 * Requires E2B_API_KEY in the environment. Each boot is a paid action, so
 * every run — success or failure — lands in the observability audit trail.
 */
import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import chalk from "chalk";
import { Sandbox } from "e2b";
import { logRun } from "../observability/runs.js";

interface SandboxRunOptions {
  template: string;
  json: boolean;
}

interface SandboxCheck {
  name: string;
  passed: boolean;
  detail: string;
}

/**
 * The skill-spec checks as a POSIX script that runs INSIDE the sandbox —
 * the same rules as `skillsmith test` (frontmatter, title, trigger, steps,
 * token cap, no hardcoded paths), but executed where untrusted content can't hurt.
 */
const CHECK_SCRIPT = [
  `F=/home/user/skill/SKILL.md`,
  `awk 'NR==1{if($0!="---")exit 1;next} $0=="---"{c=1;exit} /^name:[[:space:]]*[^[:space:]]/{n=1} /^description:[[:space:]]*[^[:space:]]/{d=1} END{exit !(c&&n&&d)}' "$F" && echo 'frontmatter|pass|name and description found' || echo 'frontmatter|fail|missing name or description frontmatter'`,
  `grep -Eq '^# ' "$F" && echo 'title|pass|H1 title found' || echo 'title|fail|missing H1 title'`,
  `grep -Eiq '^##[[:space:]]*(When|Trigger)' "$F" && echo 'trigger|pass|trigger section found' || echo 'trigger|fail|missing trigger section'`,
  `grep -Eiq '^##[[:space:]]*(Steps|How|Process|Action)' "$F" && echo 'steps|pass|steps section found' || echo 'steps|fail|missing steps section'`,
  `W=$(wc -w < "$F" | tr -d ' '); if [ "$W" -le 2000 ]; then echo "tokens|pass|$W words"; else echo "tokens|fail|$W words (target <2000)"; fi`,
  `if grep -Eq '/(Users|home|var|tmp)/[a-zA-Z]' "$F"; then echo 'paths|fail|hardcoded absolute paths found'; else echo 'paths|pass|no hardcoded paths'; fi`,
].join("\n");

export async function sandboxRunCommand(
  path: string,
  options: SandboxRunOptions,
): Promise<void> {
  const started = Date.now();
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    console.error(
      chalk.red(
        "E2B_API_KEY is not set — sandbox-run needs it to boot the microVM.",
      ),
    );
    logRun({
      cmd: "sandbox-run",
      args: { path },
      ok: false,
      durationMs: Date.now() - started,
      detail: "missing E2B_API_KEY",
    });
    process.exitCode = 1;
    return;
  }

  // Resolve the SKILL.md (accept a skill dir or the file itself).
  const resolved = resolve(process.cwd(), path);
  const pathStat = await stat(resolved).catch(() => null);
  if (!pathStat) {
    console.error(chalk.red(`Path not found: ${resolved}`));
    logRun({
      cmd: "sandbox-run",
      args: { path },
      ok: false,
      durationMs: Date.now() - started,
      detail: "path not found",
    });
    process.exitCode = 1;
    return;
  }
  const skillMdPath = pathStat.isFile() ? resolved : join(resolved, "SKILL.md");
  const content = await readFile(skillMdPath, "utf-8").catch(() => null);
  if (content === null) {
    console.error(chalk.red(`No SKILL.md at ${skillMdPath}`));
    logRun({
      cmd: "sandbox-run",
      args: { path },
      ok: false,
      durationMs: Date.now() - started,
      detail: "SKILL.md missing",
    });
    process.exitCode = 1;
    return;
  }

  let sandbox: Sandbox | null = null;
  try {
    if (!options.json) {
      console.log(
        chalk.blue("\n⚡ Booting E2B sandbox (Firecracker microVM)…"),
      );
    }
    sandbox = await Sandbox.create(options.template, {
      apiKey,
      timeoutMs: 120_000,
    });
    await sandbox.files.write("/home/user/skill/SKILL.md", content);
    const result = await sandbox.commands.run(CHECK_SCRIPT);

    const checks: SandboxCheck[] = result.stdout
      .split("\n")
      .filter((line) => line.includes("|"))
      .map((line) => {
        const [name = "", status = "", detail = ""] = line.split("|");
        return { name, passed: status === "pass", detail };
      });
    const failed = checks.filter((c) => !c.passed).length;
    const durationMs = Date.now() - started;

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            sandboxId: sandbox.sandboxId,
            template: options.template,
            passed: checks.length > 0 && failed === 0,
            checks,
            durationMs,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(
        chalk.dim(
          `  sandbox ${sandbox.sandboxId} (template: ${options.template})\n`,
        ),
      );
      for (const c of checks) {
        const icon = c.passed ? chalk.green("✓") : chalk.red("✗");
        console.log(`  ${icon} ${c.name} — ${chalk.dim(c.detail)}`);
      }
      console.log(
        failed === 0 && checks.length > 0
          ? chalk.green(`\n  ✓ Skill validated in isolation (${durationMs}ms)\n`)
          : chalk.red(
              `\n  ✗ ${failed} check(s) failed in sandbox (${durationMs}ms)\n`,
            ),
      );
    }

    logRun({
      cmd: "sandbox-run",
      args: { path, template: options.template },
      ok: checks.length > 0 && failed === 0,
      durationMs,
      detail: `sandbox ${sandbox.sandboxId}: ${checks.length - failed}/${checks.length} checks passed`,
    });
    if (failed > 0 || checks.length === 0) process.exitCode = 1;
  } catch (err) {
    const message = (err as Error).message;
    console.error(chalk.red(`Sandbox run failed: ${message}`));
    logRun({
      cmd: "sandbox-run",
      args: { path, template: options.template },
      ok: false,
      durationMs: Date.now() - started,
      detail: message.slice(0, 200),
    });
    process.exitCode = 1;
  } finally {
    if (sandbox) await sandbox.kill().catch(() => undefined);
  }
}
