#!/usr/bin/env bash
set -euo pipefail

app_dir=/opt/banbunsi
staging=${1:?Usage: activate-release.sh STAGING_DIRECTORY COMMIT_SHA}
revision=${2:?Commit SHA is required}
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit SHA'; exit 1; }
[[ "$staging" == "$app_dir/incoming/"* && -d "$staging" && ! -L "$staging" ]] || exit 1
exec 9>"$app_dir/deploy.lock"
flock -w 300 9

release="$app_dir/releases/$(date -u +%Y%m%dT%H%M%S)-${revision:0:12}-$$"
test -x "$staging/api/server"
test -x "$staging/runtime/node"
test -f "$staging/web/server.js"
test "$(cat "$staging/REVISION")" = "$revision"
"$staging/runtime/node" --version
rm -f "$staging/release.tar.gz"
mv "$staging" "$release"
chmod -R a+rX "$release"
mkdir -p "$release/web/.next/cache"
chgrp -R banbunsi "$release/web/.next/cache"
chmod -R g+rwX "$release/web/.next/cache"
previous=$(readlink -f "$app_dir/current" || true)

switch_to() {
  ln -s "$1" "$app_dir/current.new"
  mv -Tf "$app_dir/current.new" "$app_dir/current"
}

rollback() {
  echo 'Deployment failed; restoring the previous application release.' >&2
  if [[ -n "$previous" && -d "$previous" ]]; then
    switch_to "$previous"
    sudo -n /usr/bin/systemctl restart banbunsi-api.service banbunsi-web.service || true
  fi
}

trap rollback ERR
switch_to "$release"
sudo -n /usr/bin/systemctl restart banbunsi-api.service banbunsi-web.service

healthy=false
for attempt in {1..45}; do
  if curl --fail --silent --max-time 5 http://127.0.0.1:18080/api/v1/health >/dev/null &&
     curl --fail --silent --max-time 10 http://127.0.0.1:13000/lo >/dev/null &&
     curl --fail --silent --max-time 10 http://127.0.0.1:13000/en >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done
[[ "$healthy" == true ]]
trap - ERR

if [[ -n "$previous" && -d "$previous" ]]; then
  ln -sfn "$previous" "$app_dir/previous"
fi
printf '%s\n' "$revision" > "$app_dir/deployed-revision"

# Keep the newest five builds, always preserving current and previous targets.
while IFS= read -r old; do
  [[ "$old" == "$release" || "$old" == "$previous" ]] && continue
  rm -rf -- "$old"
done < <(find "$app_dir/releases" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n +6)
echo "Deployed $revision successfully."
