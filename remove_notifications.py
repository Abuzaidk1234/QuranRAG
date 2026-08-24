import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove imports
content = re.sub(r"import \* as Location from 'expo-location';\n?", "", content)
content = re.sub(r"import \{\s*requestNotificationPermission[\s\S]*?\} from '\.\./utils/NotificationManager';\n?", "", content)

# 2. Remove handlers
content = re.sub(r"const handleDailyReminderToggle = async \(val\) => \{[\s\S]*?updateSetting\(\"jumuahReminder\", false\);\n\s*\};\n", "", content)

# 3. Remove Notifications UI Section
# It starts with {/* Notifications */} and ends with two </View>s before the </ScrollView>
content = re.sub(r"\s*\{\/\* Notifications \*\/\}.*?</View>\s*</View>", "", content, flags=re.DOTALL)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
