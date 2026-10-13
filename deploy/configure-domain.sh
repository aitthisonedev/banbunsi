#!/usr/bin/env bash
# Run as root after bootstrap-vps.sh. --prepare configures HTTP before DNS is ready.
set -euo pipefail
[[ "$(id -u)" == 0 ]] || { echo 'Run as root'; exit 1; }
domain=${1:-banbunsi.aitthisone.com}
expected_ip=${2:-129.121.128.135}
mode=${3:-activate}
[[ "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ ]] || exit 1
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
for executable in python3 nginx certbot curl; do command -v "$executable" >/dev/null; done
test -f /etc/banbunsi/api.env

if [[ -d /www/server/panel/vhost/nginx ]]; then
  nginx_dir=/www/server/panel/vhost/nginx
else
  nginx_dir=/etc/nginx/sites-enabled
fi
domain_conf="$nginx_dir/banbunsi-domain.conf"
ip_conf="$nginx_dir/banbunsi.conf"
install -d -m 755 /var/www/banbunsi-acme/.well-known/acme-challenge

if [[ ! -f "$domain_conf" ]]; then
  python3 - "$script_dir/nginx.conf" "$domain_conf" "$domain" <<'PY'
import sys
from pathlib import Path
template = Path(sys.argv[1]).read_text().replace("__SERVER_NAME__", sys.argv[3])
challenge = '''    location ^~ /.well-known/acme-challenge/ {
        root /var/www/banbunsi-acme;
        default_type text/plain;
        try_files $uri =404;
    }
'''
Path(sys.argv[2]).write_text(template.replace("    location /uploads/", challenge + "\n    location /uploads/", 1))
PY
  if ! nginx -t; then
    rm -f "$domain_conf"
    exit 1
  fi
  systemctl reload nginx
fi
if [[ "$mode" == --prepare ]]; then
  echo "HTTP routing and ACME webroot ready for $domain."
  exit 0
fi

python3 - "$domain" "$expected_ip" <<'PY'
import socket
import sys
try:
    addresses = {info[4][0] for info in socket.getaddrinfo(sys.argv[1], 80, socket.AF_INET)}
except socket.gaierror:
    raise SystemExit("DNS is not ready; add the A record and rerun this script.")
if addresses != {sys.argv[2]}:
    raise SystemExit(f"DNS must point only to {sys.argv[2]}; currently: {sorted(addresses)}")
PY

certbot certonly --webroot -w /var/www/banbunsi-acme \
  --cert-name "$domain" -d "$domain" --non-interactive --agree-tos \
  --email banbunsi26@gmail.com --keep-until-expiring

backup_dir=$(mktemp -d /root/banbunsi-domain-backup.XXXXXX)
cp -p "$domain_conf" "$backup_dir/domain.conf"
cp -p "$ip_conf" "$backup_dir/ip.conf"
cp -p /etc/banbunsi/api.env "$backup_dir/api.env"
rollback() {
  cp -p "$backup_dir/domain.conf" "$domain_conf"
  cp -p "$backup_dir/ip.conf" "$ip_conf"
  cp -p "$backup_dir/api.env" /etc/banbunsi/api.env
  nginx -t && systemctl reload nginx
  systemctl restart banbunsi-api.service
  echo "Domain activation failed; restored configuration from $backup_dir" >&2
}
trap rollback ERR

python3 - "$script_dir/nginx-domain.conf" "$domain_conf" "$ip_conf" "$domain" "$expected_ip" <<'PY'
import sys
from pathlib import Path
domain = sys.argv[4]
Path(sys.argv[2]).write_text(Path(sys.argv[1]).read_text().replace("__SERVER_NAME__", domain))
Path(sys.argv[3]).write_text(f'''server {{
    listen 80;
    server_name {sys.argv[5]};
    return 308 https://{domain}$request_uri;
}}
''')
env_path = Path("/etc/banbunsi/api.env")
updates = {key: f"https://{domain}" for key in (
    "APP_PUBLIC_URL", "API_PUBLIC_URL", "CORS_ORIGINS", "CSRF_TRUSTED_ORIGINS")}
updates["SESSION_COOKIE_SECURE"] = "true"
lines = env_path.read_text().splitlines()
result = []
for line in lines:
    key = line.partition("=")[0]
    result.append(f"{key}={updates.pop(key)}" if key in updates else line)
result.extend(f"{key}={value}" for key, value in updates.items())
env_path.write_text("\n".join(result) + "\n")
PY
nginx -t
systemctl reload nginx
systemctl restart banbunsi-api.service
for attempt in {1..30}; do
  if curl --fail --silent --max-time 5 "https://$domain/api/v1/health" --resolve "$domain:443:127.0.0.1" >/dev/null; then
    break
  fi
  sleep 1
done
curl --fail --silent --show-error --max-time 10 "https://$domain/api/v1/health" --resolve "$domain:443:127.0.0.1" >/dev/null
curl --fail --silent --show-error --max-time 10 "https://$domain/lo" --resolve "$domain:443:127.0.0.1" >/dev/null
trap - ERR

printf '%s\n' "$domain" > /etc/banbunsi/domain
install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/banbunsi-nginx <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
[[ "${RENEWED_LINEAGE:-}" == "/etc/letsencrypt/live/$(cat /etc/banbunsi/domain)" ]] || exit 0
nginx -t
systemctl reload nginx
HOOK
chmod 750 /etc/letsencrypt/renewal-hooks/deploy/banbunsi-nginx
systemctl enable --now certbot.timer
echo "Domain activated: https://$domain (Secure cookies enabled)."
