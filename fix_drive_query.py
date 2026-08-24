import re

with open('mobile_app/utils/GoogleDriveSync.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "name = 'quranrag_backup.json' and 'appDataFolder' in parents",
    "name = 'quranrag_backup.json' and 'appDataFolder' in parents and trashed = false"
)

with open('mobile_app/utils/GoogleDriveSync.js', 'w', encoding='utf-8') as f:
    f.write(content)
