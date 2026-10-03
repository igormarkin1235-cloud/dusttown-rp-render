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

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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

def get_git_status():
    """Returns local git status and diff count."""
    target_dir = WORKSPACE if os.path.exists(os.path.join(WORKSPACE, '.git')) else REPO_DIR
    if not os.path.exists(os.path.join(target_dir, '.git')):
        return {
            'isGit': False,
            'changedFiles': [],
            'totalChanged': 0
        }

    try:
        proc = subprocess.run(
            ['git', '-C', target_dir, 'status', '--porcelain'],
            capture_output=True,
            text=True,
            check=True
        )
        lines = [line.strip() for line in proc.stdout.split('\n') if line.strip()]
        changed_files = [line.split(maxsplit=1)[-1] for line in lines]
        
        # Get current commit hash
        hash_proc = subprocess.run(
            ['git', '-C', target_dir, 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True
        )
        commit_hash = hash_proc.stdout.strip() if hash_proc.returncode == 0 else ''

        return {
            'isGit': True,
            'commitHash': commit_hash,
            'changedFiles': changed_files,
            'totalChanged': len(changed_files)
        }
    except Exception as e:
        return {'isGit': False, 'error': str(e), 'changedFiles': [], 'totalChanged': 0}

def sync_files_to_dir(dest_dir):
    copied = 0
    for root, dirs, files in os.walk(WORKSPACE):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        rel_dir = os.path.relpath(root, WORKSPACE)
        target_dir = os.path.join(dest_dir, rel_dir) if rel_dir != '.' else dest_dir
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            if f in EXCLUDE_FILES or f.endswith('.zip') or f.endswith('.pyc') or f.endswith('.tmp'):
                continue
            src_file = os.path.join(root, f)
            dst_file = os.path.join(target_dir, f)
            shutil.copy2(src_file, dst_file)
            copied += 1
    return copied

def push_to_github(token, commit_msg=None):
    if not token or not token.strip():
        return {'success': False, 'error': 'GitHub Personal Access Token is required.'}

    token = token.strip()
    if not commit_msg:
        commit_msg = "fix: repair Render build, Blackjack agent types, render.yaml and telegram polling"

    # Determine working git repository
    is_workspace_git = os.path.exists(os.path.join(WORKSPACE, '.git'))
    target_repo = WORKSPACE if is_workspace_git else REPO_DIR

    try:
        if not is_workspace_git:
            if not os.path.exists(REPO_DIR):
                subprocess.run(['git', 'clone', REPO_URL, REPO_DIR], check=True)
            subprocess.run(['git', '-C', REPO_DIR, 'fetch', 'origin', 'main'], check=False)
            subprocess.run(['git', '-C', REPO_DIR, 'reset', '--hard', 'origin/main'], check=False)
            sync_files_to_dir(REPO_DIR)

        # Configure git identity
        subprocess.run(['git', '-C', target_repo, 'config', 'user.name', 'DustTown Sync Agent'], check=True)
        subprocess.run(['git', '-C', target_repo, 'config', 'user.email', 'dusttown@render.internal'], check=True)

        # Stage all changes
        subprocess.run(['git', '-C', target_repo, 'add', '-A'], check=True)

        # Check if there are changes to commit
        status_proc = subprocess.run(
            ['git', '-C', target_repo, 'status', '--porcelain'],
            capture_output=True,
            text=True,
            check=True
        )

        has_changes = bool(status_proc.stdout.strip())

        if has_changes:
            # Commit
            subprocess.run(
                ['git', '-C', target_repo, 'commit', '-m', commit_msg],
                check=True,
                capture_output=True
            )

        # Get commit hash
        hash_proc = subprocess.run(
            ['git', '-C', target_repo, 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        commit_hash = hash_proc.stdout.strip()

        # Push using authenticated token URL
        push_url = f"https://x-access-token:{token}@github.com/igormarkin1235-cloud/dusttown-rp-render.git"

        push_proc = subprocess.run(
            ['git', '-C', target_repo, 'push', push_url, 'main'],
            capture_output=True,
            text=True
        )

        if push_proc.returncode == 0:
            try:
                subprocess.run(['python3', os.path.join(WORKSPACE, 'scripts', 'patch_manager.py'), 'confirm'], cwd=WORKSPACE)
            except Exception:
                pass

            return {
                'success': True,
                'commitHash': commit_hash,
                'message': f'Успешно отправлено на GitHub (коммит {commit_hash})! Render начал автоматический деплой.',
                'repoUrl': 'https://github.com/igormarkin1235-cloud/dusttown-rp-render',
                'renderUrl': 'https://dashboard.render.com/'
            }
        else:
            err_msg = push_proc.stderr or push_proc.stdout or 'Ошибка при выполнении git push'
            err_msg = err_msg.replace(token, '***TOKEN***')
            return {
                'success': False,
                'error': err_msg
            }

    except Exception as e:
        err_str = str(e).replace(token, '***TOKEN***')
        return {'success': False, 'error': err_str}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Token argument missing'}))
        sys.exit(1)

    arg = sys.argv[1]
    if arg == 'status':
        print(json.dumps(get_git_status(), ensure_ascii=False))
        sys.exit(0)

    gh_token = arg
    msg = sys.argv[2] if len(sys.argv) > 2 else None
    result = push_to_github(gh_token, msg)
    print(json.dumps(result, ensure_ascii=False))
