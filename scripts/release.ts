#!/usr/bin/env bun
/**
 * Release: bump apps/web/package.json version from commits since last v* tag, commit, tag, push.
 * Patch vs minor: minor if any commit subject matches conventional feat / feature; else patch.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = path.join(import.meta.dirname, "..");
const PACKAGE_JSON = path.join(REPO_ROOT, "apps", "web", "package.json");

const FEAT_SUBJECT_RE = /^(feat(\([^)]+\))?:|feature:)/i;

function sh(
  command: string,
  cwd: string = REPO_ROOT,
): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf-8",
  });
  return {
    ok: r.status === 0,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
  };
}

function printUsage(): void {
  console.log(`Usage: bun scripts/release.ts [--dry-run]

Options:
  --dry-run   Print version bump and tag; do not write files, commit, tag, or push
  --help, -h  Show help

Environment:
  RELEASE_BRANCH  Branch name required (default: main)
  RELEASE_NO_GPG  If set to 1/true, git commit/tag run with signing disabled
                  (useful when commit/tag signing via 1Password errors locally).
`);
}

function getReleaseBranch(): string {
  return process.env["RELEASE_BRANCH"]?.trim() || "main";
}

function getCurrentBranch(): string | null {
  const { ok, stdout } = sh("git rev-parse --abbrev-ref HEAD");
  if (!ok) return null;
  return stdout.trim() || null;
}

function isWorkingTreeClean(): boolean {
  const { ok, stdout } = sh("git status --porcelain");
  return ok && stdout.trim() === "";
}

/** Most recent v* tag reachable from HEAD, or null */
function getLatestMergedVersionTag(): string | null {
  const { ok, stdout } = sh(
    "git tag -l 'v*' --merged HEAD --sort=-v:refname",
  );
  if (!ok) return null;
  const lines = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines[0] ?? null;
}

function getCommitSubjectsSince(prevTag: string | null): string[] {
  const range = prevTag ? `${prevTag}..HEAD` : "HEAD";
  const { ok, stdout, stderr } = sh(
    `git log ${range} --pretty=format:%s --no-merges`,
  );
  if (!ok) {
    console.error("git log failed:", stderr);
    process.exit(1);
  }
  return stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function countCommitsSince(prevTag: string | null): number {
  const range = prevTag ? `${prevTag}..HEAD` : "HEAD";
  const { ok, stdout } = sh(`git rev-list --count ${range}`);
  if (!ok) return 0;
  const n = Number.parseInt(stdout.trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function shouldBumpMinor(subjects: string[]): boolean {
  return subjects.some((s) => FEAT_SUBJECT_RE.test(s));
}

function parseVersion(v: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function bumpVersion(current: string, minor: boolean): string {
  const parts = parseVersion(current);
  if (!parts) {
    console.error(`Invalid version in package.json: ${current}`);
    process.exit(1);
  }
  const [major, mid, patch] = parts;
  if (minor) {
    return `${major}.${mid + 1}.0`;
  }
  return `${major}.${mid}.${patch + 1}`;
}

function readPackageVersion(): string {
  const raw = readFileSync(PACKAGE_JSON, "utf-8");
  const pkg = JSON.parse(raw) as { version?: string };
  if (!pkg.version || typeof pkg.version !== "string") {
    console.error("apps/web/package.json: missing version string");
    process.exit(1);
  }
  return pkg.version;
}

function writePackageVersion(version: string): void {
  const raw = readFileSync(PACKAGE_JSON, "utf-8");
  const pkg = JSON.parse(raw) as Record<string, unknown>;
  pkg.version = version;
  writeFileSync(
    PACKAGE_JSON,
    `${JSON.stringify(pkg, null, 2)}\n`,
    "utf-8",
  );
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }
  const dryRun = args.includes("--dry-run");
  const branch = getReleaseBranch();
  const noGpgEnv = process.env["RELEASE_NO_GPG"]?.trim().toLowerCase();
  const noGpg = noGpgEnv === "1" || noGpgEnv === "true" || noGpgEnv === "yes";
  const gitCommit = noGpg ? "git -c commit.gpgsign=false commit" : "git commit";
  const gitTag = noGpg ? "git -c tag.gpgSign=false tag" : "git tag";

  const currentBranch = getCurrentBranch();
  if (!currentBranch) {
    console.error("Could not determine current git branch.");
    process.exit(1);
  }
  if (currentBranch !== branch) {
    console.error(
      `Must be on branch "${branch}" (current: "${currentBranch}").`,
    );
    process.exit(1);
  }

  if (!isWorkingTreeClean()) {
    console.error(
      "Working tree is not clean. Commit or stash changes before releasing.",
    );
    process.exit(1);
  }

  const prevTag = getLatestMergedVersionTag();
  const commitCount = countCommitsSince(prevTag);
  if (prevTag && commitCount === 0) {
    console.error(
      `No commits since last tag ${prevTag}. Nothing to release.`,
    );
    process.exit(1);
  }
  if (!prevTag && commitCount === 0) {
    console.error("No commits on branch. Nothing to release.");
    process.exit(1);
  }

  const subjects = getCommitSubjectsSince(prevTag);
  const minor = shouldBumpMinor(subjects);
  const currentVer = readPackageVersion();
  const nextVer = bumpVersion(currentVer, minor);
  const tagName = `v${nextVer}`;

  console.log(
    `Previous tag: ${prevTag ?? "(none)"}\n` +
      `Commits since: ${commitCount}\n` +
      `Bump: ${minor ? "minor" : "patch"}\n` +
      `Version: ${currentVer} → ${nextVer}\n` +
      `Tag: ${tagName}`,
  );

  if (dryRun) {
    console.log("\nDry run: no changes made.");
    return;
  }

  writePackageVersion(nextVer);

  const stage = sh("git add apps/web/package.json");
  if (!stage.ok) {
    console.error("git add failed:", stage.stderr);
    process.exit(1);
  }

  const commitMsg = `chore(release): bump version to ${nextVer}`;
  const commit = sh(`${gitCommit} -m ${JSON.stringify(commitMsg)}`);
  if (!commit.ok) {
    console.error("git commit failed:", commit.stderr);
    process.exit(1);
  }

  const tag = sh(
    `${gitTag} -a ${tagName} -m ${JSON.stringify(`Release ${tagName}`)}`,
  );
  if (!tag.ok) {
    console.error("git tag failed:", tag.stderr);
    process.exit(1);
  }

  const pushBranch = sh(`git push origin ${JSON.stringify(branch)}`);
  if (!pushBranch.ok) {
    console.error("git push branch failed:", pushBranch.stderr);
    process.exit(1);
  }

  const pushTag = sh(`git push origin ${JSON.stringify(tagName)}`);
  if (!pushTag.ok) {
    console.error("git push tag failed:", pushTag.stderr);
    process.exit(1);
  }

  console.log(`\nReleased ${tagName} and pushed to origin.`);
}

main();
