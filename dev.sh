#!/bin/bash
# Auto-restarting dev server — restarts on crash
cd "$(dirname "$0")"
while true; do
  echo "[dev.sh] Starting Vite dev server..."
  npm run dev -- --host 0.0.0.0 --port 5173
  EXIT_CODE=$?
  echo "[dev.sh] Server exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done
