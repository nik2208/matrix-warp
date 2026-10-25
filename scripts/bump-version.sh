#!/usr/bin/env bash
# ==============================================================================
# Semantic Versioning Helper (SemVer 2.0.0)
# Usage: bash scripts/bump-version.sh [patch|minor|major|<explicit-version>] [summary]
# Updates package.json, VERSION, index.html (JSON-LD softwareVersion), and CHANGELOG.md
# ==============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

BUMP_TYPE="${1:-patch}"
SUMMARY="${2:-Autonomous update via OpenCode}"

CURRENT_VER=$(node -p "require('./package.json').version" 2>/dev/null || cat VERSION 2>/dev/null || echo "1.0.0")
CURRENT_VER=$(echo "$CURRENT_VER" | tr -d '[:space:]v')

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VER"
MAJOR="${MAJOR:-1}"
MINOR="${MINOR:-0}"
PATCH="${PATCH:-0}"

case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    NEW_VER="${MAJOR}.${MINOR}.${PATCH}"
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    NEW_VER="${MAJOR}.${MINOR}.${PATCH}"
    ;;
  patch)
    PATCH=$((PATCH + 1))
    NEW_VER="${MAJOR}.${MINOR}.${PATCH}"
    ;;
  *)
    if [[ "$BUMP_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      NEW_VER="$BUMP_TYPE"
    else
      echo "Invalid bump type '$BUMP_TYPE'. Use: patch | minor | major | X.Y.Z" >&2
      exit 1
    fi
    ;;
esac

echo "🔖 Bumping version: v${CURRENT_VER} -> v${NEW_VER}"

# 1. Update VERSION file
echo "$NEW_VER" > VERSION

# 2. Update package.json (& package-lock.json if present) without creating a git tag yet
npm version "$NEW_VER" --no-git-tag-version --allow-same-version >/dev/null 2>&1 || \
  node -e '
    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    pkg.version = process.argv[1];
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
  ' "$NEW_VER"

# 3. Update JSON-LD softwareVersion in index.html if present
if [ -f index.html ]; then
  node -e '
    const fs = require("fs");
    const html = fs.readFileSync("index.html", "utf8");
    const updated = html.replace(/"softwareVersion":\s*"[^"]+"/, `"softwareVersion": "${process.argv[1]}"`);
    fs.writeFileSync("index.html", updated);
  ' "$NEW_VER"
fi

# 3b. Update SemVer badge in README.md if present
if [ -f README.md ]; then
  node -e '
    const fs = require("fs");
    const ver = process.argv[1];
    const md = fs.readFileSync("README.md", "utf8");
    const updated = md
      .replace(/\[!\[SemVer v[^\]]+\]/g, `[![SemVer v${ver}]`)
      .replace(/badge\/SemVer-v[0-9]+\.[0-9]+\.[0-9]+-/g, `badge/SemVer-v${ver}-`);
    fs.writeFileSync("README.md", updated);
  ' "$NEW_VER"
fi

# 4. Prepend entry to CHANGELOG.md if not already documented
if [ -f CHANGELOG.md ] && ! grep -q "## \[${NEW_VER}\]" CHANGELOG.md; then
  TODAY=$(date +%Y-%m-%d)
  node -e '
    const fs = require("fs");
    const ver = process.argv[1];
    const date = process.argv[2];
    const summary = process.argv[3];
    const content = fs.readFileSync("CHANGELOG.md", "utf8");
    const entry = `## [${ver}] - ${date}\n\n### Changed\n- ${summary}\n\n`;
    const marker = "## [";
    const idx = content.indexOf(marker);
    if (idx !== -1) {
      const updated = content.slice(0, idx) + entry + content.slice(idx);
      fs.writeFileSync("CHANGELOG.md", updated);
    } else {
      fs.writeFileSync("CHANGELOG.md", content + "\n" + entry);
    }
  ' "$NEW_VER" "$TODAY" "$SUMMARY"
fi

echo "$NEW_VER"
