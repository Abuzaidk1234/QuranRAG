import React, { useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Switch,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SettingsContext } from "../utils/SettingsContext";
import Slider from "@react-native-community/slider";

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { settings, updateSetting, themeColors } = useContext(SettingsContext);
  const THEME = themeColors;
  const styles = useMemo(() => getStyles(THEME), [THEME]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[`rgba(${THEME.bgRgb}, 0.9)`, `rgba(${THEME.bgRgb}, 0)`]}
        locations={[0.5, 1]}
        style={styles.floatingHeader}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.menuButton}
        >
          <Ionicons name="arrow-back" size={28} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings")}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* App Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("language")}</Text>
          <TouchableOpacity
            style={[styles.optionRow, i18n.language === "en" && styles.optionRowActive]}
            onPress={() => changeLanguage("en")}
          >
            <Text style={[styles.optionText, i18n.language === "en" && styles.optionTextActive]}>English</Text>
            {i18n.language === "en" && <Ionicons name="checkmark" size={24} color={THEME.gold} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionRow, i18n.language === "ur" && styles.optionRowActive]}
            onPress={() => changeLanguage("ur")}
          >
            <Text style={[styles.optionText, i18n.language === "ur" && styles.optionTextActive]}>اردو (Urdu)</Text>
            {i18n.language === "ur" && <Ionicons name="checkmark" size={24} color={THEME.gold} />}
          </TouchableOpacity>
        </View>

        {/* Reading Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("reading_preferences")}</Text>
          
          {/* Arabic Card (Merged Toggle + Slider) */}
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
            
            {settings.showArabic && (
              <>
                <View style={[styles.sliderHeader, { marginTop: 15 }]}>
                  <Text style={styles.optionText}>{t("arabic_font_size")}</Text>
                  <Text style={styles.sliderValue}>{settings.arabicFontSize}</Text>
                </View>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={20}
                  maximumValue={60}
                  step={1}
                  value={settings.arabicFontSize}
                  onValueChange={(val) => updateSetting("arabicFontSize", val)}
                  minimumTrackTintColor={THEME.gold}
                  maximumTrackTintColor={THEME.textMuted}
                />
                {/* Dynamic Preview */}
                <View style={styles.previewBox}>
                  <Text style={{ color: THEME.text, fontSize: settings.arabicFontSize, textAlign: "center", lineHeight: settings.arabicFontSize * 1.5 }}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Translation Card (Merged Toggle + Slider) */}
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <Text style={styles.optionText}>{t("show_translation")}</Text>
              <Switch
                value={settings.showTranslation}
                onValueChange={(val) => updateSetting("showTranslation", val)}
                trackColor={{ false: "#767577", true: THEME.gold }}
                thumbColor={"#f4f3f4"}
              />
            </View>
            
            {settings.showTranslation && (
              <>
                <View style={[styles.sliderHeader, { marginTop: 15 }]}>
                  <Text style={styles.optionText}>{t("translation_font_size")}</Text>
                  <Text style={styles.sliderValue}>{settings.translationFontSize}</Text>
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
                />
                {/* Dynamic Preview */}
                <View style={styles.previewBox}>
                  <Text style={{ color: THEME.text, fontSize: settings.translationFontSize, textAlign: "center", lineHeight: settings.translationFontSize * 1.5 }}>
                    {i18n.language === "ur" 
                      ? "اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے" 
                      : "In the name of Allah, the Entirely Merciful, the Especially Merciful."}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Arabic Script */}
          <Text style={[styles.optionText, { marginTop: 15, marginBottom: 10 }]}>{t("arabic_script_style")}</Text>
          <View style={styles.scriptRow}>
            <TouchableOpacity
              style={[styles.scriptBtn, settings.arabicScript === "uthmani" && styles.scriptBtnActive]}
              onPress={() => updateSetting("arabicScript", "uthmani")}
            >
              <Text style={[styles.scriptBtnText, settings.arabicScript === "uthmani" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("uthmani")}</Text>
              <Text style={{ color: THEME.text, fontSize: 22, marginTop: 10, textAlign: 'center' }}>ٱلْحَمْدُ لِلَّهِ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scriptBtn, settings.arabicScript === "indoPak" && styles.scriptBtnActive]}
              onPress={() => updateSetting("arabicScript", "indoPak")}
            >
              <Text style={[styles.scriptBtnText, settings.arabicScript === "indoPak" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("indo_pak")}</Text>
              <Text style={{ color: THEME.text, fontSize: 22, marginTop: 10, textAlign: 'center' }}>اَلْحَمْدُ لِلّٰهِ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("appearance_coming_soon").replace(" (Coming Soon)", "").replace(" (جلد آ رہا ہے)", "")}</Text>
          <View style={styles.scriptRow}>
            <TouchableOpacity
              style={[styles.scriptBtn, settings.theme === "light" && styles.scriptBtnActive]}
              onPress={() => updateSetting("theme", "light")}
            >
              <Text style={[styles.scriptBtnText, settings.theme === "light" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("light")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scriptBtn, settings.theme === "dark" && styles.scriptBtnActive]}
              onPress={() => updateSetting("theme", "dark")}
            >
              <Text style={[styles.scriptBtnText, settings.theme === "dark" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("dark")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scriptBtn, settings.theme === "system" && styles.scriptBtnActive]}
              onPress={() => updateSetting("theme", "system")}
            >
              <Text style={[styles.scriptBtnText, settings.theme === "system" && styles.scriptBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>{t("system")}</Text>
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
  scriptBtn: { flex: 1, backgroundColor: THEME.surface, padding: 8, borderRadius: 12, alignItems: "center" },
  scriptBtnActive: { borderColor: THEME.gold, borderWidth: 1 },
  scriptBtnText: { color: THEME.text, fontSize: 14 },
  scriptBtnTextActive: { color: THEME.gold, fontWeight: "bold" },
});
