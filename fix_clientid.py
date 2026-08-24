import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "webClientId: '167900378525-chrk02499qs8af1d54069rmtqnk4r0fr.apps.googleusercontent.com',",
    "webClientId: '167900378525-chrk02499qs8af1d54069rmtqnk4r0fr.apps.googleusercontent.com',\n    androidClientId: '167900378525-chrk02499qs8af1d54069rmtqnk4r0fr.apps.googleusercontent.com',\n    expoClientId: '167900378525-chrk02499qs8af1d54069rmtqnk4r0fr.apps.googleusercontent.com',"
)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
