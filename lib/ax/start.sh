#!/usr/bin/env bash
# ./ax start — bring up the local dev stack.
#
# Local mode:  web only (IndexedDB + localStorage).
# API mode:    postgres → api (background) → web (foreground).
#
# Expects config (lib/ax/config.sh) and service helpers (lib/ax/services.sh) sourced first.

ax_start() {
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm is required. Install: https://pnpm.io/installation" >&2
    exit 1
  fi

  # Orphaned next dev from a prior session blocks the web port — clean up first.
  local stale
  stale="$(ax_collect_web_pids || true)"
  if [[ -n "$stale" ]]; then
    echo "Found stale Audiblytics web dev server — cleaning up first."
    ax_stop_web
    echo
  fi

  if [[ ! -d "$AX_WEB/node_modules" ]]; then
    echo "Installing dependencies in apps/web..."
    (cd "$AX_WEB" && pnpm install)
  fi

  echo "Starting Audiblytics web at http://localhost:${AX_WEB_PORT}"
  if ax_is_api_mode; then
    echo "API mode detected (NEXT_PUBLIC_STORAGE_BACKEND=api)."
    ax_sync_web_env
    ax_start_postgres
    ax_start_api
  fi
  echo "Press Ctrl+C to stop, or run: ./ax stop"
  echo

  # PORT and API_URL override apps/web/.env.local for this session.
  cd "$AX_WEB"
  export PORT="$AX_WEB_PORT"
  export API_URL="$AX_API_URL"
  exec pnpm dev
}
