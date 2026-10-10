#!/usr/bin/env python3
"""Format changed tracked Go/frontend files without touching unrelated source."""

import subprocess
import sys
from pathlib import Path


def git(*args):
    return subprocess.check_output(["git", *args])


base = sys.argv[1] if len(sys.argv) > 1 else ""
head = sys.argv[2] if len(sys.argv) > 2 else "HEAD"
if not base or set(base) == {"0"}:
    try:
        base = git("rev-parse", f"{head}^").decode().strip()
    except subprocess.CalledProcessError:
        base = subprocess.check_output(
            ["git", "hash-object", "-t", "tree", "--stdin"], input=b""
        ).decode().strip()

changed = git("diff", "--name-only", "--diff-filter=ACMR", "-z", base, head)
paths = [path.decode() for path in changed.split(b"\0") if path]
go_files = [path for path in paths if path.startswith("apps/api/") and path.endswith(".go")]
web_files = [
    path for path in paths
    if path.startswith("apps/web/")
    and Path(path).suffix in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"}
    and not path.endswith(("package-lock.json", "next-env.d.ts"))
]

if go_files:
    subprocess.run(["gofmt", "-w", *go_files], check=True)
if web_files:
    subprocess.run(["apps/web/node_modules/.bin/prettier", "--write", *web_files], check=True)
if not go_files and not web_files:
    print("No changed Go or frontend files to format.")
