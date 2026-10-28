#!/usr/bin/env bash
# Usage: ./scripts/pack-context.sh T05
# Builds .context/T05.md = AGENTS.md + docs listed in the task's "Reads:" line
# + source files listed in "Include:" + the task + status. Paste or upload it into ChatGPT.
set -euo pipefail
cd "$(dirname "$0")/.."

TASK="${1:?Usage: scripts/pack-context.sh T05}"
TASK_FILE="$(ls harness/tasks/${TASK}-*.md 2>/dev/null | head -n1 || true)"
[ -n "$TASK_FILE" ] || { echo "Task $TASK not found in harness/tasks/"; exit 1; }

mkdir -p .context
OUT=".context/${TASK}.md"

DOCS="$(grep -m1 '^Reads:' "$TASK_FILE" | sed 's/^Reads://' || true)"
FILES="$(grep -m1 '^Include:' "$TASK_FILE" | sed 's/^Include://' || true)"

{
  echo "# CONTEXT PACK — $TASK"
  echo; echo "## AGENTS.md"; cat AGENTS.md
  for d in $DOCS; do
    echo; echo "## docs/$d"; cat "docs/$d"
  done
  for f in $FILES; do
    if [ -f "$f" ]; then
      echo; echo "## EXISTING FILE: $f"; echo '```'; cat "$f"; echo '```'
    else
      echo; echo "## (missing, create it if the task says so): $f"
    fi
  done
  if [ -d src ]; then
    echo; echo "## Current file tree"; find src tests -type f 2>/dev/null | sort
  fi
  echo; echo "## harness/status.md"; cat harness/status.md
  echo; echo "## TASK — $TASK_FILE"; cat "$TASK_FILE"
} > "$OUT"

CHARS=$(wc -c < "$OUT" | tr -d ' ')
echo "Wrote $OUT ($CHARS chars)"
[ "$CHARS" -gt 40000 ] && echo "WARNING: pack is large — remove files from the task's Include: line or split the task."

if   command -v pbcopy   >/dev/null 2>&1; then pbcopy < "$OUT"   && echo "Copied to clipboard."
elif command -v clip.exe >/dev/null 2>&1; then clip.exe < "$OUT" && echo "Copied to clipboard."
elif command -v xclip    >/dev/null 2>&1; then xclip -selection clipboard < "$OUT" && echo "Copied to clipboard."
fi
exit 0
