import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports at top
imports = """import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { syncToDrive, syncFromDrive } from '../utils/GoogleDriveSync';

WebBrowser.maybeCompleteAuthSession();"""

content = content.replace('import { SafeAreaView } from "react-native-safe-area-context";', imports)

# 2. Add Auth hook inside component
auth_hook = """  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '167900378525-chrk02499qs8af1d54069rmtqnk4r0fr.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      updateSetting('googleConnected', true);
      updateSetting('googleAccessToken', authentication.accessToken);
      
      Alert.alert(
        "Connected!", 
        "Your account is linked. Would you like to restore data from your Drive, or backup your current device to Drive?",
        [
          { 
            text: "Restore from Drive", 
            onPress: () => handleSync(authentication.accessToken, 'restore') 
          },
          { 
            text: "Backup to Drive", 
            onPress: () => handleSync(authentication.accessToken, 'backup') 
          }
        ]
      );
    }
  }, [response]);

  const handleSync = async (tokenOverride = null, mode = 'backup') => {
    const token = tokenOverride || settings.googleAccessToken;
    if (!token) return;
    
    try {
      if (mode === 'backup') {
        await syncToDrive(token);
        Alert.alert("Success", "Data successfully backed up to Google Drive!");
      } else {
        const hasBackup = await syncFromDrive(token);
        if (hasBackup) {
          Alert.alert("Success", "Data restored! Please restart the app to see all changes.");
        } else {
          Alert.alert("Notice", "No existing backup found in your Google Drive.");
        }
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Sync Error", "Authentication expired. Please reconnect your Google account.");
      updateSetting('googleConnected', false);
    }
  };"""

# Insert right after `const styles = ...`
content = content.replace(
    '  const styles = useMemo(() => getStyles(THEME), [THEME]);',
    '  const styles = useMemo(() => getStyles(THEME), [THEME]);\n\n' + auth_hook
)

# 3. Update the UI buttons
content = content.replace(
    'onPress={() => updateSetting("googleConnected", !settings.googleConnected)}',
    'onPress={() => { if (!settings.googleConnected) { promptAsync(); } else { updateSetting("googleConnected", false); updateSetting("googleAccessToken", null); } }}'
)

content = content.replace(
    'onPress={() => alert("Syncing data to Google Drive...")}',
    'onPress={() => handleSync(null, "backup")}'
)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
