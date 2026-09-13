"""Hermetic regression coverage; synthetic credentials exist only at runtime."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCANNER = Path(__file__).with_name("check-resend-secrets.py").resolve()
FAKE = "re" + "_" + "Ab0" * 12


class SecretGateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.email", "fixture@example.invalid")
        self.git("config", "user.name", "Fixture")

    def tearDown(self):
        self.temp.cleanup()

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root,
                                       stderr=subprocess.DEVNULL)

    def write(self, path, content):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content if isinstance(content, bytes) else content.encode())
        self.git("add", "--", path)

    def scan(self, *args):
        p = subprocess.run([sys.executable, str(SCANNER), *args], cwd=self.root,
                           capture_output=True, text=True, check=False)
        self.assertNotIn(FAKE, p.stdout + p.stderr)
        return p.returncode, json.loads(p.stdout)

    def test_empty_repository(self):
        self.assertEqual(self.scan(), (0, {"ok": True, "scannedFiles": 0, "findings": []}))

    def test_documentation_leak_rejected_without_echo(self):
        self.write("000-docs/incident.md", "setup\nKEY=" + FAKE)
        code, result = self.scan()
        self.assertEqual(code, 1)
        self.assertEqual(result["findings"], [{"path": "000-docs/incident.md", "line": 2,
                                              "rule": "resend-credential"}])

    def test_archived_script_is_scanned(self):
        self.write("99-Archive/test.js", "new Resend('" + FAKE + "')")
        self.assertEqual(self.scan()[0], 1)

    def test_hidden_and_binary_files_are_scanned(self):
        self.write(".hidden", b"\0" + FAKE.encode())
        self.assertEqual(self.scan()[0], 1)

    def test_multiple_copies_are_all_reported(self):
        self.write("one.md", FAKE + "\n" + FAKE)
        self.write("two.md", FAKE)
        self.assertEqual(len(self.scan()[1]["findings"]), 3)

    def test_path_with_spaces(self):
        self.write("docs/a file.md", FAKE)
        self.assertEqual(self.scan()[1]["findings"][0]["path"], "docs/a file.md")

    def test_secret_in_filename_is_also_redacted(self):
        self.write("docs/" + FAKE + ".md", FAKE)
        self.assertEqual(self.scan()[1]["findings"][0]["path"], "docs/[REDACTED].md")

    def test_redaction_and_environment_reference_allowed(self):
        self.write("example.md", "RESEND_API_KEY=REDACTED_RESEND_KEY\nprocess.env.RESEND_API_KEY")
        self.assertEqual(self.scan()[0], 0)

    def test_unstaged_scrub_cannot_hide_index_leak(self):
        self.write("doc.md", FAKE)
        (self.root / "doc.md").write_text("REDACTED_RESEND_KEY")
        self.assertEqual(self.scan()[0], 1)

    def test_old_revision_fails_after_staged_scrub_passes(self):
        self.write("doc.md", FAKE)
        self.git("commit", "-qm", "fixture before repair")
        self.write("doc.md", "REDACTED_RESEND_KEY")
        self.assertEqual(self.scan()[0], 0)
        self.assertEqual(self.scan("--ref", "HEAD")[0], 1)

    def test_staged_deletion_removes_current_exposure(self):
        self.write("doc.md", FAKE)
        self.git("commit", "-qm", "fixture before repair")
        self.git("rm", "-q", "doc.md")
        self.assertEqual(self.scan()[0], 0)

    def test_invalid_revision_fails_closed(self):
        code, result = self.scan("--ref", "missing-revision")
        self.assertEqual(code, 2)
        self.assertEqual(result, {"ok": False, "error": "git-scan-failed"})

    def test_untracked_private_credentials_not_read(self):
        (self.root / ".env").write_text(FAKE)
        self.assertEqual(self.scan()[0], 0)


if __name__ == "__main__":
    unittest.main()
