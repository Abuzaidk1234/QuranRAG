import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the leftover handlers
content = re.sub(r"const handleDailyReminderToggle = async \(val\) => \{[\s\S]*?updateSetting\(\"jumuahReminder\", false\);\n\s*\};\n", "", content)

# Remove the broken leftover Notification UI
content = re.sub(r"<Ionicons name=\"chevron-forward\" size=\{20\} color=\{THEME\.textMuted\} />\n            </TouchableOpacity>\n          </View>\n        </View>[\s\S]*?</ScrollView>", r"<Ionicons name=\"chevron-forward\" size={20} color={THEME.textMuted} />\n            </TouchableOpacity>\n          </View>\n        </View>\n\n      </ScrollView>", content)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
