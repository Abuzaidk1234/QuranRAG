import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function BookmarksScreen({ navigation }) {
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
            Quran
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
            Hadiths
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 20 }}
      >
        {bookmarks.filter((b) => b.id.startsWith(viewMode)).length === 0 ? (
          <Text style={styles.emptyText}>No {viewMode} bookmarks yet.</Text>
        ) : (
          bookmarks
            .filter((b) => b.id.startsWith(viewMode))
            .map((bookmark) => (
              <View key={bookmark.id} style={styles.bookmarkCard}>
                <View style={styles.bookmarkHeader}>
                  <Text style={styles.bookmarkTitle}>{bookmark.title}</Text>
                  <TouchableOpacity onPress={() => removeBookmark(bookmark.id)}>
                    <Ionicons name="bookmark" size={24} color={THEME.gold} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.arabicText}>{bookmark.arabic}</Text>
                <Text style={styles.englishText}>{bookmark.english}</Text>
              </View>
            ))
        )}
      </ScrollView>

      <LinearGradient
        colors={[
          "rgba(12, 68, 82, 1)",
          "rgba(12, 68, 82, 0.9)",
          "rgba(12, 68, 82, 0)",
        ]}
        locations={[0, 0.6, 1]}
        style={styles.floatingHeader}
      >
        <TouchableOpacity
          onPress={() => {
            if (typeof Keyboard !== "undefined") Keyboard.dismiss();
            navigation.openDrawer();
          }}
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          Bookmarks
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: THEME.bg,
    borderBottomWidth: 1,
    borderBottomColor: "#1a505e",
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
    fontSize: 28,
    textAlign: "right",
    marginBottom: 15,
    lineHeight: 45,
  },
  englishText: { color: THEME.text, fontSize: 16, lineHeight: 24 },
});
