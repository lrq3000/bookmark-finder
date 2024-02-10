import re

file_path = "src/manifest.json"

with open(file_path, 'r') as file:
    lines = file.readlines()

for i, line in enumerate(lines):
    if line.strip().startswith('"version":'):
        print("i =", i)
        version_info = re.search(r'"version":\s*"(\d+)\.(\d+)\.(\d+)"', line)
        print("version_info =", version_info)
        if version_info:
            major, minor, subminor = map(int, version_info.groups())
            subminor += 1  # Increment the subminor version
            new_version = f'  "version": "{major}.{minor}.{subminor}",\n'
            lines[i] = new_version
            break

with open(file_path, 'w') as file:
    file.writelines(lines)
