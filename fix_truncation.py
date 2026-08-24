import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"<View style=\{\{ flexDirection: 'row', alignItems: 'center' \}\}>\s*<Ionicons name=\"logo-google\"[^>]*>\s*<Text style=\{styles.optionText\}>\{t\(\"google_sign_in\"\)\}</Text>\s*</View>"
replacement = """<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                <Ionicons name="logo-google" size={24} color={settings.googleConnected ? THEME.gold : THEME.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.optionText, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit>{t("google_sign_in")}</Text>
              </View>"""

content = re.sub(pattern, replacement, content)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
