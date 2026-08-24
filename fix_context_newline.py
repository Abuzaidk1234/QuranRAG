import re

with open('mobile_app/utils/SettingsContext.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace literal \n with an actual newline
content = content.replace(r'\n', '\n')

with open('mobile_app/utils/SettingsContext.js', 'w', encoding='utf-8') as f:
    f.write(content)
