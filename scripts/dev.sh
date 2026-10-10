#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$ROOT/apps/api"
WEB_DIR="$ROOT/apps/web"
PID_DIR="$ROOT/.run"
API_LOG="$PID_DIR/api.log"
WEB_LOG="$PID_DIR/web.log"

export PATH="/opt/homebrew/bin:/opt/homebrew/opt/postgresql@16/bin:${PATH:-}"

mkdir -p "$PID_DIR"

usage() {
  cat <<EOF
Usage: ./run.sh [start|stop|status]

  start   Start API + Web and keep this terminal attached (default)
          Press Ctrl+C here to stop both
  stop    Stop API + Web
  status  Show whether ports 8080 / 3000 are in use
EOF
}

is_up() {
  local port="$1"
  lsof -ti:"$port" >/dev/null 2>&1
}

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "→ Stopping :$port"
    kill $pids 2>/dev/null || true
    sleep 0.4
    pids="$(lsof -ti:"$port" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

cmd_stop() {
  echo "Stopping BAN BUNSI..."
  if [[ -f "$PID_DIR/api.pid" ]]; then
    kill "$(cat "$PID_DIR/api.pid")" 2>/dev/null || true
    rm -f "$PID_DIR/api.pid"
  fi
  if [[ -f "$PID_DIR/web.pid" ]]; then
    kill "$(cat "$PID_DIR/web.pid")" 2>/dev/null || true
    rm -f "$PID_DIR/web.pid"
  fi
  stop_port 3000
  stop_port 8080
  echo "✓ Stopped frontend + backend"
}

cmd_status() {
  if is_up 8080; then echo "API  :8080  running"; else echo "API  :8080  stopped"; fi
  if is_up 3000; then echo "Web  :3000  running"; else echo "Web  :3000  stopped"; fi
}

start_postgres() {
  if command -v brew >/dev/null 2>&1; then
    if ! pg_isready -q 2>/dev/null; then
      echo "→ Starting PostgreSQL..."
      brew services start postgresql@16 >/dev/null 2>&1 || true
      sleep 1
    fi
  fi
}

cleanup() {
  trap - INT TERM EXIT
  echo ""
  echo "Stopping services..."
  cmd_stop
  exit 0
}

cmd_start() {
  trap cleanup INT TERM

  start_postgres

  if is_up 8080; then
    echo "✓ API already on :8080"
  else
    echo "→ Starting API (Go) on :8080..."
    : >"$API_LOG"
    (
      cd "$API_DIR"
      if [[ -x ./bin/server ]]; then
        exec ./bin/server
      else
        exec go run ./cmd/server
      fi
    ) >>"$API_LOG" 2>&1 &
    echo $! >"$PID_DIR/api.pid"
    for _ in $(seq 1 40); do
      if curl -sf http://localhost:8080/api/v1/health >/dev/null 2>&1; then
        echo "✓ API ready → http://localhost:8080"
        break
      fi
      sleep 0.4
    done
    if ! curl -sf http://localhost:8080/api/v1/health >/dev/null 2>&1; then
      echo "✗ API failed. Log: $API_LOG"
      tail -n 30 "$API_LOG" || true
      exit 1
    fi
  fi

  if is_up 3000; then
    echo "✓ Web already on :3000"
  else
    echo "→ Starting Web (Next.js) on :3000..."
    : >"$WEB_LOG"
    (
      cd "$WEB_DIR"
      exec npm run dev
    ) >>"$WEB_LOG" 2>&1 &
    echo $! >"$PID_DIR/web.pid"
    for _ in $(seq 1 50); do
      if curl -sf -o /dev/null http://localhost:3000/ >/dev/null 2>&1; then
        echo "✓ Web ready → http://localhost:3000/lo"
        break
      fi
      sleep 0.5
    done
    if ! curl -sf -o /dev/null http://localhost:3000/ >/dev/null 2>&1; then
      echo "✗ Web failed. Log: $WEB_LOG"
      tail -n 40 "$WEB_LOG" || true
      exit 1
    fi
  fi

  echo ""
  echo "BAN BUNSI is running — keep this terminal open."
  echo "  Frontend: http://localhost:3000/lo"
  echo "  Backend:  http://localhost:8080/api/v1/health"
  echo "  Logs:     $PID_DIR/*.log"
  echo ""
  echo "Stop: press Ctrl+C here   (or run: ./run.sh stop)"
  echo ""

  # Stay attached so Ctrl+C stops both
  while true; do
    if [[ -f "$PID_DIR/api.pid" ]] && ! kill -0 "$(cat "$PID_DIR/api.pid")" 2>/dev/null; then
      echo "API process exited. See $API_LOG"
      cleanup
    fi
    if [[ -f "$PID_DIR/web.pid" ]] && ! kill -0 "$(cat "$PID_DIR/web.pid")" 2>/dev/null; then
      echo "Web process exited. See $WEB_LOG"
      cleanup
    fi
    sleep 2
  done
}

ACTION="${1:-start}"
case "$ACTION" in
  start)  cmd_start ;;
  stop)   trap - EXIT; cmd_stop ;;
  status) cmd_status ;;
  -h|--help|help) usage ;;
  *)
    echo "Unknown command: $ACTION"
    usage
    exit 1
    ;;
esac
