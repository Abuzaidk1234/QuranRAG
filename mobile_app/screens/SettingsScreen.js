import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { syncToDrive, syncFromDrive } from '../utils/GoogleDriveSync';
import { Ionicons } from "@expo/vector-icons";
import { SettingsContext } from "../utils/SettingsContext";
import { useTranslation } from "react-i18next";
import Slider from "@react-native-community/slider";

WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen({ navigation, route }) {
  const { themeColors, settings, updateSetting } = React.useContext(SettingsContext);
  const { t, i18n } = useTranslation();
  const THEME = themeColors;
  const styles = useMemo(() => getStyles(THEME), [THEME]);

  
  const scrollViewRef = React.useRef(null);
  
  useEffect(() => {
    if (route.params?.action === 'googleLogin') {
      if (!settings.googleConnected && request) {
        promptAsync();
        if (navigation.setParams) navigation.setParams({ action: null });
      }
    } else if (route.params?.action === 'scrollToAccount') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
      if (navigation.setParams) navigation.setParams({ action: null });
    }
  }, [route.params?.action, settings.googleConnected, request]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '167900378525-ks2a5g5p1fmdt9lpl8h37u7uhhheptfl.apps.googleusercontent.com',
    webClientId: '167900378525-chrk02499qs8af1d54069rmtqnk4r0fr.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication && authentication.accessToken) {
        updateSetting('googleConnected', true);
        updateSetting('googleAccessToken', authentication.accessToken);
        
        Alert.alert(
          "Connected!", 
          "Your account is linked. Would you like to restore data from your Drive, or backup your current device to Drive?",
          [
            { text: "Restore from Drive", onPress: () => handleSync(authentication.accessToken, 'restore') },
            { text: "Backup to Drive", onPress: () => handleSync(authentication.accessToken, 'backup') }
          ]
        );
      }
    } else if (response?.type === 'error') {
      console.log(response.error);
      Alert.alert("Error", "Failed to connect to Google.");
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
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.floatingHeader}>

        <Text style={styles.headerTitle}>{t("settings")}</Text>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("language")}</Text>
          <View style={styles.scriptRow}>
            <TouchableOpacity
              style={[styles.scriptBtn, { paddingVertical: 15 }, i18n.language === "en" && styles.scriptBtnActive]}
              onPress={() => changeLanguage("en")}
            >
              <Text style={[styles.scriptBtnText, i18n.language === "en" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scriptBtn, { paddingVertical: 15 }, i18n.language === "ur" && styles.scriptBtnActive]}
              onPress={() => changeLanguage("ur")}
            >
              <Text style={[styles.scriptBtnText, i18n.language === "ur" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>اردو (Urdu)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("appearance")}</Text>
          <View style={styles.scriptRow}>
            <TouchableOpacity
              style={[styles.scriptBtn, { paddingVertical: 15 }, settings.theme === "system" && styles.scriptBtnActive]}
              onPress={() => updateSetting("theme", "system")}
            >
              <Text style={[styles.scriptBtnText, settings.theme === "system" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("system")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scriptBtn, { paddingVertical: 15 }, settings.theme === "light" && styles.scriptBtnActive]}
              onPress={() => updateSetting("theme", "light")}
            >
              <Text style={[styles.scriptBtnText, settings.theme === "light" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("light")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scriptBtn, { paddingVertical: 15 }, settings.theme === "dark" && styles.scriptBtnActive]}
              onPress={() => updateSetting("theme", "dark")}
            >
              <Text style={[styles.scriptBtnText, settings.theme === "dark" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("dark")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("reading_preferences")}</Text>

          <Text style={[styles.optionText, { marginTop: 15, marginBottom: 10, fontWeight: "bold" }]}>{t("arabic_font_size")}</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <Text style={styles.optionText}>{t("show_arabic")}</Text>
              <Switch
                value={settings.showArabic}
                onValueChange={(val) => updateSetting("showArabic", val)}
                trackColor={{ false: "#767577", true: THEME.gold }}
                thumbColor={"#f4f3f4"}
              />
            </View>
            <View style={[styles.sliderHeader, { marginTop: 20 }]}>
              <Text style={{ color: THEME.textMuted }}>18px</Text>
              <Text style={styles.sliderValue}>{settings.arabicFontSize}px</Text>
              <Text style={{ color: THEME.textMuted }}>50px</Text>
            </View>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={18}
              maximumValue={50}
              step={1}
              value={settings.arabicFontSize}
              onValueChange={(val) => updateSetting("arabicFontSize", val)}
              minimumTrackTintColor={THEME.gold}
              maximumTrackTintColor={THEME.textMuted}
              thumbTintColor={THEME.gold}
            />
            {settings.showArabic && (
              <View style={styles.previewBox}>
                <Text style={{ color: THEME.text, fontSize: settings.arabicFontSize, textAlign: "right", fontFamily: settings.arabicScript === "uthmani" ? "KFGQPC Uthmanic Script HAFS" : undefined }}>
                  {settings.arabicScript === "uthmani" ? "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" : "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ"}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.optionText, { marginTop: 15, marginBottom: 10, fontWeight: "bold" }]}>{t("translation_font_size")}</Text>
          <View style={[styles.card, { marginTop: 0 }]}>
            <View style={styles.toggleRow}>
              <Text style={styles.optionText}>{t("show_translation")}</Text>
              <Switch
                value={settings.showTranslation}
                onValueChange={(val) => updateSetting("showTranslation", val)}
                trackColor={{ false: "#767577", true: THEME.gold }}
                thumbColor={"#f4f3f4"}
              />
            </View>
            <View style={[styles.sliderHeader, { marginTop: 20 }]}>
              <Text style={{ color: THEME.textMuted }}>12px</Text>
              <Text style={styles.sliderValue}>{settings.translationFontSize}px</Text>
              <Text style={{ color: THEME.textMuted }}>30px</Text>
            </View>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={12}
              maximumValue={30}
              step={1}
              value={settings.translationFontSize}
              onValueChange={(val) => updateSetting("translationFontSize", val)}
              minimumTrackTintColor={THEME.gold}
              maximumTrackTintColor={THEME.textMuted}
              thumbTintColor={THEME.gold}
            />
            {settings.showTranslation && (
              <View style={[styles.previewBox, { marginTop: 5 }]}>
                <Text style={{ color: THEME.text, fontSize: settings.translationFontSize, textAlign: "center", lineHeight: settings.translationFontSize * 1.5 }}>
                  {i18n.language === "ur" 
                    ? "اللہ کے نام سے شروع جو بڑا مہربان نہایت رحم والا ہے" 
                    : "In the name of Allah, the Entirely Merciful, the Especially Merciful."}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.optionText, { marginTop: 15, marginBottom: 10 }]}>{t("arabic_script_style")}</Text>
          <View style={styles.scriptRow}>
            <TouchableOpacity
              style={[styles.scriptBtn, settings.arabicScript === "uthmani" && styles.scriptBtnActive]}
              onPress={() => updateSetting("arabicScript", "uthmani")}
            >
              <Text style={[styles.scriptBtnText, settings.arabicScript === "uthmani" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("uthmani")}</Text>
              <Text style={{ color: THEME.text, fontSize: 22, marginTop: 10, textAlign: 'center' }}>بِسْمِ ٱللَّهِ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scriptBtn, settings.arabicScript === "indoPak" && styles.scriptBtnActive]}
              onPress={() => updateSetting("arabicScript", "indoPak")}
            >
              <Text style={[styles.scriptBtnText, settings.arabicScript === "indoPak" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("indo_pak")}</Text>
              <Text style={{ color: THEME.text, fontSize: 22, marginTop: 10, textAlign: 'center' }}>بِسْمِ اللّٰهِ</Text>
            </TouchableOpacity>
          </View>
        </View>

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("account_backup")}</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={[styles.toggleRow, { marginBottom: 15 }]} 
              onPress={() => {
                if (!settings.googleConnected) {
                  promptAsync();
                } else {
                  updateSetting("googleConnected", false);
                  updateSetting("googleAccessToken", null);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                <Ionicons name="logo-google" size={24} color={settings.googleConnected ? THEME.gold : THEME.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.optionText, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit>{t("google_sign_in")}</Text>
              </View>
              <Text style={{ color: settings.googleConnected ? THEME.gold : THEME.textMuted, fontSize: 14, flexShrink: 0 }}>
                {settings.googleConnected ? t("connected") : t("not_connected")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleRow, { opacity: settings.googleConnected ? 1 : 0.5 }]}
              disabled={!settings.googleConnected}
              onPress={() => handleSync(null, "backup")}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cloud-upload-outline" size={24} color={THEME.text} style={{ marginRight: 10 }} />
                <Text style={styles.optionText}>{t("sync_now")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={THEME.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (THEME) => StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  floatingHeader: {
    position: "absolute", top: 0, width: "100%", paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 50, paddingBottom: 15,
    flexDirection: "row", alignItems: "center", zIndex: 10,
  },
  menuButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: THEME.text, fontSize: 20, fontWeight: "bold", marginLeft: 15 },
  content: { paddingTop: 100, paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 30 },
  sectionTitle: { color: THEME.textMuted, fontSize: 14, textTransform: "uppercase", marginBottom: 10, fontWeight: "600" },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: THEME.surface, padding: 16, borderRadius: 12, marginBottom: 10 },
  optionRowActive: { borderColor: THEME.gold, borderWidth: 1 },
  optionText: { color: THEME.text, fontSize: 16 },
  optionTextActive: { color: THEME.gold, fontWeight: "bold" },
  card: { backgroundColor: THEME.surface, padding: 16, borderRadius: 12, marginBottom: 15 },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  sliderValue: { color: THEME.gold, fontWeight: "bold" },
  previewBox: { marginTop: 15, padding: 15, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 8, alignItems: "center", minHeight: 60, justifyContent: "center" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scriptRow: { flexDirection: "row", gap: 10 },
  scriptBtn: { flex: 1, backgroundColor: THEME.surface, paddingVertical: 8, paddingHorizontal: 2, borderRadius: 12, alignItems: "center" },
  scriptBtnActive: { borderColor: THEME.gold, borderWidth: 1 },
  scriptBtnText: { color: THEME.text, fontSize: 14, textAlign: 'center' },
  scriptBtnTextActive: { color: THEME.gold, fontWeight: "bold" },
});
