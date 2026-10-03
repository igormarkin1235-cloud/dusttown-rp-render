#!/usr/bin/env python3
"""
DustTown Direct GitHub Migration Script
Syncs files from AI Studio workspace to git repo and pushes directly to GitHub.
"""

import sys
import os
import shutil
import subprocess
import json

WORKSPACE = '/app/applet'
REPO_DIR = '/tmp/dusttown-repo'
REPO_URL = 'https://github.com/igormarkin1235-cloud/dusttown-rp-render.git'

EXCLUDE_DIRS = {'node_modules', '.git', '.cache', 'dist', '__pycache__', '.temp'}
EXCLUDE_FILES = {
    'dusttown-rp-render.zip',
    'dusttown-update-patch.zip',
    '.dusttown_data.json',
    '.sync_checkpoint.json',
    '.littlepip_state.json',
    '.littlepip_memory.json',
    'downloaded.zip',
    'test.zip'
}

def sync_files():
    if not os.path.exists(REPO_DIR):
        subprocess.run(['git', 'clone', REPO_URL, REPO_DIR], check=True)

    copied = 0
    for root, dirs, files in os.walk(WORKSPACE):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        rel_dir = os.path.relpath(root, WORKSPACE)
        dest_dir = os.path.join(REPO_DIR, rel_dir) if rel_dir != '.' else REPO_DIR
        os.makedirs(dest_dir, exist_ok=True)
        for f in files:
            if f in EXCLUDE_FILES or f.endswith('.zip') or f.endswith('.pyc') or f.endswith('.tmp'):
                continue
            src_file = os.path.join(root, f)
            dest_file = os.path.join(dest_dir, f)
            shutil.copy2(src_file, dest_file)
            copied += 1
    return copied

def push_to_github(token, commit_msg=None):
    if not token or not token.strip():
        return {'success': False, 'error': 'GitHub Personal Access Token is required.'}

    token = token.strip()
    if not commit_msg:
        commit_msg = "feat: add Blackjack Telegram polling worker and connection fix"

    try:
        # Ensure we are aligned with remote main
        subprocess.run(['git', '-C', REPO_DIR, 'fetch', 'origin', 'main'], check=False)
        subprocess.run(['git', '-C', REPO_DIR, 'reset', '--hard', 'origin/main'], check=False)

        sync_files()

        # Configure git identity if not set
        subprocess.run(['git', '-C', REPO_DIR, 'config', 'user.name', 'DustTown Sync Agent'], check=True)
        subprocess.run(['git', '-C', REPO_DIR, 'config', 'user.email', 'dusttown@render.internal'], check=True)

        # Stage all changes
        subprocess.run(['git', '-C', REPO_DIR, 'add', '-A'], check=True)

        # Check if there are changes to commit
        status_proc = subprocess.run(
            ['git', '-C', REPO_DIR, 'status', '--porcelain'],
            capture_output=True,
            text=True,
            check=True
        )

        if not status_proc.stdout.strip():
            return {
                'success': True,
                'message': 'Репозиторий на GitHub уже содержит все последние файлы!',
                'alreadyUpToDate': True
            }

        # Commit
        subprocess.run(
            ['git', '-C', REPO_DIR, 'commit', '-m', commit_msg],
            check=True,
            capture_output=True
        )

        # Get commit hash
        hash_proc = subprocess.run(
            ['git', '-C', REPO_DIR, 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        commit_hash = hash_proc.stdout.strip()

        # Push using token
        push_url = f"https://x-access-token:{token}@github.com/igormarkin1235-cloud/dusttown-rp-render.git"

        push_proc = subprocess.run(
            ['git', '-C', REPO_DIR, 'push', push_url, 'main'],
            capture_output=True,
            text=True
        )

        if push_proc.returncode == 0:
            try:
                subprocess.run(['python3', '/app/applet/scripts/patch_manager.py', 'confirm'], cwd='/app/applet')
            except Exception:
                pass

            return {
                'success': True,
                'commitHash': commit_hash,
                'message': f'Успешно отправлено на GitHub (коммит {commit_hash})! Render начал автоматический деплой.'
            }
        else:
            err_msg = push_proc.stderr or push_proc.stdout or 'Ошибка при выполнении git push'
            err_msg = err_msg.replace(token, '***TOKEN***')
            return {
                'success': False,
                'error': err_msg
            }

    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Token argument missing'}))
        sys.exit(1)

    gh_token = sys.argv[1]
    msg = sys.argv[2] if len(sys.argv) > 2 else None
    result = push_to_github(gh_token, msg)
    print(json.dumps(result, ensure_ascii=False))
