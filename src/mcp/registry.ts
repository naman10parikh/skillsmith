/**
 * skillsmith registry — stub + documented API contract.
 *
 * STATUS (CODE PREP): The registry interface is defined here but the backing
 * service is not yet live. The npm package is scoped to @energy/skillsmith.
 * Publication requires the `@energy` npm org to be claimed.
 *
 * Chairman-blocked:
 *   - Claim the `@energy` npm org at https://www.npmjs.com/org/create
 *   - Run `npm publish` once the org is live
 *   - Deploy registry.skillsmith.dev (GitHub-backed, see TODOS.md §REG-02)
 *
 * Once live, this module will perform real HTTP calls. Until then, list/install
 * fall back to the BUILTIN_CATALOG in src/commands/list.ts.
 */

export interface SkillEntry {
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  /** GitHub URL or registry CDN URL where SKILL.md is hosted */
  url: string;
  stars: number;
  downloads: number;
  publishedAt: string;
}

export interface RegistryIndex {
  skills: SkillEntry[];
  updatedAt: string;
  totalCount: number;
}

/**
 * Fetch all skills from the registry.
 * Falls back to the built-in catalog when the registry is unreachable.
 */
export async function fetchRegistry(registryUrl: string): Promise<RegistryIndex> {
  const res = await fetch(`${registryUrl}/index.json`, {
    headers: { "User-Agent": "skillsmith-cli/1.0.0" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) {
    throw new Error(`Registry responded ${res.status}: ${registryUrl}`);
  }
  return res.json() as Promise<RegistryIndex>;
}

/**
 * Fetch metadata for a single skill.
 */
export async function fetchSkill(
  registryUrl: string,
  name: string,
): Promise<SkillEntry> {
  const res = await fetch(`${registryUrl}/skills/${name}.json`, {
    headers: { "User-Agent": "skillsmith-cli/1.0.0" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) {
    throw new Error(`Skill '${name}' not found in registry (${res.status})`);
  }
  return res.json() as Promise<SkillEntry>;
}

/**
 * Publish a skill manifest to the registry (requires auth token).
 * Returns the published skill's URL.
 */
export async function publishToRegistry(
  registryUrl: string,
  authToken: string,
  manifest: Omit<SkillEntry, "stars" | "downloads" | "publishedAt">,
  skillContent: string,
): Promise<{ url: string }> {
  const res = await fetch(`${registryUrl}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "User-Agent": "skillsmith-cli/1.0.0",
    },
    body: JSON.stringify({ manifest, skillContent }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Publish failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<{ url: string }>;
}
