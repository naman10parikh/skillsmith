import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import chalk from "chalk";
import { searchMemory } from "../memory/search.js";

interface MemorySearchOptions {
  limit: string;
  json: boolean;
}

/**
 * Resolve the repo root from this module's location. Built file lives at
 * `dist/commands/memory-search.js`, source at `src/commands/memory-search.ts`
 * — repo root is two directories up from either.
 */
function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "..", "..");
}

/**
 * `skillsmith memory-search <query>` — BM25 search over skillsmith's own
 * knowledge corpus (brain/, memory/, identity/, docs/, top-level docs).
 */
export async function memorySearchCommand(
  query: string,
  options: MemorySearchOptions,
): Promise<void> {
  const limit = Math.max(1, parseInt(options.limit, 10) || 5);
  const hits = searchMemory(repoRoot(), query, limit);

  if (options.json) {
    console.log(JSON.stringify({ query, hits }, null, 2));
    return;
  }

  console.log(chalk.bold(`\n⚡ Memory search: "${query}"\n`));
  if (hits.length === 0) {
    console.log(chalk.dim(`  No matches in the skillsmith corpus.\n`));
    return;
  }
  hits.forEach((hit, i) => {
    console.log(
      `  ${chalk.green(`[${i + 1}]`)} ${chalk.cyan(`${hit.file}:${hit.line}`)} ${chalk.dim(`(score ${hit.score})`)}`,
    );
    console.log(`      ${chalk.dim(hit.snippet)}\n`);
  });
  console.log(chalk.dim(`  ${hits.length} result(s) over the repo corpus.\n`));
}
