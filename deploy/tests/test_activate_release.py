"""Exercise activation and cleanup in an isolated filesystem without a VPS."""

import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import textwrap
import unittest


DEPLOY = Path(__file__).resolve().parents[1]
REVISION = "a" * 40


class ActivateReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="banbunsi-activation-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.app = self.root / "app"
        self.releases = self.app / "releases"
        self.releases.mkdir(parents=True)
        self.staging = self.app / "incoming" / "test"
        for directory in ("api", "runtime", "web/.next/cache/build"):
            (self.staging / directory).mkdir(parents=True, exist_ok=True)
        for file in ("api/server", "runtime/node"):
            executable = self.staging / file
            executable.write_text("#!/bin/sh\necho test-runtime\n")
            executable.chmod(0o755)
        (self.staging / "web/server.js").write_text("// test server\n")
        (self.staging / "REVISION").write_text(REVISION + "\n")
        (self.staging / "release.tar.gz").touch()
        self.previous = self.releases / "19900101T000000-previous"
        self.previous.mkdir()
        (self.app / "current").symlink_to(self.previous)
        (self.app / "deployed-revision").write_text("old-revision\n")
        self.old = []
        for index in range(1, 7):
            release = self.releases / f"20000101T00000{index}-old"
            release.mkdir()
            (release / "old-artifact").touch()
            self.old.append(release)

        # Only redirect the fixed production root in this temporary script copy.
        source = (DEPLOY / "activate-release.sh").read_text()
        self.assertEqual(source.count("app_dir=/opt/banbunsi"), 1)
        self.script = self.root / "activate-release.sh"
        self.script.write_text(source.replace("app_dir=/opt/banbunsi", f"app_dir='{self.app}'"))
        self.commands = self.root / "commands"
        self.commands.mkdir()
        self.log = self.root / "commands.log"
        self.env = {
            **os.environ,
            "PATH": f"{self.commands}{os.pathsep}{os.environ['PATH']}",
            "TEST_ROOT": str(self.root),
            "TEST_LOG": str(self.log),
        }
        self.env.pop("BASH_ENV", None)
        self.env.pop("ENV", None)

        # Emulate systemd/network access and GNU-only utilities on macOS, while
        # real mkdir/chmod/find and filesystem moves exercise cache permissions.
        helper = self.commands / "test-command"
        helper.write_text(f"#!{sys.executable}\n" + textwrap.dedent("""\
            import os
            from pathlib import Path
            import shutil
            import subprocess
            import sys

            command = Path(sys.argv[0]).name
            args = sys.argv[1:]
            with open(os.environ['TEST_LOG'], 'a') as log:
                log.write(command + ' ' + ' '.join(args) + '\\n')
            if command == 'curl':
                sys.exit(22 if os.environ.get('TEST_UNHEALTHY') else 0)
            if command in ('sudo', 'flock', 'sleep'):
                sys.exit(0)
            if command == 'readlink':
                print(os.path.realpath(args[-1]))
            elif command == 'chgrp':
                args = [str(os.getgid()) if arg == 'banbunsi' else arg for arg in args]
                sys.exit(subprocess.run(['/usr/bin/chgrp', *args]).returncode)
            elif command == 'mv':
                source, target = args[-2:]
                if '-Tf' in args:
                    os.replace(source, target)
                else:
                    shutil.move(source, target)
            elif command == 'rm':
                for arg in args:
                    if arg.startswith('-'):
                        continue
                    path = Path(arg)
                    assert path.is_relative_to(Path(os.environ['TEST_ROOT'])), arg
                    if arg == os.environ.get('TEST_DENY_REMOVE'):
                        print('rm: Permission denied: ' + arg, file=sys.stderr)
                        sys.exit(1)
                    if path.is_symlink() or path.is_file():
                        path.unlink()
                    elif path.is_dir():
                        shutil.rmtree(path)
            else:
                raise RuntimeError(command)
            """))
        helper.chmod(0o755)
        for command in ("curl", "sudo", "flock", "sleep", "readlink", "chgrp", "mv", "rm"):
            (self.commands / command).symlink_to(helper)

    def activate(self, **env):
        return subprocess.run(
            ["bash", str(self.script), str(self.staging), REVISION],
            env={**self.env, **env}, text=True, capture_output=True, timeout=15,
        )

    def test_success_prunes_old_releases_but_keeps_current_and_previous(self):
        result = self.activate()
        self.assertEqual(result.returncode, 0, result.stderr)
        current = (self.app / "current").resolve()
        self.assertEqual((current / "REVISION").read_text().strip(), REVISION)
        self.assertEqual((self.app / "previous").resolve(), self.previous)
        self.assertTrue(self.previous.is_dir())
        self.assertFalse(self.old[0].exists())
        self.assertFalse(self.old[1].exists())
        self.assertTrue(all(path.is_dir() for path in self.old[2:]))

        # Existing build cache and future Next.js directories must remain
        # writable by the shared group with the service's actual umask.
        mask_line = next(line for line in (DEPLOY / "banbunsi-web.service").read_text().splitlines()
                         if line.startswith("UMask="))
        service_mask = int(mask_line.split("=", 1)[1], 8)
        cache = current / "web/.next/cache"
        for directory in (cache, cache / "build"):
            mode = directory.stat().st_mode
            self.assertTrue(mode & stat.S_IWGRP)
            self.assertTrue(mode & stat.S_ISGID)
        old_mask = os.umask(service_mask)
        try:
            image = cache / "images" / "runtime-image"
            image.mkdir(parents=True)
            (image / "image.webp").write_bytes(b"cached image")
        finally:
            os.umask(old_mask)
        self.assertTrue(image.stat().st_mode & stat.S_IWGRP)
        self.assertTrue((image / "image.webp").stat().st_mode & stat.S_IWGRP)

    def test_cache_permission_failure_warns_and_keeps_successful_activation(self):
        result = self.activate(TEST_DENY_REMOVE=str(self.old[1]))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Warning: could not remove old release", result.stderr)
        self.assertIn("Permission denied", result.stderr)
        self.assertIn(f"Deployed {REVISION} successfully.", result.stdout)
        self.assertNotEqual((self.app / "current").resolve(), self.previous)
        self.assertEqual((self.app / "previous").resolve(), self.previous)
        self.assertEqual((self.app / "deployed-revision").read_text().strip(), REVISION)
        self.assertTrue(self.old[1].is_dir())
        # Cleanup continues after the undeletable release.
        self.assertFalse(self.old[0].exists())
        self.assertNotIn("restoring the previous", result.stderr)

    def test_failed_health_checks_roll_back_without_pruning(self):
        result = self.activate(TEST_UNHEALTHY="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("restoring the previous", result.stderr)
        self.assertEqual((self.app / "current").resolve(), self.previous)
        self.assertEqual((self.app / "deployed-revision").read_text(), "old-revision\n")
        self.assertTrue(all(path.is_dir() for path in self.old))
        self.assertEqual(self.log.read_text().count("sudo -n /usr/bin/systemctl restart"), 2)


class NodeRuntimeTests(unittest.TestCase):
    def test_existing_service_umask_is_overridden_and_arguments_are_preserved(self):
        with tempfile.TemporaryDirectory(prefix="banbunsi-node-") as directory:
            runtime = Path(directory)
            launcher = runtime / "node"
            launcher.write_bytes((DEPLOY / "node-runtime.sh").read_bytes())
            launcher.chmod(0o755)
            binary = runtime / "node-bin"
            binary.write_text(
                f"#!{sys.executable}\n"
                "import json, os, sys\n"
                "print(json.dumps({'umask': os.umask(0), 'args': sys.argv[1:]}))\n"
                "sys.exit(17 if '--fail' in sys.argv else 0)\n"
            )
            binary.chmod(0o755)
            for arguments, expected_code in [
                (["--version", "argument with spaces"], 0),
                (["--fail"], 17),
            ]:
                with self.subTest(arguments=arguments):
                    result = subprocess.run(
                        ["bash", "-c", 'umask 0022; exec "$@"', "runtime-test",
                         str(launcher), *arguments],
                        text=True, capture_output=True, timeout=5,
                    )
                    self.assertEqual(result.returncode, expected_code, result.stderr)
                    output = json.loads(result.stdout)
                    self.assertEqual(output["umask"], 0o002)
                    self.assertEqual(output["args"], arguments)


if __name__ == "__main__":
    unittest.main()
