#!/usr/bin/env bash
# ./ax stop — tear down services started by ./ax start.
#
# Web runs in the foreground (pnpm dev); API runs in background (uvicorn).
# Stop both so a subsequent ./ax start gets a clean slate.
#
# Expects service helpers from lib/ax/services.sh to be sourced first.

ax_stop() {
  ax_stop_web
  ax_stop_api
}
