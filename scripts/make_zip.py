import os
import sys
import subprocess
import zipfile
import shutil
import json
import datetime

# Ensure we are in project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.chdir(project_root)

print(f"Project root: {project_root}")
now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

# 1. Clean old dist and old zip to guarantee 100% fresh assets
print("Cleaning stale build assets...")
if os.path.exists('dist'):
    shutil.rmtree('dist', ignore_errors=True)

output_path = 'dusttown-rp-render.zip'
if os.path.exists(output_path):
    try:
        os.remove(output_path)
    except Exception as e:
        print(f"Notice: could not remove old zip: {e}")

# 2. Write build-version.json for easy verification
build_info = {
    "version": "1.2.6",
    "builtAt": now_iso,
    "environment": "production",
    "appName": "DustTown RP — Telegram Bot & Mini App",
    "features": [
        "WeeklyArtShowcase",
        "ArtGalleryView",
        "NotificationsCenter",
        "LotteryScratchModal",
        "MarketView",
        "CasesView",
        "CollabEvents",
        "BotControlPanel",
        "LittlepipReputationEngine",
        "LittlepipMemesVault",
        "FalloutEquestriaFandomDossier",
        "LittlepipControlPanel",
        "LittlepipTopicPermissions",
        "LittlepipTopicDiscovery"
    ]
}

with open('build-version.json', 'w', encoding='utf-8') as f:
    json.dump(build_info, f, indent=2, ensure_ascii=False)

# 3. Compile fresh production build into dist/
print("Building fresh production client assets with 'npm run build'...")
try:
    build_res = subprocess.run(["npm", "run", "build"], check=True, capture_output=True, text=True)
    print("Vite build output summary:")
    for line in build_res.stdout.strip().split('\n')[-5:]:
        print("  ", line)
    print("Build completed successfully.")
except subprocess.CalledProcessError as e:
    print(f"ERROR during npm run build:\n{e.stderr}")
    sys.exit(1)

# Also copy build-version.json into dist so frontend or curl can inspect it
if os.path.exists('dist'):
    shutil.copy('build-version.json', os.path.join('dist', 'build-version.json'))

# 4. Pack into dusttown-rp-render.zip
print("Archiving project files...")
exclude_dirs = {'node_modules', '.git', '.cache'}
exclude_files = {
    'dusttown-rp-render.zip',
    'dusttown-source.zip',
    'downloaded.zip',
    'test.zip',
    '.dusttown_data.json'
}

file_count = 0
with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.git')]
        for file in files:
            if file in exclude_files or file.endswith('.pyc') or file.endswith('.zip'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, '.')
            zipf.write(full_path, rel_path)
            file_count += 1

size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"Created {output_path} successfully ({size_mb:.2f} MB, {file_count} files).")
print(f"Build timestamp: {now_iso}")
