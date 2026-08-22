import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
  Keyboard,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const THEME = {
  bg: "#0c4452",
  surface: "#346671",
  text: "#ffffff",
  textMuted: "#8baeb4",
  accent: "#3ca59d",
  gold: "#cba153",
};

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["rgba(12, 68, 82, 0.9)", "rgba(12, 68, 82, 0)"]}
        locations={[0.5, 1]}
        style={styles.floatingHeader}
      >
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../assets/custom_menu.png")}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings")}</Text>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("language")}</Text>

          <TouchableOpacity
            style={[
              styles.optionRow,
              i18n.language === "en" && styles.optionRowActive,
            ]}
            onPress={() => changeLanguage("en")}
          >
            <Text
              style={[
                styles.optionText,
                i18n.language === "en" && styles.optionTextActive,
              ]}
            >
              English
            </Text>
            {i18n.language === "en" && (
              <Ionicons name="checkmark" size={24} color={THEME.gold} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionRow,
              i18n.language === "ur" && styles.optionRowActive,
            ]}
            onPress={() => changeLanguage("ur")}
          >
            <Text
              style={[
                styles.optionText,
                i18n.language === "ur" && styles.optionTextActive,
              ]}
            >
              اردو (Urdu)
            </Text>
            {i18n.language === "ur" && (
              <Ionicons name="checkmark" size={24} color={THEME.gold} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    width: "100%",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 50,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
  },
  content: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: THEME.textMuted,
    fontSize: 14,
    textTransform: "uppercase",
    marginBottom: 10,
    fontWeight: "600",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionRowActive: {
    borderColor: THEME.gold,
    borderWidth: 1,
  },
  optionText: {
    color: THEME.text,
    fontSize: 16,
  },
  optionTextActive: {
    color: THEME.gold,
    fontWeight: "bold",
  },
});
