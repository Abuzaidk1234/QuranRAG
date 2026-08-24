import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The regex: find {/* Notifications */} up to </ScrollView>
# We need to preserve </ScrollView>
content = re.sub(r"\s*\{\/\* Notifications \*\/\}.*?(</ScrollView>)", r"\n      \1", content, flags=re.DOTALL)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
