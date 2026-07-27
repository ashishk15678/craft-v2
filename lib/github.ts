/**
 * lib/github.ts
 *
 * Octokit singleton + helpers for all Git/GitHub repo operations the platform needs:
 *
 *  - provisionOrgRepo        create the per-org repo in the platform GitHub org
 *  - addChallengeSubmodule   register a starter repo as a submodule inside an org repo
 *  - removeChallengeSubmodule remove a submodule from an org repo
 *  - archiveRepo             mark a repo archived (soft-delete equivalent)
 *  - deleteRepo              hard-delete a repo (requires GITHUB_DELETE_ENABLED=true)
 *  - getRepoInfo             return public metadata about a repo
 *
 * Required env vars:
 *   GITHUB_TOKEN          — personal access token or GitHub App installation token
 *   GITHUB_ORG            — platform GitHub organisation name (e.g. "craft-platform")
 *
 * Optional env vars:
 *   GITHUB_DELETE_ENABLED — set to "true" to allow hard repo deletion
 *
 * ponytail: All operations use the REST API directly via Octokit.
 *   Ceiling: rate-limited to 5000 req/h per token. Upgrade path: GitHub App
 *   with per-installation tokens for higher limits and better audit trail.
 */

import { Octokit } from "@octokit/rest";

let _octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!_octokit) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new GitHubConfigError("GITHUB_TOKEN is not set. Configure it in .env to enable repo operations.");
    }
    _octokit = new Octokit({ auth: token });
  }
  return _octokit;
}

function getPlatformOrg(): string {
  const org = process.env.GITHUB_ORG;
  if (!org) throw new GitHubConfigError("GITHUB_ORG is not set.");
  return org;
}

// ─── Error types ──────────────────────────────────────────────────────────────

export class GitHubConfigError extends Error {
  readonly code = "GITHUB_CONFIG_ERROR";
}

export class GitHubApiError extends Error {
  readonly code = "GITHUB_API_ERROR";
  constructor(
    message: string,
    public readonly status: number,
    public readonly ghMessage?: string,
  ) {
    super(message);
  }
}

function handleGitHubError(err: unknown): never {
  if (err instanceof GitHubConfigError || err instanceof GitHubApiError) throw err;
  const e = err as { status?: number; message?: string };
  throw new GitHubApiError(
    `GitHub API error: ${e.message ?? "unknown"}`,
    e.status ?? 500,
    e.message,
  );
}

// ─── Repo naming convention ───────────────────────────────────────────────────

/**
 * Derives the GitHub repo name from an org slug.
 * Pattern: craft-org-<slug>
 * Example: craft-org-acme-corp
 */
export function orgRepoName(orgSlug: string): string {
  return `craft-org-${orgSlug}`;
}

/**
 * Derives the GitHub repo name for a platform-level challenge.
 * Pattern: craft-challenge-<slug>
 */
export function challengeRepoName(challengeSlug: string): string {
  return `craft-challenge-${challengeSlug}`;
}

// ─── Shared low-level helper ──────────────────────────────────────────────────

/**
 * Commit one or more file blobs into a repo in a single atomic commit.
 *
 * @param repoName  GitHub repo name (within the platform org)
 * @param files     Array of { path, content } — content is a UTF-8 string
 * @param message   Commit message
 * @returns SHA of the new commit
 *
 * ponytail: serialises all writes through a single commit. Concurrent calls
 *   will race on getRef → could produce a fast-forward conflict. Ceiling: low
 *   write concurrency. Upgrade path: optimistic retry with exponential backoff,
 *   or a queue per repo.
 */
export async function commitFiles(
  repoName: string,
  files: { path: string; content: string }[],
  message: string,
): Promise<string> {
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();

  const { data: refData } = await octokit.git.getRef({
    owner: platformOrg,
    repo: repoName,
    ref: "heads/main",
  });
  const headSha = refData.object.sha;

  const { data: headCommit } = await octokit.git.getCommit({
    owner: platformOrg,
    repo: repoName,
    commit_sha: headSha,
  });

  // Create blobs for each file in parallel
  const blobs = await Promise.all(
    files.map((f) =>
      octokit.git
        .createBlob({ owner: platformOrg, repo: repoName, content: f.content, encoding: "utf-8" })
        .then((r) => ({ path: f.path, sha: r.data.sha })),
    ),
  );

  const { data: newTree } = await octokit.git.createTree({
    owner: platformOrg,
    repo: repoName,
    base_tree: headCommit.tree.sha,
    tree: blobs.map((b) => ({ path: b.path, mode: "100644" as const, type: "blob" as const, sha: b.sha })),
  });

  const { data: newCommit } = await octokit.git.createCommit({
    owner: platformOrg,
    repo: repoName,
    message,
    tree: newTree.sha,
    parents: [headSha],
  });

  await octokit.git.updateRef({
    owner: platformOrg,
    repo: repoName,
    ref: "heads/main",
    sha: newCommit.sha,
  });

  return newCommit.sha;
}

/**
 * Ensure a directory path exists in the repo by writing a `.gitkeep` file.
 * Idempotent — does nothing if the file already exists (404 on getContent → proceed,
 * non-404 → skip).
 *
 * @param orgSlug  Platform org slug (repo is derived via orgRepoName)
 * @param dirPath  Directory path to create, e.g. "tracks/kv-store/learners/alice"
 * @returns commitSha if a commit was made, null if the dir already existed
 */
export async function ensureDirectory(
  orgSlug: string,
  dirPath: string,
): Promise<{ commitSha: string } | null> {
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();
  const repoName = orgRepoName(orgSlug);
  const keepPath = `${dirPath}/.gitkeep`;

  try {
    // Check if .gitkeep already exists — skip if so (idempotent)
    await octokit.repos.getContent({ owner: platformOrg, repo: repoName, path: keepPath });
    return null; // already exists
  } catch (err) {
    const e = err as { status?: number };
    if (e.status !== 404) handleGitHubError(err);
    // 404 → doesn't exist yet, proceed to create
  }

  try {
    const sha = await commitFiles(
      repoName,
      [{ path: keepPath, content: "" }],
      `chore: create directory ${dirPath}`,
    );
    return { commitSha: sha };
  } catch (err) {
    handleGitHubError(err);
  }
}

export interface RepoInfo {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  defaultBranch: string;
  private: boolean;
  archived: boolean;
  cloneUrl: string;
  sshUrl: string;
}

function mapRepo(data: {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  private: boolean;
  archived: boolean | null | undefined;
  clone_url: string;
  ssh_url: string;
}): RepoInfo {
  return {
    id: data.id,
    name: data.name,
    fullName: data.full_name,
    htmlUrl: data.html_url,
    defaultBranch: data.default_branch,
    private: data.private,
    archived: data.archived ?? false,
    cloneUrl: data.clone_url,
    sshUrl: data.ssh_url,
  };
}

/**
 * Provision the per-org Git repository.
 * Idempotent: returns existing repo info if the repo already exists.
 *
 * @param orgSlug   Platform org slug (used to derive the repo name)
 * @param isPrivate Whether to create a private repo (default: true)
 * @param description Optional description set on the GitHub repo
 */
export async function provisionOrgRepo(
  orgSlug: string,
  options: { isPrivate?: boolean; description?: string } = {},
): Promise<RepoInfo> {
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();
  const repoName = orgRepoName(orgSlug);

  try {
    // Check if repo already exists
    const existing = await octokit.repos.get({ owner: platformOrg, repo: repoName }).catch(() => null);
    if (existing) return mapRepo(existing.data);

    const { data } = await octokit.repos.createInOrg({
      org: platformOrg,
      name: repoName,
      description: options.description ?? `Craft platform repo for org: ${orgSlug}`,
      private: options.isPrivate ?? true,
      auto_init: true, // creates an initial commit so we can add submodules immediately
      gitignore_template: "Node",
    });
    return mapRepo(data);
  } catch (err) {
    handleGitHubError(err);
  }
}

/**
 * Return metadata for an existing repo without creating it.
 */
export async function getRepoInfo(repoName: string): Promise<RepoInfo | null> {
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();
  try {
    const { data } = await octokit.repos.get({ owner: platformOrg, repo: repoName });
    return mapRepo(data);
  } catch (err) {
    const e = err as { status?: number };
    if (e.status === 404) return null;
    handleGitHubError(err);
  }
}

/**
 * Add a starter repo as a git submodule inside the org's repo.
 *
 * GitHub's REST API doesn't have a native "add submodule" endpoint — this is
 * done by updating the .gitmodules file and writing a tree object via the
 * Git Data API.
 *
 * ponytail: This uses the low-level Git Data API (blobs → tree → commit).
 *   Ceiling: only handles flat .gitmodules additions; doesn't resolve nested paths.
 *   Upgrade path: use a GitHub Actions workflow triggered via repository_dispatch
 *   to run `git submodule add` in a real checkout for full correctness.
 *
 * @param orgSlug       Platform org slug (identifies the parent repo)
 * @param submodulePath Path inside the org repo, e.g. "challenges/kv-store"
 * @param starterRepo   Full HTTPS URL of the starter repo, e.g. "https://github.com/org/kv-store"
 */
export async function addChallengeSubmodule(
  orgSlug: string,
  submodulePath: string,
  starterRepo: string,
): Promise<{ commitSha: string }> {
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();
  const repoName = orgRepoName(orgSlug);

  try {
    // Read existing .gitmodules (may not exist yet)
    let gitmodulesContent = "";
    try {
      const { data: blob } = await octokit.repos.getContent({
        owner: platformOrg, repo: repoName, path: ".gitmodules",
      });
      if ("content" in blob && typeof blob.content === "string") {
        gitmodulesContent = Buffer.from(blob.content, "base64").toString("utf8");
      }
    } catch { /* doesn't exist yet */ }

    // Idempotent: skip if already registered
    if (gitmodulesContent.includes(`path = ${submodulePath}`)) {
      // Return the current HEAD sha as a no-op indicator
      const { data: ref } = await octokit.git.getRef({ owner: platformOrg, repo: repoName, ref: "heads/main" });
      return { commitSha: ref.object.sha };
    }

    const submoduleName = submodulePath.replace(/\//g, "-");
    gitmodulesContent +=
      `\n[submodule "${submoduleName}"]\n\tpath = ${submodulePath}\n\turl = ${starterRepo}\n`;

    const sha = await commitFiles(
      repoName,
      [{ path: ".gitmodules", content: gitmodulesContent }],
      `chore: add submodule ${submodulePath}`,
    );
    return { commitSha: sha };
  } catch (err) {
    handleGitHubError(err);
  }
}

/**
 * Remove a submodule entry from .gitmodules in the org's repo.
 * Does NOT delete the directory itself (that would need a full checkout).
 */
export async function removeChallengeSubmodule(
  orgSlug: string,
  submodulePath: string,
): Promise<{ commitSha: string }> {
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();
  const repoName = orgRepoName(orgSlug);

  try {
    const { data: refData } = await octokit.git.getRef({
      owner: platformOrg, repo: repoName, ref: "heads/main",
    });
    const headSha = refData.object.sha;

    let gitmodulesContent = "";
    try {
      const { data: blob } = await octokit.repos.getContent({
        owner: platformOrg, repo: repoName, path: ".gitmodules",
      });
      if ("content" in blob && typeof blob.content === "string") {
        gitmodulesContent = Buffer.from(blob.content, "base64").toString("utf8");
      }
    } catch {
      return { commitSha: headSha }; // nothing to remove
    }

    const blockPattern = new RegExp(
      `\\[submodule "[^"]*"\\][^\\[]*path = ${submodulePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\[]*`,
      "g",
    );
    const updated = gitmodulesContent.replace(blockPattern, "").trim();

    const sha = await commitFiles(
      repoName,
      [{ path: ".gitmodules", content: updated }],
      `chore: remove submodule ${submodulePath}`,
    );
    return { commitSha: sha };
  } catch (err) {
    handleGitHubError(err);
  }
}

/**
 * Archive a repo (soft-delete — the repo still exists but is read-only).
 */
export async function archiveRepo(repoName: string): Promise<RepoInfo> {
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();
  try {
    const { data } = await octokit.repos.update({
      owner: platformOrg,
      repo: repoName,
      archived: true,
    });
    return mapRepo(data);
  } catch (err) {
    handleGitHubError(err);
  }
}

/**
 * Hard-delete a repo. Requires GITHUB_DELETE_ENABLED=true env var as an
 * extra safety gate — this operation is irreversible.
 */
export async function deleteRepo(repoName: string): Promise<void> {
  if (process.env.GITHUB_DELETE_ENABLED !== "true") {
    throw new GitHubConfigError(
      "Repo deletion is disabled. Set GITHUB_DELETE_ENABLED=true to enable.",
    );
  }
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();
  try {
    await octokit.repos.delete({ owner: platformOrg, repo: repoName });
  } catch (err) {
    handleGitHubError(err);
  }
}

/**
 * Update the description or visibility of an existing repo.
 */
export async function updateRepo(
  repoName: string,
  updates: { description?: string; private?: boolean },
): Promise<RepoInfo> {
  const octokit = getOctokit();
  const platformOrg = getPlatformOrg();
  try {
    const { data } = await octokit.repos.update({
      owner: platformOrg,
      repo: repoName,
      ...updates,
    });
    return mapRepo(data);
  } catch (err) {
    handleGitHubError(err);
  }
}
