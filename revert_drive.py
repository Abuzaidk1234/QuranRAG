import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert to appDataFolder scope
content = content.replace(
    "scopes: ['https://www.googleapis.com/auth/drive.file'],",
    "scopes: ['https://www.googleapis.com/auth/drive.appdata'],"
)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

with open('mobile_app/utils/GoogleDriveSync.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert to appDataFolder spaces and parents
content = content.replace("spaces=drive", "spaces=appDataFolder")
content = content.replace("'root' in parents", "'appDataFolder' in parents")
content = content.replace("metadata.parents = ['root'];", "metadata.parents = ['appDataFolder'];")

with open('mobile_app/utils/GoogleDriveSync.js', 'w', encoding='utf-8') as f:
    f.write(content)
