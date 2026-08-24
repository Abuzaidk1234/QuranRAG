import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Change scope to drive.file so it's visible to the user
content = content.replace(
    "scopes: ['https://www.googleapis.com/auth/drive.appdata'],",
    "scopes: ['https://www.googleapis.com/auth/drive.file'],"
)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

with open('mobile_app/utils/GoogleDriveSync.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Change spaces from appDataFolder to drive
content = content.replace("spaces=appDataFolder", "spaces=drive")
content = content.replace("'appDataFolder' in parents", "'root' in parents")
content = content.replace("metadata.parents = ['appDataFolder'];", "metadata.parents = ['root'];")

with open('mobile_app/utils/GoogleDriveSync.js', 'w', encoding='utf-8') as f:
    f.write(content)
