#!/usr/bin/env bash
# Service helpers for ./ax start / ./ax stop.
#
# Manages three local services (ports from repo root .env via lib/ax/config.sh):
#   - Web:  Next.js dev server (foreground, via pnpm dev in start.sh)
#   - API:  FastAPI (background uvicorn, API mode only)
#   - DB:   Postgres via docker compose (API mode only)
#
# Expects AX_* port/URL vars from ax_load_config, plus AX_ROOT, AX_WEB, AX_API, AX_API_PID_FILE.

# ---------------------------------------------------------------------------
# Web — process discovery
# The web port is shared by many apps; filter to Audiblytics-owned processes only.
# ---------------------------------------------------------------------------

# Resolve a process working directory (used to match apps/web).
ax_process_cwd() {
  local pid="$1"
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1
}

# True when pid belongs to this repo's Next.js dev server (not any listener on AX_WEB_PORT).
ax_is_web_pid() {
  local pid="$1"
  local cwd args

  cwd="$(ax_process_cwd "$pid")"
  if [[ "$cwd" == "$AX_WEB" || "$cwd" == "$AX_WEB/"* ]]; then
    return 0
  fi

  # Fallback: match command line when cwd lookup fails (e.g. sandboxed processes).
  args="$(ps -p "$pid" -o args= 2>/dev/null || true)"
  [[ "$args" == *"$AX_WEB"* || ( "$args" == *"next dev"* && "$args" == *"Audiblytics"* ) ]]
}

ax_append_unique_pid() {
  local pid="$1"
  local list="$2"

  [[ -z "$pid" ]] && { echo "$list"; return; }
  case " $list " in
    *" $pid "*) echo "$list" ;;
    *) echo "${list:+$list }$pid" ;;
  esac
}

# Collect Audiblytics web PIDs via port bind and pgrep (covers parent/child trees).
ax_collect_web_pids() {
  local list=""
  local pid

  if command -v lsof >/dev/null 2>&1; then
    for pid in $(lsof -ti :"$AX_WEB_PORT" 2>/dev/null || true); do
      if ax_is_web_pid "$pid"; then
        list="$(ax_append_unique_pid "$pid" "$list")"
      fi
    done
  fi

  if command -v pgrep >/dev/null 2>&1; then
    for pid in $(pgrep -f "next dev" 2>/dev/null || true); do
      if ax_is_web_pid "$pid"; then
        list="$(ax_append_unique_pid "$pid" "$list")"
      fi
    done
  fi

  if [[ -n "$list" ]]; then
    echo "$list" | tr ' ' '\n'
  fi
}

# ---------------------------------------------------------------------------
# Web — shutdown
# SIGTERM first, then SIGKILL after 5s if Next.js child processes linger.
# ---------------------------------------------------------------------------

ax_stop_web() {
  local list pid
  list="$(ax_collect_web_pids || true)"

  if [[ -z "$list" ]]; then
    echo "No Audiblytics web dev server running on port ${AX_WEB_PORT}."
    return 0
  fi

  echo "Stopping Audiblytics web dev server (PID(s): $(echo "$list" | tr '\n' ' ' | sed 's/ $//'))..."
  while IFS= read -r pid; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  done <<< "$list"

  local waited=0
  while ((waited < 5)); do
    if [[ -z "$(ax_collect_web_pids || true)" ]]; then
      echo "Stopped."
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done

  echo "Force-stopping remaining process(es)..."
  list="$(ax_collect_web_pids || true)"
  while IFS= read -r pid; do
    [[ -n "$pid" ]] && kill -9 "$pid" 2>/dev/null || true
  done <<< "$list"

  echo "Stopped."
}

# ---------------------------------------------------------------------------
# Mode detection
# ---------------------------------------------------------------------------

# API mode when web env opts into FastAPI backend (see apps/web/.env.local).
ax_is_api_mode() {
  [[ -f "$AX_WEB/.env.local" ]] && grep -q '^NEXT_PUBLIC_STORAGE_BACKEND=api' "$AX_WEB/.env.local"
}

ax_port_in_use() {
  local port="$1"
  lsof -ti :"$port" >/dev/null 2>&1
}

# ---------------------------------------------------------------------------
# Postgres (API mode)
# Only the postgres service — not the full docker compose stack.
# ---------------------------------------------------------------------------

ax_start_postgres() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required for API mode (Postgres). Install Docker or switch to local mode." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Start Docker Desktop, then run ./ax start again." >&2
    exit 1
  fi
  echo "Starting Postgres (docker compose)..."
  (cd "$AX_ROOT" && docker compose up -d postgres)
}

# ---------------------------------------------------------------------------
# API (API mode)
# uvicorn runs in background; PID persisted so ./ax stop can tear it down.
# ---------------------------------------------------------------------------

ax_ensure_api_env() {
  if [[ ! -f "$AX_API/.env" ]]; then
    echo "Creating apps/api/.env from .env.example..."
    cp "$AX_API/.env.example" "$AX_API/.env"
    ax_set_env_var "$AX_API/.env" "DATABASE_URL" "$AX_DATABASE_URL"
  fi
  ax_sync_api_env
}

ax_ensure_api_venv() {
  if [[ ! -d "$AX_API/.venv" ]]; then
    echo "Creating Python venv and installing apps/api dependencies..."
    python3 -m venv "$AX_API/.venv"
    "$AX_API/.venv/bin/pip" install -e "${AX_API}[dev]"
  fi
}

# Start background uvicorn and block until /api/v1/health responds (max 30s).
ax_start_api() {
  if ax_port_in_use "$AX_API_PORT"; then
    echo "API already listening on port ${AX_API_PORT}."
    return 0
  fi

  ax_ensure_api_env
  ax_ensure_api_venv

  echo "Starting FastAPI at ${AX_API_URL} ..."
  (
    cd "$AX_API"
    nohup env DATABASE_URL="$AX_DATABASE_URL" CORS_ORIGINS="$AX_CORS_ORIGINS" \
      "$AX_API/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port "$AX_API_PORT" \
      >"$AX_ROOT/.dev-api.log" 2>&1 &
    echo $! >"$AX_API_PID_FILE"
  )

  local waited=0
  while ((waited < 30)); do
    if curl -sf "${AX_API_URL}/api/v1/health" >/dev/null 2>&1; then
      echo "API ready."
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done

  echo "API did not become ready within 30s. See $AX_ROOT/.dev-api.log" >&2
  exit 1
}

# Prefer PID file from ./ax start; fall back to killing whatever owns AX_API_PORT.
ax_stop_api() {
  local pid=""

  if [[ -f "$AX_API_PID_FILE" ]]; then
    pid="$(cat "$AX_API_PID_FILE" 2>/dev/null || true)"
  fi

  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "Stopping Audiblytics API (PID $pid)..."
    kill "$pid" 2>/dev/null || true
    rm -f "$AX_API_PID_FILE"
    echo "API stopped."
    return 0
  fi

  if ax_port_in_use "$AX_API_PORT"; then
    local port_pid
    port_pid="$(lsof -ti :"$AX_API_PORT" 2>/dev/null | head -1 || true)"
    if [[ -n "$port_pid" ]]; then
      echo "Stopping process on port ${AX_API_PORT} (PID $port_pid)..."
      kill "$port_pid" 2>/dev/null || true
    fi
  fi

  rm -f "$AX_API_PID_FILE"
}
