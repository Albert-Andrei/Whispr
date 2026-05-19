---
name: bump-version
description: >-
  Bump Whispr version (auto-increment patch), generate release notes from commits
  since the last tag, commit, annotated tag, and push. Use when the user asks to
  bump version, release, tag, or ship a new version.
---

# Bump version (Whispr)

## Quick run

From repo root — **no version required** (reads `package.json`, bumps patch):

```bash
.cursor/skills/bump-version/scripts/bump-version.sh
```

Examples:

```bash
# patch: 0.1.3 -> 0.1.4 (default)
.cursor/skills/bump-version/scripts/bump-version.sh

# minor: 0.1.3 -> 0.2.0
.cursor/skills/bump-version/scripts/bump-version.sh --minor

# major: 0.1.3 -> 1.0.0
.cursor/skills/bump-version/scripts/bump-version.sh --major

# explicit version (skips auto-increment)
.cursor/skills/bump-version/scripts/bump-version.sh 0.2.0

# commit only, no push/tag
.cursor/skills/bump-version/scripts/bump-version.sh --no-push
```

## What it does

1. Read current version from `package.json` (or use explicit argument); default **patch +1**.
2. List commits since the latest `v*` tag (excludes `version: v*` and merge commits).
3. Build **short tag summary** (first lines joined, ~120 chars) and **`.github/RELEASE_BODY.md`** (bullet list for GitHub).
4. Bump `package.json`, `Cargo.toml`, `tauri.conf.json`, `Cargo.lock`.
5. Commit: `version: vX.Y.Z` (includes `RELEASE_BODY.md`).
6. Push branch, create **annotated tag** with summary, push tag.

## Release notes

| Output                    | Used for                                            |
| ------------------------- | --------------------------------------------------- |
| Annotated tag message     | `git tag -a` — title + short summary                |
| `.github/RELEASE_BODY.md` | GitHub Release body (via `release.yml` `body_path`) |

Commits are taken from `previous_tag..HEAD` before the version commit. Subjects become `- bullet` lines; the tag summary is a short semicolon-separated line.

## Rules

- **Never** `git push --force` for tags.
- Commit message: `version: vX.Y.Z`.
- When the user says “bump version” or “release”, run the script with **no version argument**.
- Requires `git` and network push access; `gh` is not required (Actions creates the release).

## After push

`.github/workflows/release.yml` builds DMGs and publishes using `.github/RELEASE_BODY.md` on the tagged commit.
