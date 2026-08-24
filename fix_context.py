import re

with open('mobile_app/utils/SettingsContext.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'theme: "system", // default to system',
    r'theme: "system",\n    dailyReminder: false,\n    jumuahReminder: false,\n    googleConnected: false,',
    content
)

with open('mobile_app/utils/SettingsContext.js', 'w', encoding='utf-8') as f:
    f.write(content)
