import os
import sys
import json
import hashlib
import zipfile
import datetime
import warnings

# Suppress warnings so stdout only contains pure JSON
warnings.filterwarnings('ignore')

# Root directory of the project
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHECKPOINT_FILE = os.path.join(PROJECT_ROOT, '.sync_checkpoint.json')
OUTPUT_PATCH_ZIP = os.path.join(PROJECT_ROOT, 'dusttown-update-patch.zip')

EXCLUDE_DIRS = {'node_modules', '.git', '.cache', 'dist', '__pycache__', '.temp'}
EXCLUDE_FILES = {
    'dusttown-rp-render.zip',
    'dusttown-update-patch.zip',
    '.dusttown_data.json',
    '.sync_checkpoint.json',
    '.littlepip_state.json',
    'downloaded.zip',
    'test.zip'
}

def get_file_md5(filepath):
    try:
        h = hashlib.md5()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None

def scan_project_files():
    tracked = {}
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        for f in files:
            if f in EXCLUDE_FILES or f.endswith('.zip') or f.endswith('.pyc') or f.endswith('.tmp'):
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, PROJECT_ROOT).replace('\\', '/')
            md5_val = get_file_md5(full_path)
            if md5_val:
                tracked[rel_path] = {
                    'md5': md5_val,
                    'mtime': os.path.getmtime(full_path),
                    'size': os.path.getsize(full_path)
                }
    return tracked

def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            sys.stderr.write(f"Warning: could not read checkpoint: {e}\n")
    return None

def save_checkpoint(files_data):
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    now_ts = datetime.datetime.now(datetime.timezone.utc).timestamp()
    checkpoint = {
        'lastCheckpointIso': now_iso,
        'lastCheckpointTimestamp': now_ts,
        'files': {rel_path: info['md5'] for rel_path, info in files_data.items()}
    }
    with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
        json.dump(checkpoint, f, indent=2, ensure_ascii=False)
    return checkpoint

def get_diff():
    current_files = scan_project_files()
    checkpoint = load_checkpoint()

    # If checkpoint doesn't exist yet, default to files modified within the last 12 hours
    if not checkpoint:
        # Check files modified in the current work session
        twelve_hours_ago = datetime.datetime.now(datetime.timezone.utc).timestamp() - (12 * 3600)
        recent_files = [
            rel for rel, info in current_files.items()
            if info['mtime'] > twelve_hours_ago
        ]
        return {
            'hasUpdates': len(recent_files) > 0,
            'changedFiles': sorted(recent_files),
            'addedFiles': [],
            'deletedFiles': [],
            'totalChanged': len(recent_files),
            'lastCheckpointIso': None,
            'isInitial': True
        }

    checkpoint_files = checkpoint.get('files', {})
    changed = []
    added = []
    deleted = []

    for rel_path, info in current_files.items():
        if rel_path not in checkpoint_files:
            added.append(rel_path)
        elif checkpoint_files[rel_path] != info['md5']:
            changed.append(rel_path)

    for rel_path in checkpoint_files:
        if rel_path not in current_files:
            deleted.append(rel_path)

    all_modified = sorted(changed + added)
    return {
        'hasUpdates': len(all_modified) > 0 or len(deleted) > 0,
        'changedFiles': all_modified,
        'addedFiles': added,
        'deletedFiles': deleted,
        'totalChanged': len(all_modified),
        'lastCheckpointIso': checkpoint.get('lastCheckpointIso'),
        'isInitial': False
    }

def make_patch_zip(include_base64=True):
    diff = get_diff()
    files_to_pack = diff['changedFiles']

    # If no files in diff, fallback to most recently modified 15 files
    if not files_to_pack:
        current_files = scan_project_files()
        sorted_by_mtime = sorted(current_files.items(), key=lambda x: x[1]['mtime'], reverse=True)
        files_to_pack = [x[0] for x in sorted_by_mtime[:15]]

    files_to_pack = [f for f in files_to_pack if f not in ('PATCH_README.md', 'patch_manifest.json')]

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    clean_date = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename = f"dusttown-patch-{clean_date}.zip"

    # Remove old patch if exists
    if os.path.exists(OUTPUT_PATCH_ZIP):
        try:
            os.remove(OUTPUT_PATCH_ZIP)
        except Exception:
            pass

    # Create ZIP
    with zipfile.ZipFile(OUTPUT_PATCH_ZIP, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add changed source files
        for rel_path in files_to_pack:
            full_path = os.path.join(PROJECT_ROOT, rel_path)
            if os.path.exists(full_path):
                zipf.write(full_path, rel_path)

        # Add PATCH_README.md
        readme_content = f"""# 📦 DustTown RP — Обновления (GitHub Patch)
Создано: {now_iso}
Количество обновлённых файлов: {len(files_to_pack)}

### 📋 Список изменённых файлов в этом патче:
""" + "\n".join(f"- `{f}`" for f in files_to_pack) + f"""

---

### 🚀 Как применить обновления к репозиторию GitHub:
1. Распакуйте содержимое этого архива прямо в корень вашего локального репозитория `DustTown-RP` (файлы заменят устаревшие версии).
2. Выполните в терминале git:
   ```bash
   git add .
   git commit -m "Update from AI Studio: {clean_date}"
   git push origin main
   ```
3. Вернитесь в панель управления бота и поставьте галочку **«Подтвердить синхронизацию»** — кнопка сбросится и будет ждать новых обновлений!
"""
        zipf.writestr('PATCH_README.md', readme_content)

        manifest = {
            'patchCreatedAt': now_iso,
            'filesCount': len(files_to_pack),
            'files': files_to_pack,
            'deletedFiles': diff.get('deletedFiles', [])
        }
        zipf.writestr('patch_manifest.json', json.dumps(manifest, indent=2, ensure_ascii=False))

    size_bytes = os.path.getsize(OUTPUT_PATCH_ZIP) if os.path.exists(OUTPUT_PATCH_ZIP) else 0
    b64_str = ''
    if include_base64 and os.path.exists(OUTPUT_PATCH_ZIP):
        import base64
        with open(OUTPUT_PATCH_ZIP, 'rb') as f:
            b64_str = base64.b64encode(f.read()).decode('utf-8')

    return {
        'success': True,
        'filename': filename,
        'changedFiles': files_to_pack,
        'filesCount': len(files_to_pack),
        'sizeBytes': size_bytes,
        'base64': b64_str,
        'createdAt': now_iso
    }

def main():
    if len(sys.argv) < 2:
        cmd = 'status'
    else:
        cmd = sys.argv[1].lower()

    if cmd == 'status':
        diff = get_diff()
        print(json.dumps(diff, ensure_ascii=False))
    elif cmd == 'make-patch':
        want_b64 = '--base64' in sys.argv or '--no-base64' not in sys.argv
        if '--no-base64' in sys.argv:
            want_b64 = False
        res = make_patch_zip(include_base64=want_b64)
        print(json.dumps(res, ensure_ascii=False))
    elif cmd in ('confirm', 'mark-synced'):
        current_files = scan_project_files()
        cp = save_checkpoint(current_files)
        print(json.dumps({
            'success': True,
            'message': 'Синхронизация подтверждена. Контрольная точка обновлена.',
            'lastCheckpointIso': cp['lastCheckpointIso'],
            'trackedCount': len(cp['files'])
        }, ensure_ascii=False))
    elif cmd == 'reset':
        if os.path.exists(CHECKPOINT_FILE):
            os.remove(CHECKPOINT_FILE)
        print(json.dumps({'success': True, 'message': 'Контрольная точка сброшена'}, ensure_ascii=False))
    else:
        print(json.dumps({'error': f'Unknown command {cmd}'}))

if __name__ == '__main__':
    main()
