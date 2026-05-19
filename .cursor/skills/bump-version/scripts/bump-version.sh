#!/usr/bin/env bash
# Bump Whispr version across manifests, commit, tag, and push.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

PKG="$ROOT/package.json"
CARGO="$ROOT/src-tauri/Cargo.toml"
TAURI="$ROOT/src-tauri/tauri.conf.json"
LOCK="$ROOT/src-tauri/Cargo.lock"
RELEASE_BODY="$ROOT/.github/RELEASE_BODY.md"
TAG_MSG_FILE="$(mktemp)"
trap 'rm -f "$TAG_MSG_FILE"' EXIT

usage() {
  echo "Usage: $0 [version] [--patch|--minor|--major] [--no-push]"
  echo "  (no version)  auto-increment from package.json (default: patch)"
  echo "  version       explicit target, e.g. 0.1.4 or v0.1.4"
  echo "  --patch       bump patch (default when auto)"
  echo "  --minor       bump minor, reset patch to 0"
  echo "  --major       bump major, reset minor and patch to 0"
  echo "  --no-push     commit locally only"
  exit 1
}

current_version() {
  grep -m1 '"version"' "$PKG" | sed -E 's/.*"version": "([^"]+)".*/\1/'
}

bump_semver() {
  local cur="$1" kind="$2"
  local major minor patch
  IFS=. read -r major minor patch <<<"$cur"
  [[ "$major" =~ ^[0-9]+$ && "$minor" =~ ^[0-9]+$ && "$patch" =~ ^[0-9]+$ ]] \
    || { echo "error: invalid current version: $cur"; exit 1; }
  case "$kind" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "$major.$((minor + 1)).0" ;;
    patch) echo "$major.$minor.$((patch + 1))" ;;
    *) echo "error: unknown bump kind: $kind"; exit 1 ;;
  esac
}

# Latest v* tag by semver (may equal current release before bump).
previous_tag() {
  git tag -l 'v[0-9]*' --sort=-v:refname 2>/dev/null | head -1 || true
}

# Commits since previous tag, excluding version bumps and merges.
collect_commit_subjects() {
  local prev="${1:-}"
  local range
  if [[ -n "$prev" ]] && git rev-parse "$prev" >/dev/null 2>&1; then
    range="${prev}..HEAD"
  else
    range="HEAD"
  fi
  git log "$range" --no-merges --pretty=format:'%s' \
    | grep -vE '^version: v[0-9]' \
    | grep -vE '^chore: bump version' || true
}

# One-line summary for the annotated tag (max ~140 chars).
build_tag_summary() {
  local -a subjects=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && subjects+=("$line")
  done < <(collect_commit_subjects "$1")

  if [[ ${#subjects[@]} -eq 0 ]]; then
    echo "Maintenance and improvements."
    return
  fi

  local summary=""
  local s
  for s in "${subjects[@]}"; do
    if [[ -z "$summary" ]]; then
      summary="$s"
    elif [[ $((${#summary} + ${#s} + 2)) -le 120 ]]; then
      summary="${summary}; ${s}"
    else
      break
    fi
  done
  # Trim trailing semicolon fragment if we cut mid-list
  if [[ ${#subjects[@]} -gt 1 && ${#summary} -gt 120 ]]; then
    summary="${summary:0:117}..."
  fi
  echo "${summary}."
}

# Markdown body for GitHub release (.github/RELEASE_BODY.md).
write_release_body() {
  local prev="$1" tag="$2"
  local -a subjects=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && subjects+=("$line")
  done < <(collect_commit_subjects "$prev")

  mkdir -p "$(dirname "$RELEASE_BODY")"

  {
    echo "## Whispr ${tag}"
    echo ""
    if [[ ${#subjects[@]} -eq 0 ]]; then
      echo "- Maintenance and improvements"
    else
      local s
      for s in "${subjects[@]}"; do
        echo "- ${s}"
      done
    fi
    echo ""
    echo "---"
    echo ""
    echo "Offline transcription for video and audio on macOS."
    echo ""
    echo "Download the \`.dmg\` for your Mac (Apple Silicon or Intel) from the assets below."
  } >"$RELEASE_BODY"
}

BUMP_KIND="patch"
NO_PUSH=false
RAW=""

for arg in "$@"; do
  case "$arg" in
    --no-push) NO_PUSH=true ;;
    --patch) BUMP_KIND="patch" ;;
    --minor) BUMP_KIND="minor" ;;
    --major) BUMP_KIND="major" ;;
    -h | --help) usage ;;
    -*)
      echo "error: unknown option: $arg"
      usage
      ;;
    *)
      if [[ -n "$RAW" ]]; then
        echo "error: only one version argument allowed"
        usage
      fi
      RAW="$arg"
      ;;
  esac
done

if [[ -n "$RAW" ]]; then
  VER="${RAW#v}"
else
  CUR="$(current_version)"
  VER="$(bump_semver "$CUR" "$BUMP_KIND")"
  echo "Auto-increment ($BUMP_KIND): $CUR -> $VER"
fi

TAG="v${VER}"

if [[ ! "$VER" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "error: version must be semver (e.g. 0.1.4), got: ${RAW:-$VER}"
  exit 1
fi

PREV_TAG="$(previous_tag)"
if [[ -n "$PREV_TAG" ]]; then
  echo "Commits since ${PREV_TAG}:"
  collect_commit_subjects "$PREV_TAG" | sed 's/^/  - /' || true
  echo ""
fi

SUMMARY="$(build_tag_summary "$PREV_TAG")"
write_release_body "$PREV_TAG" "$TAG"

{
  echo "$TAG"
  echo ""
  echo "$SUMMARY"
} >"$TAG_MSG_FILE"

echo "Tag summary: $SUMMARY"
echo "Release notes: .github/RELEASE_BODY.md"

for f in "$PKG" "$CARGO" "$TAURI" "$LOCK"; do
  [[ -f "$f" ]] || { echo "error: missing $f"; exit 1; }
done

sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VER\"/" "$PKG"
sed -i '' "s/^version = \"[^\"]*\"/version = \"$VER\"/" "$CARGO"
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VER\"/" "$TAURI"
perl -i -0pe "s/(name = \"whispr\"\nversion = )\"[^\"]+\"/\${1}\"$VER\"/" "$LOCK"

echo "Bumped to $VER in:"
echo "  package.json"
echo "  src-tauri/Cargo.toml"
echo "  src-tauri/tauri.conf.json"
echo "  src-tauri/Cargo.lock"

git add "$PKG" "$CARGO" "$TAURI" "$LOCK" "$RELEASE_BODY"
if git diff --cached --quiet; then
  echo "error: no version changes to commit (already $VER?)"
  exit 1
fi

git commit -m "version: $TAG"

if [[ "$NO_PUSH" == true ]]; then
  echo "Committed locally. Tag and push manually:"
  echo "  git tag -a $TAG -F - <<'EOF'"
  cat "$TAG_MSG_FILE"
  echo "EOF"
  echo "  git push origin $(git rev-parse --abbrev-ref HEAD)"
  echo "  git push origin $TAG"
  exit 0
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git push origin "$BRANCH"
git tag -a "$TAG" -F "$TAG_MSG_FILE"
git push origin "$TAG"

echo "Done: $TAG pushed on $BRANCH"
