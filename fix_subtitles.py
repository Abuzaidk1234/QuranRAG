import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'Remind me to read after Fajr',
    'Remind me to read after every prayer'
)

content = content.replace(
    'Remind me to read Surah Al-Kahf on Fridays',
    'Remind me to read Surah Al-Kahf at 9 AM'
)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
