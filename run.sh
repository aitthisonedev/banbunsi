#!/usr/bin/env bash
# Start / stop frontend + backend from this terminal.
#   ./run.sh          → start (Ctrl+C to stop)
#   ./run.sh stop     → stop
#   ./run.sh status   → status
exec "$(cd "$(dirname "$0")" && pwd)/scripts/dev.sh" "$@"
