import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"<Text style=\{\{ color: settings\.googleConnected \? THEME\.gold : THEME\.textMuted, fontSize: 14 \}\}>\s*\{settings\.googleConnected \? \"Connected\" : \"Not Connected\"\}\s*</Text>"
replacement = """<Text 
                numberOfLines={1} 
                style={{ color: settings.googleConnected ? THEME.gold : THEME.textMuted, fontSize: 14, flexShrink: 0 }}
              >
                {settings.googleConnected ? "Connected" : "Not Connected"}
              </Text>"""

content = re.sub(pattern, replacement, content)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
