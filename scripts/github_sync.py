#!/usr/bin/env python3
import os
import sys
import json
import shutil
import subprocess
import urllib.request

REPO = "igormarkin1235-cloud/dusttown-rp-render"
BRANCH = "main"
CLONE_URL = f"https://github.com/{REPO}.git"
TEMP_DIR = "/tmp/dusttown-sync"
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PROTECTED_FILES = {
    ".dusttown_data.json",
    ".littlepip_state.json",
    ".sync_checkpoint.json",
    "src/components/BotControlPanel.tsx",
    "scripts/patch_manager.py"
}

def get_latest_commit():
    try:
        url = f"https://api.github.com/repos/{REPO}/commits/{BRANCH}"
        req = urllib.request.Request(url, headers={"User-Agent": "DustTownRP-Sync"})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return {
                "sha": data.get("sha", ""),
                "shortSha": data.get("sha", "")[:7],
                "message": data.get("commit", {}).get("message", ""),
                "author": data.get("commit", {}).get("author", {}).get("name", ""),
                "date": data.get("commit", {}).get("author", {}).get("date", "")
            }
    except Exception as e:
        return {"error": str(e)}

def pull_and_sync():
    commit_info = get_latest_commit()
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR, ignore_errors=True)

    res = subprocess.run(
        ["git", "clone", "--depth", "1", "-b", BRANCH, CLONE_URL, TEMP_DIR],
        capture_output=True,
        text=True,
        timeout=40
    )
    if res.returncode != 0:
        return {"success": False, "error": f"Git clone failed: {res.stderr}"}

    copied_files = []
    skipped_files = []

    for root, dirs, files in os.walk(TEMP_DIR):
        if ".git" in root or "node_modules" in root or "dist" in root:
            continue
        for f in files:
            src_path = os.path.join(root, f)
            rel_path = os.path.relpath(src_path, TEMP_DIR)

            if rel_path in PROTECTED_FILES:
                skipped_files.append(rel_path)
                continue

            dest_path = os.path.join(WORKSPACE_DIR, rel_path)
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)

            is_different = True
            if os.path.exists(dest_path):
                try:
                    with open(src_path, "rb") as s, open(dest_path, "rb") as d:
                        if s.read() == d.read():
                            is_different = False
                except Exception:
                    pass

            if is_different:
                shutil.copy2(src_path, dest_path)
                copied_files.append(rel_path)

    return {
        "success": True,
        "commit": commit_info,
        "updatedCount": len(copied_files),
        "updatedFiles": copied_files[:50]
    }

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    if action == "pull":
        result = pull_and_sync()
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        info = get_latest_commit()
        print(json.dumps(info, ensure_ascii=False, indent=2))
