#!/usr/bin/env bash
# Run once as root on the VPS, using only a PUBLIC deployment key.
set -euo pipefail
[[ "$(id -u)" == 0 ]] || { echo 'Run this script as root'; exit 1; }
public_key=${1:?Usage: bootstrap-vps.sh PUBLIC_KEY_FILE [PUBLIC_URL]}
public_url=${2:-http://129.121.128.135}
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
test -f "$public_key"
ssh-keygen -l -f "$public_key" >/dev/null
for executable in psql nginx python3 systemctl sudo curl flock; do
  command -v "$executable" >/dev/null || { echo "Install $executable first"; exit 1; }
done

if [[ -d /www/server/panel/vhost/nginx ]]; then
  nginx_dir=/www/server/panel/vhost/nginx
elif [[ -d /etc/nginx/sites-enabled ]]; then
  nginx_dir=/etc/nginx/sites-enabled
else
  echo 'Set up the Nginx virtual host directory first' >&2
  exit 1
fi

id banbunsi >/dev/null 2>&1 || useradd --system --home-dir /opt/banbunsi --shell /usr/sbin/nologin banbunsi
id banbunsi-deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash banbunsi-deploy
usermod -a -G banbunsi banbunsi-deploy
install -d -m 755 -o banbunsi-deploy -g banbunsi-deploy /opt/banbunsi /opt/banbunsi/releases /opt/banbunsi/incoming
install -d -m 700 -o banbunsi-deploy -g banbunsi-deploy /home/banbunsi-deploy/.ssh
authorized_keys=/home/banbunsi-deploy/.ssh/authorized_keys
touch "$authorized_keys"
key=$(cat "$public_key")
if ! grep -qF "$key" "$authorized_keys"; then
  printf 'restrict %s\n' "$key" >> "$authorized_keys"
fi
chown banbunsi-deploy:banbunsi-deploy "$authorized_keys"
chmod 600 "$authorized_keys"
install -d -m 750 -o root -g banbunsi /etc/banbunsi
install -d -m 750 -o banbunsi -g banbunsi /var/lib/banbunsi /var/lib/banbunsi/uploads

# Secrets are generated and retained on the VPS, never committed or logged.
python3 - "$public_url" "$script_dir/nginx.conf" "$nginx_dir/banbunsi.conf" <<'PY'
import os
import re
import secrets
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

public_url = sys.argv[1].rstrip("/")
url = urlparse(public_url)
if url.scheme != "http" or not re.fullmatch(r"[a-zA-Z0-9.-]+", url.netloc) or url.path:
    raise SystemExit("Bootstrap expects an HTTP origin without a port or path; configure TLS separately.")

def sql(statement):
    return subprocess.run(["sudo", "-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-At"],
                          input=statement, text=True, capture_output=True, check=True).stdout.strip()

env_path = Path("/etc/banbunsi/api.env")
if not env_path.exists():
    if sql("SELECT 1 FROM pg_roles WHERE rolname = 'banbunsi';"):
        raise SystemExit("Database role banbunsi already exists; provide /etc/banbunsi/api.env before continuing.")
    db_password = secrets.token_hex(32)
    owner_password = secrets.token_urlsafe(24)
    sql(f"CREATE ROLE banbunsi LOGIN PASSWORD '{db_password}';")
    sql("CREATE DATABASE banbunsi OWNER banbunsi;")
    os.umask(0o077)
    env_path.write_text(f'''DATABASE_URL=postgres://banbunsi:{db_password}@127.0.0.1:5432/banbunsi?sslmode=disable
API_ADDR=127.0.0.1:18080
APP_ENV=production
APP_PUBLIC_URL={public_url}
API_PUBLIC_URL={public_url}
CORS_ORIGINS={public_url}
CSRF_TRUSTED_ORIGINS={public_url}
SESSION_COOKIE_NAME=bb_session
SESSION_COOKIE_SECURE=false
SESSION_TTL_HOURS=168
OWNER_EMAIL=banbunsi26@gmail.com
OWNER_PASSWORD={owner_password}
OWNER_NAME="BAN BUNSI Admin"
SMTP_HOST=
SMTP_FROM=noreply@banbunsi.local
''')
    Path("/etc/banbunsi/owner-login.txt").write_text(
        f"Email: banbunsi26@gmail.com\nInitial password: {owner_password}\n")

template = Path(sys.argv[2]).read_text()
target = Path(sys.argv[3])
if target.exists():
    Path(str(target) + ".previous").write_bytes(target.read_bytes())
target.write_text(template.replace("__SERVER_NAME__", url.netloc))
PY
chown root:banbunsi /etc/banbunsi/api.env
chmod 640 /etc/banbunsi/api.env

install -m 644 "$script_dir/banbunsi-api.service" /etc/systemd/system/banbunsi-api.service
install -m 644 "$script_dir/banbunsi-web.service" /etc/systemd/system/banbunsi-web.service
printf '%s\n' 'banbunsi-deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart banbunsi-api.service banbunsi-web.service' > /etc/sudoers.d/banbunsi-deploy
chmod 440 /etc/sudoers.d/banbunsi-deploy
visudo -cf /etc/sudoers.d/banbunsi-deploy
systemctl daemon-reload
systemctl enable banbunsi-api.service banbunsi-web.service
nginx -t
systemctl reload nginx
echo 'VPS prepared. Deploy a release using GitHub Actions.'
echo 'Owner credentials are available to root at /etc/banbunsi/owner-login.txt.'
