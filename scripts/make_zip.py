import os
import zipfile

output_path = 'dusttown-rp-render.zip'
exclude_dirs = {'node_modules', 'dist', '.git', '.cache'}
exclude_files = {'dusttown-rp-render.zip', '.dusttown_data.json'}

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        # Prune excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        for file in files:
            if file in exclude_files or file.endswith('.pyc'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, '.')
            zipf.write(full_path, rel_path)

print(f"Created {output_path} with size: {os.path.getsize(output_path)} bytes")
