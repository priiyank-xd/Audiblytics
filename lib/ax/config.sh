#!/usr/bin/env bash
# Port and URL settings — repo root .env is the single source of truth.
#
# Loaded by ./ax before every command. Defaults match historical conventions
# (web :3000, api :8000, postgres :5432) when .env is missing or vars unset.

ax_ensure_root_env() {
  if [[ -f "$AX_ROOT/.env" ]]; then
    return 0
  fi
  if [[ -f "$AX_ROOT/.env.example" ]]; then
    echo "Creating .env from .env.example..."
    cp "$AX_ROOT/.env.example" "$AX_ROOT/.env"
  fi
}

ax_load_config() {
  ax_ensure_root_env

  if [[ -f "$AX_ROOT/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$AX_ROOT/.env"
    set +a
  fi

  AX_WEB_PORT="${WEB_PORT:-3000}"
  AX_API_PORT="${API_PORT:-8000}"
  AX_POSTGRES_PORT="${POSTGRES_PORT:-5432}"
  AX_API_HOST="${API_HOST:-127.0.0.1}"
  AX_API_URL="${API_URL:-http://${AX_API_HOST}:${AX_API_PORT}}"
  AX_CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:${AX_WEB_PORT}}"
  AX_DATABASE_URL="postgresql+asyncpg://audiblytics:audiblytics@localhost:${AX_POSTGRES_PORT}/audiblytics"
}

# Update or append KEY=value in a dotenv file (used to sync app .env from root config).
ax_set_env_var() {
  local file="$1" key="$2" value="$3"

  [[ -f "$file" ]] || touch "$file"

  if grep -q "^${key}=" "$file" 2>/dev/null; then
    if sed --version 2>/dev/null | grep -q GNU; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    else
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    fi
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

# Keep apps/api/.env CORS aligned; DATABASE_URL is set on first create and passed via env at uvicorn start.
ax_sync_api_env() {
  [[ -f "$AX_API/.env" ]] || return 0
  ax_set_env_var "$AX_API/.env" "CORS_ORIGINS" "$AX_CORS_ORIGINS"
}

# Keep apps/web/.env.local proxy target aligned in API mode.
ax_sync_web_env() {
  [[ -f "$AX_WEB/.env.local" ]] || return 0
  ax_set_env_var "$AX_WEB/.env.local" "API_URL" "$AX_API_URL"
}
