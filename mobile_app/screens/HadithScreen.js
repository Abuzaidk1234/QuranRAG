import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  Platform,
  TextInput,
  Alert,
  BackHandler,
  Keyboard,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDatabase, queryDatabase } from "../utils/database";

const THEME = {
  bg: "#0c4452",
  inputBg: "#346671",
  text: "#ffffff",
  active: "#275862",
  gold: "#cba153",
};

import { useTranslation } from "react-i18next";

export default function HadithScreen({ navigation }) {
  const { t, i18n } = useTranslation();
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
  const dbRef = useRef(null);

  useEffect(() => {
    const backAction = () => {
      if (searchedHadith) {
        setSearchedHadith(null);
        setSearchQuery("");
        return true;
      }
      if (selectedChapter) {
        setSelectedChapter(null);
        return true;
      }
      if (selectedBook) {
        setSelectedBook(null);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [searchedHadith, selectedChapter, selectedBook]);

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
            title: `${bookName} - ${t("hadith_number", {number: hadith.idInBook})}`,
            arabic: hadith.arabic,
            english: hadith.english?.text || hadith.english || hadith.text,
        urdu: hadith.urdu,
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
    const initDb = async () => {
      try {
        const db = await getDatabase();
        dbRef.current = db;
        const booksData = await queryDatabase(
          db,
          `SELECT b.id, b.name, b.collection, COUNT(h.id) as total_hadiths 
           FROM hadith_books b 
           LEFT JOIN hadiths h ON b.id = h.book_id 
           GROUP BY b.id
           ORDER BY CASE b.id
             WHEN 'bukhari' THEN 1
             WHEN 'muslim' THEN 2
             WHEN 'abudawud' THEN 3
             WHEN 'tirmidhi' THEN 4
             WHEN 'nasai' THEN 5
             ELSE 6
           END ASC`
        );
        setBooks(booksData);
        setLoading(false);
      } catch (e) {
        console.error("DB Init Error:", e);
        setLoading(false);
      }
    };
    initDb();
  }, []);

  const loadChapters = (book) => {
    if (!dbRef.current) return;
    try {
      const chapterSql = `
        SELECT c.chapter_id, c.arabic, c.english, c.urdu,
               MIN(h.idInBook) as min_id,
               MAX(h.idInBook) as max_id,
               COUNT(h.id) as count
        FROM hadith_chapters c
        LEFT JOIN hadiths h ON c.book_id = h.book_id AND c.chapter_id = h.chapter_id
        WHERE c.book_id = ? AND c.chapter_id IS NOT NULL
        GROUP BY c.chapter_id
        HAVING count > 0
        ORDER BY c.chapter_id ASC
      `;

      let chaptersData;
      if (dbRef.current.getAllSync) {
        chaptersData = dbRef.current.getAllSync(chapterSql, [book.id]);
      }

      const applyChapters = (data) => {
        setChapters(
          data.map((c) => ({
            id: c.chapter_id,
            arabic: c.arabic,
            english: c.english,
            urdu: c.urdu,
            range: c.count > 0 ? `Hadiths ${c.min_id} - ${c.max_id}` : "No hadiths",
            count: c.count,
          }))
        );
        setSelectedBook(book);
        setLoading(false);
      };

      if (chaptersData) {
        applyChapters(chaptersData);
      } else {
        setLoading(true);
        queryDatabase(dbRef.current, chapterSql, [book.id]).then(applyChapters);
      }
    } catch (e) {
      console.error("Failed to load chapters", e);
      setLoading(false);
    }
  };

  const loadHadiths = (chapter) => {
    if (!dbRef.current) return;
    try {
      let hadithsData;
      if (dbRef.current.getAllSync) {
        hadithsData = dbRef.current.getAllSync(
          "SELECT * FROM hadiths WHERE book_id = ? AND chapter_id = ? ORDER BY idInBook ASC",
          [selectedBook.id, chapter.id]
        );
      }

      const applyHadiths = (data) => {
        setHadiths(
          data.map((h) => ({
            id: h.id,
            idInBook: h.idInBook,
            chapterId: h.chapter_id,
            bookId: h.book_id,
            arabic: h.arabic,
            english: { narrator: h.english_narrator, text: h.english_text },
            urdu: h.urdu,
          }))
        );
        setSelectedChapter(chapter);
        setLoading(false);
      };

      if (hadithsData) {
        applyHadiths(hadithsData);
      } else {
        setLoading(true);
        queryDatabase(
          dbRef.current,
          "SELECT * FROM hadiths WHERE book_id = ? AND chapter_id = ? ORDER BY idInBook ASC",
          [selectedBook.id, chapter.id]
        ).then(applyHadiths);
      }
    } catch (e) {
      console.error("Failed to load hadiths", e);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !dbRef.current) return;
    setLoading(true);
    try {
        const num = parseInt(searchQuery.trim());
        const result = await queryDatabase(dbRef.current, "SELECT * FROM hadiths WHERE book_id = ? AND idInBook = ?", [selectedBook.id, num]);
        if (result && result.length > 0) {
            const h = result[0];
            setSearchedHadith({
                id: h.id,
                idInBook: h.idInBook,
                chapterId: h.chapter_id,
                bookId: h.book_id,
                arabic: h.arabic,
                english: { narrator: h.english_narrator, text: h.english_text },
                urdu: h.urdu
            });
        } else {
            Alert.alert(
              "Not Found",
              "Could not find a hadith with that number in this book."
            );
        }
        setLoading(false);
    } catch (e) {
        console.error(e);
        setLoading(false);
    }
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
    <SafeAreaView style={styles.container}>
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
              paddingHorizontal: 25,
            }}
          >
            <View style={styles.hadithContainer}>
              <View style={styles.hadithHeader}>
                <Text style={styles.hadithNumberText}>
                  {t("hadith_number", {number: searchedHadith.idInBook})}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    toggleBookmark(searchedHadith, selectedBook.name, "")
                  }
                >
                  <Ionicons
                    name={
                      bookmarks.some(
                        (b) =>
                          b.id ===
                          `hadith_${selectedBook.id}_${searchedHadith.idInBook}`,
                      )
                        ? "bookmark"
                        : "bookmark-outline"
                    }
                    size={22}
                    color={THEME.gold}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.arabicText}>{searchedHadith.arabic}</Text>
              <Text style={styles.englishText}>
                {i18n.language === "ur" ? (searchedHadith.urdu || "اردو ترجمہ دستیاب نہیں ہے۔") : (searchedHadith.english?.text || searchedHadith.english || searchedHadith.text)}
              </Text>
            </View>
          </ScrollView>
        ) : selectedChapter ? (
          // --- HADITH LIST VIEW (INSIDE CHAPTER) ---
          <FlatList
            key={`hadiths_${selectedBook?.id}_${selectedChapter?.id}`}
            data={hadiths.filter(
              (h) =>
                chapterSearchQuery === "" ||
                String(h.idInBook) === chapterSearchQuery,
            )}
            keyExtractor={(item) => String(item.id || item.idInBook)}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{
              paddingTop: 110,
              paddingBottom: 50,
              paddingHorizontal: 25,
            }}
            ListHeaderComponent={
              <>
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search"
                    size={20}
                    color="#8baeb4"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t("search_by_number")}
                    placeholderTextColor="#8baeb4"
                    keyboardType="numeric"
                    value={chapterSearchQuery}
                    onChangeText={setChapterSearchQuery}
                    returnKeyType="search"
                  />
                  {chapterSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setChapterSearchQuery("")}>
                      <Ionicons name="close-circle" size={20} color="#8baeb4" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text
                  style={{
                    color: "#8baeb4",
                    fontSize: 13,
                    textAlign: "right",
                    marginTop: -12,
                    marginBottom: 20,
                    marginRight: 10,
                    fontWeight: "bold",
                  }}
                >
                  {`${t("valid_range")} ${hadiths.length > 0 ? hadiths[0].idInBook : 0} ${t("to")} ${hadiths.length > 0 ? hadiths[hadiths.length - 1].idInBook : 0}`}
                </Text>
              </>
            }
            renderItem={({ item: hadith }) => (
              <View style={styles.hadithContainer}>
                <View style={styles.hadithHeader}>
                  <Text style={styles.hadithNumberText}>
                    {t("hadith_number", { number: hadith.idInBook })}
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
                  {i18n.language === "ur"
                    ? hadith.urdu || "اردو ترجمہ دستیاب نہیں ہے۔"
                    : hadith.english?.text ||
                      hadith.english ||
                      hadith.text}
                </Text>
              </View>
            )}
          />
        ) : selectedBook ? (
          // --- CHAPTER LIST VIEW ---
          <FlatList
            key={`chapters_${selectedBook?.id}`}
            data={chapters}
            keyExtractor={(item) => String(item.id)}
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{
              paddingTop: 110,
              paddingBottom: 50,
              paddingHorizontal: 25,
            }}
            ListHeaderComponent={
              <>
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
                    placeholder={t("search_by_number")}
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

                {selectedBook?.total_hadiths ? (
                  <Text
                    style={{
                      color: "#8baeb4",
                      fontSize: 13,
                      textAlign: "right",
                      marginTop: -12,
                      marginBottom: 20,
                      marginRight: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {`${t("valid_range")} 1 ${t("to")} ${selectedBook.total_hadiths}`}
                  </Text>
                ) : null}

                <Text style={[styles.pageTitle, { textAlign: "left" }]}>
                  {t(selectedBook.id)}
                </Text>
              </>
            }
            renderItem={({ item: chapter }) => (
              <TouchableOpacity
                style={styles.listItemStacked}
                onPress={() => loadHadiths(chapter)}
              >
                <View style={styles.listItemHeader}>
                  <View style={styles.listBadge}>
                    <Text style={styles.listBadgeText}>{chapter.id}</Text>
                  </View>
                  <View style={styles.listTextContainer}>
                    <Text style={[styles.listTitle, { textAlign: "left" }]}>
                      {t(chapter.english)}
                    </Text>
                    {chapter.range ? (
                      <Text style={[styles.listSubtitle, { textAlign: "left" }]}>
                        {chapter.range.includes("No hadiths")
                          ? t("no_hadiths")
                          : chapter.range.replace("Hadiths", t("hadiths"))}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.listArabicStacked}>{chapter.arabic}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          // --- BOOK LIST VIEW ---
          <ScrollView
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{
              paddingTop: 110,
              paddingBottom: 50,
              paddingHorizontal: 25,
            }}
          >
            <Text style={[styles.pageTitle, {textAlign: "left"}]}>{t('hadith_collections')}</Text>
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
                  <Text style={[styles.listTitle, {textAlign: "left"}]}>{t(book.id)}</Text>
                  {book.total_hadiths ? (
                    <Text style={[styles.listSubtitle, {textAlign: "left"}]}>
                      ({t("hadiths_count", {count: book.total_hadiths})})
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
            <Text
              style={[
                styles.headerTitle,
                {
                  textAlign: "left",
                  fontSize: i18n.language === "ur" ? 17 : 16,
                  lineHeight: 22,
                },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {searchedHadith
                ? t("hadith_number", { number: searchedHadith.idInBook })
                : selectedChapter
                  ? i18n.language === "ur"
                    ? selectedChapter.arabic || t(selectedChapter.english)
                    : selectedChapter.english
                  : t(selectedBook.id)}
            </Text>
          </TouchableOpacity>
        ) : (
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
            <Image
              source={require("../assets/custom_menu.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  floatingHeader: {
    zIndex: 10,
    position: "absolute",
    top: 0,
    width: "100%",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 50,
    paddingBottom: 10,
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
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
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
    paddingHorizontal: 25,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: THEME.text, fontSize: 16, marginLeft: 5 },
});
