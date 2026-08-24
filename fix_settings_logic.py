import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports at the top
imports = """import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';
import { 
  requestNotificationPermission, 
  requestLocationPermission, 
  scheduleJumuahReminder, 
  cancelJumuahReminder, 
  scheduleDailyReminders, 
  cancelDailyReminders 
} from '../utils/NotificationManager';"""

content = content.replace('import { SafeAreaView } from "react-native-safe-area-context";', imports)

# Add handler functions inside SettingsScreen
handlers = """
  const handleDailyReminderToggle = async (val) => {
    if (val) {
      const hasPerm = await requestNotificationPermission();
      if (!hasPerm) {
        alert("Notification permissions are required.");
        return;
      }
      const hasLoc = await requestLocationPermission();
      if (!hasLoc) {
        alert("Location permissions are required to calculate prayer times.");
        return;
      }
      
      try {
        let location = await Location.getCurrentPositionAsync({});
        await scheduleDailyReminders(location.coords.latitude, location.coords.longitude);
        updateSetting("dailyReminder", true);
        alert("Daily reminders scheduled for the next 7 days!");
      } catch (e) {
        alert("Could not get location. Please try again.");
      }
    } else {
      await cancelDailyReminders();
      updateSetting("dailyReminder", false);
    }
  };

  const handleJumuahReminderToggle = async (val) => {
    if (val) {
      const hasPerm = await requestNotificationPermission();
      if (!hasPerm) {
        alert("Notification permissions are required.");
        return;
      }
      await scheduleJumuahReminder();
      updateSetting("jumuahReminder", true);
      alert("Jumu'ah reminder scheduled!");
    } else {
      await cancelJumuahReminder();
      updateSetting("jumuahReminder", false);
    }
  };

  const changeLanguage"""

content = content.replace('  const changeLanguage', handlers)

# Update the Switch components
content = content.replace(
    'onValueChange={(val) => updateSetting("dailyReminder", val)}',
    'onValueChange={handleDailyReminderToggle}'
)
content = content.replace(
    'onValueChange={(val) => updateSetting("jumuahReminder", val)}',
    'onValueChange={handleJumuahReminderToggle}'
)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
