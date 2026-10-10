# VPS deployment

Production URL: **http://129.121.128.135/lo** (English: `/en`).

`.github/workflows/deploy.yml` runs on pushes to `main`, pull requests to `main`,
and manual dispatch. On `main`, it formats changed Go files with `gofmt` and
changed frontend files with the pinned Prettier version, then commits formatting
changes as `github-actions[bot]`. It tests/vets the API, lints/builds Next.js, and
deploys that exact resulting commit. Pull requests only run checks.

Only the formatting job has repository write permission. Its push uses
`GITHUB_TOKEN`, which [does not recursively trigger push workflows](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
Build/deploy continues in the same workflow using the formatting commit SHA. If
`main` advances before formatting begins, that outdated run skips deployment.
If branch protection disallows bot pushes, grant the appropriate GitHub App
permission or use a formatting pull request process instead.

## Server layout

- Nginx routes `/api/` to `127.0.0.1:18080` and the frontend to `127.0.0.1:13000`.
- PostgreSQL uses a separate `banbunsi` database and login on localhost.
- `banbunsi-api.service` and `banbunsi-web.service` run as the `banbunsi` system user.
- The Node 24 runtime is bundled with the build; other applications' Node versions are untouched.
- `/opt/banbunsi/releases/` contains builds. `current` points to the active build;
  `previous` points to the preceding successful build. The latest five builds are retained.
- `/etc/banbunsi/api.env` holds server-only configuration and generated credentials.
- Uploaded files use `/var/lib/banbunsi/uploads`, which persists across releases.
- Root can read initial owner credentials at `/etc/banbunsi/owner-login.txt`.

Production seeds only create the configured owner once. They do not create demo
member/VIP accounts or reset an existing owner's password on restart. The standard
category, document, and quiz seeds still run.

## First-time setup

The VPS needs Ubuntu x86-64, PostgreSQL, Nginx, Python 3, sudo, curl, and flock.
The bootstrap supports standard Ubuntu and this VPS's aaPanel Nginx directories.

1. Generate a dedicated SSH key on your own machine:

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/banbunsi_actions -C github-actions:banbunsi
   ```

2. Copy `deploy/` and the **public** key to a temporary directory on the VPS.
   Run as root:

   ```bash
   bash deploy/bootstrap-vps.sh /path/to/banbunsi_actions.pub
   ```

3. Set GitHub Actions repository secrets with `gh secret set`:

   | Secret | Value |
   | --- | --- |
   | `VPS_SSH_KEY` | Dedicated deployment private key |
   | `VPS_KNOWN_HOSTS` | Verified SSH host-key entries for the VPS |

   ```bash
   gh secret set VPS_SSH_KEY < ~/.ssh/banbunsi_actions
   # Use host keys verified against the VPS/provider, not an unverified scan.
   ssh-keygen -F 129.121.128.135 | sed '/^#/d' | gh secret set VPS_KNOWN_HOSTS
   ```

   Optional repository variables: `VPS_HOST` (default `129.121.128.135`),
   `VPS_PORT` (default `22`), `VPS_USER` (default `banbunsi-deploy`).

4. Push to `main`, or run `gh workflow run deploy.yml --ref main`.

The dedicated deployment account can restart only the two BAN BUNSI services via
sudo. Builds and secrets are never shared with pull request deployments.

## Operations

```bash
# Run on the VPS as root:
systemctl status banbunsi-api banbunsi-web
journalctl -u banbunsi-api -u banbunsi-web -n 100 --no-pager
cat /opt/banbunsi/deployed-revision
curl -f http://127.0.0.1:18080/api/v1/health
```

The deployment checks the API and both language homepages. If startup checks fail,
it restores the preceding application release and restarts the services. Database
migrations run automatically on API startup and are **not** rolled back. Take a
database backup before deploying schema changes.

For manual application rollback as root:

```bash
cd /opt/banbunsi
ln -s "$(readlink -f previous)" current.rollback
mv -Tf current.rollback current
systemctl restart banbunsi-api banbunsi-web
cat current/REVISION > deployed-revision
```

This IP deployment uses HTTP with `SESSION_COOKIE_SECURE=false` so sign-in works.
To add HTTPS, configure a domain/certificate in Nginx, update `APP_PUBLIC_URL`,
`API_PUBLIC_URL`, `CORS_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` in the API environment,
then set `SESSION_COOKIE_SECURE=true` and restart the API.

Email delivery needs a trusted SMTP relay configured with `SMTP_HOST`, `SMTP_PORT`,
and `SMTP_FROM`. Until configured, verification/reset links are written to API logs.
