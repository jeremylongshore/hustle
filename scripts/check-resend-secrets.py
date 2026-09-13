#!/usr/bin/env python3
"""Reject credential-shaped Resend tokens in the Git index or a named revision.

No file, archive, binary, or documentation exclusions. Output contains locations
only; token values, prefixes, hashes, and matching source lines are never emitted.
"""

import argparse
import json
import re
import subprocess
import sys


TOKEN = re.compile(rb"\bre_" + rb"[A-Za-z0-9_-]{32,}\b")


def git(*args):
    return subprocess.check_output(["git", *args], stderr=subprocess.DEVNULL)


def scan(ref=None):
    if ref:
        tree = git("rev-parse", "--verify", ref + "^{tree}").strip().decode()
        entries = git("ls-tree", "-rz", tree).split(b"\0")
    else:
        entries = git("ls-files", "--stage", "-z").split(b"\0")
    findings = []
    blobs = []
    for entry in entries:
        if not entry:
            continue
        metadata, path = entry.split(b"\t", 1)
        mode, middle, last = metadata.split()
        if ref:
            if middle != b"blob":
                continue
            oid = last
        else:
            if last != b"0":
                raise ValueError("unmerged index")
            if mode == b"160000":
                continue
            oid = middle
        blobs.append((oid, path))
    # One bounded local Git process avoids spawning a process for each document.
    payload = b"\n".join(oid for oid, _ in blobs) + (b"\n" if blobs else b"")
    proc = subprocess.run(["git", "cat-file", "--batch"], input=payload,
                          stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                          check=True)
    offset = 0
    for expected, path in blobs:
        end = proc.stdout.index(b"\n", offset)
        oid, kind, size = proc.stdout[offset:end].split()
        if oid != expected or kind != b"blob":
            raise ValueError("invalid blob response")
        offset = end + 1
        data = proc.stdout[offset:offset + int(size)]
        offset += int(size) + 1
        for line, content in enumerate(data.split(b"\n"), 1):
            if TOKEN.search(content):
                safe_path = TOKEN.sub(b"[REDACTED]", path)
                findings.append({"path": safe_path.decode("utf-8", errors="replace"),
                                 "line": line, "rule": "resend-credential"})
    return {"ok": not findings, "scannedFiles": len(blobs), "findings": findings}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ref", help="Scan this immutable Git revision instead of the staged index")
    args = parser.parse_args()
    try:
        result = scan(args.ref)
    except (OSError, ValueError, subprocess.SubprocessError):
        print(json.dumps({"ok": False, "error": "git-scan-failed"}))
        return 2
    print(json.dumps(result))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
