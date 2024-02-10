import re

with open('src/manifest.json', 'r') as file:
    content = file.read()
    version = re.search(r'"version":\s*"(\d+)\.(\d+)\.(\d+)"', content).groups()
    # new_version = (int(version[0]), int(version[1]), int(version[2]) + 1)
    new_version = (int(version[0]), int(version[1]), int(version[2]))
    new_version_str = f'{new_version[0]}.{new_version[1]}.{new_version[2]}'
    # content = re.sub(r'\$\{version\}', new_version_str, content)
    # content = re.sub(r'\"version\": \"\d+, \d+, \d+\"', f'\"version\": {new_version}', content)


# with open('src/manifest.json', 'w') as file:
#     file.write(content)

print(f"::set-output name=new_version::{new_version_str}")
