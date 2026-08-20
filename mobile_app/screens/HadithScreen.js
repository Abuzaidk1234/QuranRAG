import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  TextInput,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";

const THEME = {
  bg: "#0c4452",
  inputBg: "#346671",
  text: "#ffffff",
  active: "#275862",
  gold: "#cba153",
};

export default function HadithScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [chapters, setChapters] = useState([]);

  const [selectedChapter, setSelectedChapter] = useState(null);
  const [hadiths, setHadiths] = useState([]);

  const [loading, setLoading] = useState(true);

  // Search state for finding hadiths by number in the entire book
  const [searchQuery, setSearchQuery] = useState("");
  const [chapterSearchQuery, setChapterSearchQuery] = useState("");
  const [searchedHadith, setSearchedHadith] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem("bookmarks");
      if (stored) setBookmarks(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBookmarks();
    const unsubscribe = navigation.addListener("focus", () => {
      loadBookmarks();
    });
    return unsubscribe;
  }, [navigation]);

  const toggleBookmark = async (hadith, bookName, chapterName) => {
    try {
      const id = `hadith_${selectedBook.id}_${hadith.idInBook}`;
      const isBookmarked = bookmarks.some((b) => b.id === id);
      let updatedBookmarks;
      if (isBookmarked) {
        updatedBookmarks = bookmarks.filter((b) => b.id !== id);
      } else {
        updatedBookmarks = [
          ...bookmarks,
          {
            id,
            title: `${bookName} - Hadith ${hadith.idInBook}`,
            arabic: hadith.arabic,
            english: hadith.english?.text || hadith.english,
          },
        ];
      }
      await AsyncStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
      setBookmarks(updatedBookmarks);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    axios
      .get("http://192.168.1.100:8000/hadiths/books")
      .then((response) => {
        setBooks(response.data.books);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load books", error);
        setLoading(false);
      });
  }, []);

  const loadChapters = (book) => {
    setLoading(true);
    axios
      .get(`http://192.168.1.100:8000/hadiths/${book.id}`)
      .then((response) => {
        setChapters(response.data.chapters);
        setSelectedBook(book);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load chapters", error);
        setLoading(false);
      });
  };

  const loadHadiths = (chapter) => {
    setLoading(true);
    axios
      .get(`http://192.168.1.100:8000/hadiths/${selectedBook.id}/${chapter.id}`)
      .then((response) => {
        setHadiths(response.data.hadiths);
        setSelectedChapter(chapter);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load hadiths", error);
        setLoading(false);
      });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    axios
      .get(
        `http://192.168.1.100:8000/hadiths/${selectedBook.id}/search/${searchQuery.trim()}`,
      )
      .then((response) => {
        setSearchedHadith(response.data.hadith);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        Alert.alert(
          "Not Found",
          "Could not find a hadith with that number in this book.",
        );
      });
  };

  const goBack = () => {
    if (searchedHadith) {
      setSearchedHadith(null);
      setSearchQuery("");
    } else if (selectedChapter) {
      setSelectedChapter(null);
      setHadiths([]);
      setChapterSearchQuery("");
    } else if (selectedBook) {
      setSelectedBook(null);
      setChapters([]);
      setSearchQuery("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={THEME.text}
            style={{ marginTop: 100 }}
          />
        ) : searchedHadith ? (
          // --- SINGLE SEARCHED HADITH VIEW ---
          <ScrollView
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{
              paddingTop: 110,
              paddingBottom: 50,
              paddingHorizontal: 20,
            }}
          >
            <View style={styles.hadithContainer}>
              <View style={styles.hadithHeader}>
                <Text style={styles.hadithNumberText}>
                  Hadith {searchedHadith.idInBook}
                </Text>
              </View>
              <Text style={styles.arabicText}>{searchedHadith.arabic}</Text>
              <Text style={styles.englishText}>
                {searchedHadith.english?.text || searchedHadith.english}
              </Text>
            </View>
          </ScrollView>
        ) : selectedChapter ? (
          // --- HADITH LIST VIEW (INSIDE CHAPTER) ---
          <ScrollView
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{
              paddingTop: 110,
              paddingBottom: 50,
              paddingHorizontal: 20,
            }}
          >
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#8baeb4"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${selectedChapter.english}...`}
                placeholderTextColor="#8baeb4"
                keyboardType="numeric"
                value={chapterSearchQuery}
                onChangeText={setChapterSearchQuery}
                returnKeyType="search"
              />{" "}
              {chapterSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setChapterSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#8baeb4" />
                </TouchableOpacity>
              )}
            </View>

            <Text
              style={{
                color: THEME.textMuted,
                fontSize: 13,
                textAlign: "right",
                marginTop: -12,
                marginBottom: 20,
                marginRight: 10,
                fontStyle: "bold",
                color: "#8baeb4",
              }}
            >
              Valid range: {hadiths.length > 0 ? hadiths[0].idInBook : 0} to{" "}
              {hadiths.length > 0 ? hadiths[hadiths.length - 1].idInBook : 0}
            </Text>

            {hadiths
              .filter(
                (h) =>
                  chapterSearchQuery === "" ||
                  String(h.idInBook) === chapterSearchQuery,
              )
              .map((hadith, idx) => (
                <View key={idx} style={styles.hadithContainer}>
                  <View style={styles.hadithHeader}>
                    <Text style={styles.hadithNumberText}>
                      Hadith {hadith.idInBook}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        toggleBookmark(
                          hadith,
                          selectedBook.name,
                          selectedChapter.english,
                        )
                      }
                    >
                      <Ionicons
                        name={
                          bookmarks.some(
                            (b) =>
                              b.id ===
                              `hadith_${selectedBook.id}_${hadith.idInBook}`,
                          )
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={22}
                        color={THEME.gold}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.arabicText}>{hadith.arabic}</Text>
                  <Text style={styles.englishText}>
                    {hadith.english?.text || hadith.english}
                  </Text>
                </View>
              ))}
          </ScrollView>
        ) : selectedBook ? (
          // --- CHAPTER LIST VIEW ---
          <ScrollView
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{
              paddingTop: 110,
              paddingBottom: 50,
              paddingHorizontal: 20,
            }}
          >
            {/* Search Bar for entire book */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#8baeb4"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search by number`}
                placeholderTextColor="#8baeb4"
                keyboardType="numeric"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#8baeb4" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.pageTitle}>{selectedBook.name}</Text>
            {chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.listItemStacked}
                onPress={() => loadHadiths(chapter)}
              >
                <View style={styles.listItemHeader}>
                  <View style={styles.listBadge}>
                    <Text style={styles.listBadgeText}>{chapter.id}</Text>
                  </View>
                  <View style={styles.listTextContainer}>
                    <Text style={styles.listTitle}>{chapter.english}</Text>
                    {chapter.range ? (
                      <Text style={styles.listSubtitle}>{chapter.range}</Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.listArabicStacked}>{chapter.arabic}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          // --- BOOK LIST VIEW ---
          <ScrollView
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{
              paddingTop: 110,
              paddingBottom: 50,
              paddingHorizontal: 20,
            }}
          >
            <Text style={styles.pageTitle}>Hadith Collections</Text>
            {books.map((book, idx) => (
              <TouchableOpacity
                key={book.id}
                style={styles.listItem}
                onPress={() => loadChapters(book)}
              >
                <View style={styles.listBadge}>
                  <Text style={styles.listBadgeText}>{idx + 1}</Text>
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle}>{book.name}</Text>
                  {book.total_hadiths ? (
                    <Text style={styles.listSubtitle}>
                      ({book.total_hadiths} Hadiths)
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Floating Header */}
      <LinearGradient
        colors={[
          "rgba(12, 68, 82, 1)",
          "rgba(12, 68, 82, 0.9)",
          "rgba(12, 68, 82, 0)",
        ]}
        locations={[0, 0.6, 1]}
        style={styles.floatingHeader}
      >
        {selectedBook ? (
          <TouchableOpacity onPress={goBack} style={styles.headerRow}>
            <Ionicons name="arrow-back" size={28} color={THEME.text} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {searchedHadith
                ? `Hadith ${searchedHadith.idInBook}`
                : selectedChapter
                  ? selectedChapter.english
                  : selectedBook.name}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Image
              source={require("../assets/custom_menu.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  floatingHeader: {
    position: "absolute",
    top: 0,
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 25,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  headerRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
    flex: 1,
  },
  content: { flex: 1 },
  pageTitle: {
    color: THEME.text,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBg,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },

  // For long chapter names, stack them vertically
  listItemStacked: {
    backgroundColor: THEME.inputBg,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  listItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  listBadge: {
    backgroundColor: THEME.active,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  listBadgeText: { color: THEME.text, fontWeight: "bold" },
  listTextContainer: { flex: 1, marginLeft: 15 },
  listTitle: { color: THEME.text, fontSize: 16, fontWeight: "bold" },
  listSubtitle: { color: "#8baeb4", fontSize: 13, marginTop: 4 },
  listArabicStacked: {
    color: THEME.text,
    fontSize: 18,
    textAlign: "right",
    marginTop: 5,
  },

  hadithContainer: {
    marginBottom: 30,
    backgroundColor: THEME.inputBg,
    padding: 20,
    borderRadius: 15,
  },
  hadithHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: THEME.active,
    paddingBottom: 10,
    marginBottom: 15,
  },
  hadithNumberText: { color: THEME.text, fontWeight: "bold", fontSize: 14 },
  arabicText: {
    color: THEME.text,
    fontSize: 22,
    textAlign: "right",
    marginBottom: 15,
    lineHeight: 36,
  },
  englishText: { color: "#8baeb4", fontSize: 16, lineHeight: 24 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBg,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: THEME.text, fontSize: 16, marginLeft: 5 },
});
