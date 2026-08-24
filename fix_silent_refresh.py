import re

with open('mobile_app/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for Location and NotificationManager
imports = """import * as Location from 'expo-location';
import { scheduleDailyReminders } from './utils/NotificationManager';"""

content = content.replace(
    'import { LinearGradient } from "expo-linear-gradient";',
    'import { LinearGradient } from "expo-linear-gradient";\n' + imports
)

# Extract settings from Context
content = content.replace(
    'const { themeColors } = React.useContext(SettingsContext);',
    'const { settings, themeColors } = React.useContext(SettingsContext);'
)

# Add useEffect for silent refresh
refresh_effect = """  useEffect(() => {
    // Silently refresh daily reminders for the next 7 days if enabled
    if (settings && settings.dailyReminder) {
      (async () => {
        try {
          let location = await Location.getCurrentPositionAsync({});
          await scheduleDailyReminders(location.coords.latitude, location.coords.longitude);
        } catch (e) {
          console.log("Silent refresh of prayer times failed:", e);
        }
      })();
    }
  }, [settings?.dailyReminder]);"""

content = content.replace(
    'const [isKeyboardVisible, setKeyboardVisible] = useState(false);',
    'const [isKeyboardVisible, setKeyboardVisible] = useState(false);\n\n' + refresh_effect
)

with open('mobile_app/App.js', 'w', encoding='utf-8') as f:
    f.write(content)
