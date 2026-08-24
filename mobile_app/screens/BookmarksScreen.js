import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useTranslation } from "react-i18next";
import { SettingsContext } from "../utils/SettingsContext";

export default function BookmarksScreen({ navigation }) {
  const { themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  const styles = React.useMemo(() => getStyles(THEME), [THEME]);
  const { t, i18n } = useTranslation();
  const [bookmarks, setBookmarks] = useState([]);
  const [viewMode, setViewMode] = useState("quran");

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadBookmarks();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem("bookmarks");
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeBookmark = async (id) => {
    try {
      const filtered = bookmarks.filter((b) => b.id !== id);
      await AsyncStorage.setItem("bookmarks", JSON.stringify(filtered));
      setBookmarks(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "quran" && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode("quran")}
        >
          <Text
            style={[
              styles.toggleBtnText,
              viewMode === "quran" && styles.toggleBtnTextActive,
            ]}
          >
            {t('quran')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "hadith" && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode("hadith")}
        >
          <Text
            style={[
              styles.toggleBtnText,
              viewMode === "hadith" && styles.toggleBtnTextActive,
            ]}
          >
            {t('hadiths')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 20 }}
      >
        {bookmarks.filter((b) => b.id.startsWith(viewMode)).length === 0 ? (
          <Text style={styles.emptyText}>
            {t("no_bookmarks")}
          </Text>
        ) : (
          bookmarks
            .filter((b) => b.id.startsWith(viewMode))
            .map((bookmark) => (
              <View key={bookmark.id} style={styles.bookmarkCard}>
                <View style={styles.bookmarkHeader}>
                  <Text style={[styles.bookmarkTitle, {textAlign: "left"}]}>{bookmark.title.replace(/^[^\(\-]+/, match => t(match.trim()) + " ").replace("Ayah", t("ayah"))}</Text>
                  <TouchableOpacity onPress={() => removeBookmark(bookmark.id)}>
                    <Ionicons name="bookmark" size={24} color={THEME.gold} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.arabicText}>{bookmark.arabic}</Text>
                <Text style={styles.englishText}>
                {i18n.language === "ur"
                  ? (bookmark.urdu || bookmark.english)
                  : bookmark.english}
              </Text>
              </View>
            ))
        )}
      </ScrollView>

      <LinearGradient
        colors={[`rgba(${THEME.bgRgb}, 1)`, `rgba(${THEME.bgRgb}, 0.9)`, `rgba(${THEME.bgRgb}, 0)`]}
        locations={[0, 0.6, 1]}
        style={styles.floatingHeader}
      >
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            navigation.openDrawer();
          }}
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >

              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#0c4452',
                borderWidth: 0.5,
                borderColor: 'rgba(146, 105, 17, 100)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Image
                  source={require('../assets/custom_menu.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode='contain'
                />
              </View>

        </TouchableOpacity>
        <Text style={[styles.headerTitle, {textAlign: "left"}]} numberOfLines={1}>
          {t("bookmarks")}
        </Text>
      </LinearGradient>
    </View>
  );
}

const getStyles = (THEME) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },
  toggleContainer: {
    marginTop: 80,
    flexDirection: "row",
    backgroundColor: THEME.bg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.inputBg,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  toggleBtnActive: { borderBottomColor: THEME.gold },
  toggleBtnText: { color: THEME.textMuted, fontSize: 16, fontWeight: "600" },
  toggleBtnTextActive: { color: THEME.gold },
  floatingHeader: {
    position: "absolute",
    top: 0,
    width: "100%",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 50,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bg,
    zIndex: 10,
  },
  menuIconBg: {
    position: "absolute",
    backgroundColor: THEME.surface,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 15,
  },
  emptyText: {
    color: THEME.textMuted,
    textAlign: "center",
    marginTop: 100,
    fontSize: 16,
  },
  bookmarkCard: {
    backgroundColor: THEME.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  bookmarkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bookmarkTitle: { color: THEME.gold, fontSize: 16, fontWeight: "bold" },
  arabicText: {
    color: THEME.text,
    fontSize: settings?.arabicFontSize || 28,
    textAlign: "right",
    marginBottom: 15,
    lineHeight: 45,
  },
  englishText: { color: THEME.text, fontSize: settings?.translationFontSize || 16, lineHeight: (settings?.translationFontSize || 16) * 1.5 },
});
