#!/bin/sh
set -eu

# Existing VPS service units may still have systemd's default 0022 umask.
# Keep runtime-created cache directories writable by the shared deployment group.
umask 0002
runtime_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$runtime_dir/node-bin" "$@"
