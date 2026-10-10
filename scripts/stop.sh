#!/usr/bin/env bash
# Same as: ./run.sh stop
exec "$(cd "$(dirname "$0")/.." && pwd)/scripts/dev.sh" stop
