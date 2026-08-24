import re

with open('mobile_app/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"import \* as Location from 'expo-location';[\r\n]*", "", content)
content = re.sub(r"import \{ scheduleDailyReminders \} from '\./utils/NotificationManager';[\r\n]*", "", content)

# I should also double check the `useEffect` we injected inside HomeScreen in App.js
# The user's error trace shows the imports, meaning the `useEffect` might also still be there if my regex failed.
content = re.sub(r"\s*useEffect\(\(\) => \{\s*// Silently refresh daily reminders[\s\S]*?\}, \[settings\?\.dailyReminder\]\);", "", content)

with open('mobile_app/App.js', 'w', encoding='utf-8') as f:
    f.write(content)
