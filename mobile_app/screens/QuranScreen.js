import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  Modal,
  Alert,
  BackHandler,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { getDatabase, queryDatabase } from "../utils/database";

const THEME = {
  bg: "#0c4452",
  surface: "#346671",
  text: "#ffffff",
  textMuted: "#8baeb4",
  accent: "#3ca59d",
  gold: "#cba153",
};

// Helper for Arabic numbers
const toArabicNumber = (num) => {
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((c) => arabicNumbers[Number(c)])
    .join("");
};

// 8-Pointed Star Component (Rub el Hizb)
const Octagram = ({ number, size = 32 }) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={[
          styles.starSquare,
          {
            width: size - 4,
            height: size - 4,
            transform: [{ rotate: "0deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.starSquare,
          {
            width: size - 4,
            height: size - 4,
            transform: [{ rotate: "45deg" }],
          },
        ]}
      />
      <Text style={[styles.starText, { fontSize: size * 0.35 }]}>{number}</Text>
    </View>
  );
};

import { useTranslation } from "react-i18next";

export default function QuranScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([]);

  // Juz State
  const [viewMode, setViewMode] = useState("surah"); // 'surah' or 'juz'
  const [juzs, setJuzs] = useState([]);
  const [juzData, setJuzData] = useState(null);

  useEffect(() => {
    const backAction = () => {
      if (selectedSurah || juzData) {
        setSelectedSurah(null);
        setSurahData(null);
        setJuzData(null);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [selectedSurah, juzData]);

  const [lastRead, setLastRead] = useState(null);
  const scrollViewRef = useRef(null);
  const ayahPositions = useRef({});
  const pendingScrollAyah = useRef(null);
  const dbRef = useRef(null);

  const loadLastRead = async () => {
    try {
      const stored = await AsyncStorage.getItem("lastRead");
      if (stored) setLastRead(JSON.parse(stored));
    } catch (e) {}
  };

  const saveLastRead = async (type, id, title, targetAyah = null) => {
    try {
      const data = { type, id, title, targetAyah };
      setLastRead(data);
      await AsyncStorage.setItem("lastRead", JSON.stringify(data));
      Alert.alert("Saved", `${title} has been set as your Last Read.`);
    } catch (e) {}
  };

  useEffect(() => {
    loadLastRead();
    const unsubscribe = navigation.addListener("focus", () => {
      loadLastRead();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem("bookmarks");
      if (stored) setBookmarks(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePinAyah = (ayah, surahName) => {
    const sNum = ayah.surahNumber || selectedSurah;
    const title = `${surahName} (Ayah ${ayah.numberInSurah})`;
    saveLastRead("ayah", sNum, title, ayah.numberInSurah);
  };

  const toggleBookmark = async (ayah, surahName) => {
    try {
      // create a unique ID for the ayah
      const id = `quran_${ayah.number}`;
      const isBookmarked = bookmarks.some((b) => b.id === id);
      let updatedBookmarks;

      if (isBookmarked) {
        updatedBookmarks = bookmarks.filter((b) => b.id !== id);
      } else {
        const newBookmark = {
          id: id,
          title: `${surahName} - Ayah ${ayah.numberInSurah}`,
          arabic: ayah.arabic,
          english: ayah.english,
        urdu: ayah.urdu,
        };
        updatedBookmarks = [...bookmarks, newBookmark];
      }

      await AsyncStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
      setBookmarks(updatedBookmarks);
    } catch (e) {
      console.error(e);
    }
  };

  const loadJuz = (juzNumber) => {
    if (!juzNumber || !dbRef.current) return;
    try {
      let ayahs;
      if (dbRef.current.getAllSync) {
        ayahs = dbRef.current.getAllSync(
          "SELECT * FROM ayahs WHERE juz = ? ORDER BY id ASC",
          [juzNumber]
        );
      }

      const mapAyahs = (rows) =>
        rows.map((a) => {
          const surah = surahs.find((s) => s.id === a.surah_id);
          return {
            number: a.id,
            numberInSurah: a.numberInSurah,
            juz: a.juz,
            text: a.arabic,
            arabic: a.arabic,
            english: a.english,
            urdu: a.urdu,
            surah: surah,
            surahNameEnglish: surah?.englishName || "",
            surahNameArabic: surah?.name || "",
            surahNumber: a.surah_id,
          };
        });

      if (ayahs) {
        setSelectedSurah(null);
        setSurahData(null);
        setJuzData({ juz: juzNumber, ayahs: mapAyahs(ayahs) });
        setLoading(false);
      } else {
        setLoading(true);
        setSelectedSurah(null);
        setSurahData(null);
        queryDatabase(
          dbRef.current,
          "SELECT * FROM ayahs WHERE juz = ? ORDER BY id ASC",
          [juzNumber]
        ).then((rows) => {
          setJuzData({ juz: juzNumber, ayahs: mapAyahs(rows) });
          setLoading(false);
        });
      }
    } catch (e) {
      console.error("Failed to load Juz", e);
      setLoading(false);
    }
  };

  const loadSurah = (surahNumber, targetAyah = null) => {
    if (!surahNumber || !dbRef.current) return;
    if (targetAyah) pendingScrollAyah.current = targetAyah;

    try {
      let surahMeta, ayahsList;
      if (dbRef.current.getAllSync) {
        const meta = dbRef.current.getAllSync(
          "SELECT * FROM surahs WHERE id = ?",
          [surahNumber]
        );
        surahMeta = meta[0];
        ayahsList = dbRef.current.getAllSync(
          "SELECT * FROM ayahs WHERE surah_id = ? ORDER BY id ASC",
          [surahNumber]
        );
      }

      const applySurah = (meta, ayahs) => {
        setSurahData({
          number: meta.id,
          name: meta.name,
          englishName: meta.englishName,
          revelationType: meta.revelationType,
          numberOfAyahs: meta.numberOfAyahs,
          ayahs: ayahs.map((a) => ({
            number: a.id,
            numberInSurah: a.numberInSurah,
            juz: a.juz,
            text: a.arabic,
            arabic: a.arabic,
            english: a.english,
            urdu: a.urdu,
          })),
        });
        setJuzData(null);
        setSelectedSurah(surahNumber);
        setLoading(false);
      };

      if (surahMeta && ayahsList) {
        applySurah(surahMeta, ayahsList);
      } else {
        setLoading(true);
        setJuzData(null);
        queryDatabase(dbRef.current, "SELECT * FROM surahs WHERE id = ?", [
          surahNumber,
        ]).then((meta) => {
          queryDatabase(
            dbRef.current,
            "SELECT * FROM ayahs WHERE surah_id = ? ORDER BY id ASC",
            [surahNumber]
          ).then((ayahs) => {
            applySurah(meta[0], ayahs);
          });
        });
      }

      if (pendingScrollAyah.current) {
        const target = pendingScrollAyah.current;
        setTimeout(() => {
          if (scrollViewRef.current) {
            const targetIdx = target - 1;
            try {
              scrollViewRef.current.scrollToIndex({
                index: Math.max(0, targetIdx),
                animated: true,
                viewPosition: 0,
                viewOffset: 140,
              });
            } catch (err) {
              console.warn("ScrollToIndex error:", err);
            }
          }
          pendingScrollAyah.current = null;
        }, 350);
      }
    } catch (e) {
      console.error("Failed to load surah details", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
    const initDb = async () => {
      try {
        const db = await getDatabase();
        dbRef.current = db;
        
        // Generate Juzs (1-30)
        const juzList = Array.from({length: 30}, (_, i) => ({id: i + 1, name: `Juz ${i + 1}`}));
        setJuzs(juzList);

        // Fetch Surahs
        const surahsData = await queryDatabase(db, "SELECT * FROM surahs ORDER BY id ASC");
        setSurahs(surahsData.map(s => ({...s, number: s.id})));
        
        setLoading(false);
      } catch (e) {
        console.error("DB Init Error:", e);
        setLoading(false);
      }
    };
    initDb();
  }, []);

  const goBack = () => {
    setSelectedSurah(null);
    setSurahData(null);
    setJuzData(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={THEME.accent}
            style={{ marginTop: 120 }}
          />
        ) : juzData ? (
          <FlatList
            key={`juz_${juzData?.juz}`}
            data={juzData.ayahs}
            keyExtractor={(item) => String(item.number)}
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            windowSize={7}
            removeClippedSubviews={Platform.OS === "android"}
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{ paddingTop: 120, paddingBottom: 50 }}
            renderItem={({ item: ayah }) => (
              <View>
                {ayah.numberInSurah === 1 && (
                  <>
                    <View
                      style={[
                        styles.bannerContainer,
                        {
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 10,
                          marginBottom: -10,
                        },
                      ]}
                    >
                      <ImageBackground
                        source={require("../assets/Surant_name.png")}
                        style={{
                          width: 300,
                          height: 110,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        resizeMode="contain"
                      >
                        <Text
                          style={[styles.bannerArabic, { fontSize: 30 }]}
                          adjustsFontSizeToFit
                          numberOfLines={1}
                        >
                          {ayah.surahNameArabic}
                        </Text>
                      </ImageBackground>
                    </View>
                    {ayah.surahNumber !== 9 && (
                      <View
                        style={[
                          styles.bismillahContainer,
                          {
                            width: "100%",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 20,
                            marginTop: -10,
                            direction: "ltr",
                            paddingHorizontal: 25,
                          },
                        ]}
                      >
                        <Image
                          source={require("../assets/Bismilla.png")}
                          style={{
                            width: 65,
                            height: 65,
                            transform: [{ rotate: "-90deg" }],
                            marginRight: -15,
                          }}
                          resizeMode="contain"
                        />
                        <Text
                          style={[
                            styles.bismillah,
                            {
                              fontSize: 28,
                              textAlign: "center",
                              marginTop: -5,
                              flexShrink: 1,
                            },
                          ]}
                          adjustsFontSizeToFit
                          numberOfLines={1}
                        >
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </Text>
                        <Image
                          source={require("../assets/Bismilla.png")}
                          style={{
                            width: 65,
                            height: 65,
                            transform: [{ rotate: "90deg" }],
                            marginLeft: -15,
                          }}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  </>
                )}
                <View style={styles.ayahRow}>
                  <View style={styles.ayahLeft}>
                    <Octagram number={ayah.numberInSurah} size={36} />
                    <TouchableOpacity
                      style={{ marginTop: 15 }}
                      onPress={() =>
                        toggleBookmark(ayah, ayah.surahNameEnglish)
                      }
                    >
                      <Ionicons
                        name={
                          bookmarks.some((b) => b.id === `quran_${ayah.number}`)
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={22}
                        color={THEME.gold}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ marginTop: 15 }}
                      onPress={() => handlePinAyah(ayah, ayah.surahNameEnglish)}
                    >
                      <Ionicons
                        name={
                          lastRead?.type === "ayah" &&
                          lastRead?.title.includes(
                            `(Ayah ${ayah.numberInSurah})`,
                          )
                            ? "location"
                            : "location-outline"
                        }
                        size={26}
                        color={THEME.gold}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.ayahRight}>
                    <Text style={styles.ayahArabic}>
                      {ayah.arabic}{" "}
                      <Text style={{ color: THEME.textMuted }}>
                        {"\uFD3F"}
                        {toArabicNumber(ayah.numberInSurah)}
                        {"\uFD3E"}
                      </Text>
                    </Text>
                    <Text style={styles.ayahEnglish}>
                      {i18n.language === "ur"
                        ? ayah.urdu && ayah.urdu.trim() !== ""
                          ? ayah.urdu
                          : ayah.english
                        : ayah.english}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        ) : selectedSurah && surahData ? (
          <FlatList
            key={`surah_${selectedSurah}`}
            ref={scrollViewRef}
            data={surahData.ayahs}
            keyExtractor={(item) => String(item.number)}
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            windowSize={7}
            removeClippedSubviews={Platform.OS === "android"}
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{ paddingTop: 120, paddingBottom: 50 }}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise((resolve) => setTimeout(resolve, 150));
              wait.then(() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0,
                    viewOffset: 140,
                  });
                }
              });
            }}
            ListHeaderComponent={
              <>
                {/* Ornate Banner */}
                <View
                  style={[
                    styles.bannerContainer,
                    {
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: -20,
                      marginBottom: -10,
                    },
                  ]}
                >
                  <ImageBackground
                    source={require("../assets/Surant_name.png")}
                    style={{
                      width: 380,
                      height: 130,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    resizeMode="contain"
                  >
                    <Text
                      style={[
                        styles.bannerArabic,
                        {
                          textAlign: "center",
                          width: "80%",
                          paddingHorizontal: 25,
                        },
                      ]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      {surahData.name}
                    </Text>
                  </ImageBackground>
                </View>

                {surahData.number !== 1 &&
                  surahData.number !== 9 &&
                  selectedSurah !== 1 &&
                  selectedSurah !== 9 && (
                    <View
                      style={[
                        styles.bismillahContainer,
                        {
                          width: "100%",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: -10,
                          marginTop: -30,
                          direction: "ltr",
                          paddingHorizontal: 25,
                        },
                      ]}
                    >
                      <Image
                        source={require("../assets/Bismilla.png")}
                        style={{
                          width: 65,
                          height: 65,
                          transform: [{ rotate: "-90deg" }],
                          marginRight: -6,
                        }}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.bismillah,
                          {
                            fontSize: 25,
                            textAlign: "center",
                            marginTop: -5,
                            flexShrink: 1,
                          },
                        ]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                      </Text>
                      <Image
                        source={require("../assets/Bismilla.png")}
                        style={{
                          width: 65,
                          height: 65,
                          transform: [{ rotate: "90deg" }],
                          marginLeft: -6,
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  )}
              </>
            }
            renderItem={({ item: ayah }) => (
              <View
                style={styles.ayahRow}
                onLayout={(event) => {
                  ayahPositions.current[ayah.numberInSurah] =
                    event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.ayahLeft}>
                  <Octagram number={ayah.numberInSurah} size={36} />
                  <TouchableOpacity
                    style={{ marginTop: 15 }}
                    onPress={() => toggleBookmark(ayah, surahData.englishName)}
                  >
                    <Ionicons
                      name={
                        bookmarks.some((b) => b.id === `quran_${ayah.number}`)
                          ? "bookmark"
                          : "bookmark-outline"
                      }
                      size={22}
                      color={THEME.gold}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ marginTop: 15 }}
                    onPress={() => handlePinAyah(ayah, surahData.englishName)}
                  >
                    <Ionicons
                      name={
                        lastRead?.type === "ayah" &&
                        lastRead?.title ===
                          `${surahData.englishName} (Ayah ${ayah.numberInSurah})`
                          ? "location"
                          : "location-outline"
                      }
                      size={26}
                      color={THEME.gold}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.ayahRight}>
                  {/* Arabic text with the ornate end symbol containing the arabic number */}
                  <Text style={styles.ayahArabic}>
                    {ayah.arabic}{" "}
                    <Text style={{ color: THEME.textMuted }}>
                      {"\uFD3F"}
                      {toArabicNumber(ayah.numberInSurah)}
                      {"\uFD3E"}
                    </Text>
                  </Text>
                  <Text style={styles.ayahEnglish}>
                    {i18n.language === "ur"
                      ? ayah.urdu && ayah.urdu.trim() !== ""
                        ? ayah.urdu
                        : ayah.english
                      : ayah.english}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={
              <View
                style={[
                  styles.bismillahContainer,
                  {
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 0,
                    marginBottom: -30,
                    direction: "ltr",
                    paddingHorizontal: 25,
                  },
                ]}
              >
                <Image
                  source={require("../assets/Bismilla.png")}
                  style={{
                    width: 65,
                    height: 65,
                    transform: [{ rotate: "-90deg" }],
                    marginRight: 0,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    fontSize: 18,
                    textAlign: "center",
                    color: THEME.textMuted,
                    letterSpacing: 4,
                    fontWeight: "bold",
                  }}
                >
                  END
                </Text>
                <Image
                  source={require("../assets/Bismilla.png")}
                  style={{
                    width: 65,
                    height: 65,
                    transform: [{ rotate: "90deg" }],
                    marginLeft: 0,
                  }}
                  resizeMode="contain"
                />
              </View>
            }
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: THEME.bg }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 65,
                marginBottom: 5,
                paddingHorizontal: 25,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  viewMode === "surah" && styles.toggleBtnActive,
                ]}
                onPress={() => setViewMode("surah")}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    viewMode === "surah" && styles.toggleBtnTextActive,
                  ]}
                >
                  {t('surahs')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  viewMode === "juz" && styles.toggleBtnActive,
                ]}
                onPress={() => setViewMode("juz")}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    viewMode === "juz" && styles.toggleBtnTextActive,
                  ]}
                >
                  {t('juz')}
                </Text>
              </TouchableOpacity>
            </View>

            {lastRead && (
              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  backgroundColor: THEME.surface,
                  marginHorizontal: 20,
                  marginBottom: 15,
                  padding: 15,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: THEME.gold,
                }}
                onPress={() => {
                  if (lastRead.type === "surah" || lastRead.type === "ayah")
                    loadSurah(lastRead.id, lastRead.targetAyah);
                  else loadJuz(lastRead.id);
                }}
              >
                <Ionicons name="book" size={24} color={THEME.gold} />
                <View style={{ marginLeft: 15 }}>
                  <Text
                    style={{
                      color: THEME.textMuted,
                      fontSize: 12,
                      textTransform: "uppercase",
                      fontWeight: "bold",
                      textAlign: "left",
                    }}
                  >
                    {t('continue_reading')}
                  </Text>
                  <Text
                    style={{ color: THEME.text, fontSize: 14, marginTop: 2, textAlign: "left" }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {lastRead.title.replace(/^[^\(]+/, match => t(match.trim()) + " ")}
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={20} color={THEME.gold} />
              </TouchableOpacity>
            )}
            <FlatList
              data={viewMode === "surah" ? surahs : juzs}
              keyExtractor={(item) =>
                viewMode === "surah"
                  ? item.number.toString()
                  : item.id.toString()
              }
              contentContainerStyle={{ paddingBottom: 50 }}
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                if (viewMode === "surah") {
                  return (
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() => loadSurah(item.number)}
                    >
                      <Octagram number={item.number} size={38} />
                      <View style={styles.listTextContainer}>
                        <Text style={[styles.listTitle, {textAlign: "left"}]}>{t(item.englishName)}</Text>
                        <Text style={[styles.listSubtitle, {textAlign: "left"}]}>
                          {item.revelationType === 'MECCAN' ? t('meccan') : t('medinan')} | {item.numberOfAyahs} {t('verses')}
                        </Text>
                      </View>
                      <Text
                        style={[styles.listArabic, { maxWidth: "40%" }]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() => loadJuz(item.id)}
                    >
                      <Octagram number={item.id} size={38} />
                      <View style={styles.listTextContainer}>
                        <Text style={[styles.listTitle, {textAlign: "left"}]}>{viewMode === "surah" ? t(item.englishName) : `${t("juz")} ${item.id}`}</Text>
                        <Text style={[styles.listSubtitle, {textAlign: "left"}]}>{t("part")} {item.id}</Text>
                      </View>
                      <Text
                        style={[styles.listArabic, { maxWidth: "40%" }]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        الجزء {toArabicNumber(item.id)}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              }}
            />
          </View>
        )}
      </View>

      <LinearGradient
        colors={[
          "rgba(12, 68, 82, 1)",
          "rgba(12, 68, 82, 1)",
          "rgba(12, 68, 82, 1)",
        ]}
        locations={[0, 0.7, 1]}
        style={styles.floatingHeader}
      >
        {selectedSurah ? (
          <View style={{ width: "100%" }}>
            <View
              style={[styles.headerRow, { justifyContent: "space-between" }]}
            >
              <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                <Ionicons name="chevron-back" size={28} color={THEME.text} />
                <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                  {(surahData?.englishName ? t(surahData.englishName) : "Loading...")}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.surahNavRow,
                {
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                  paddingBottom: 0,
                  flexDirection: "row",
                  alignItems: "center",
                  height: 44,
                },
              ]}
            >
              <TouchableOpacity
                style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6, paddingHorizontal: 2 }}
                onPress={() => {
                  if (selectedSurah < 114) loadSurah(selectedSurah + 1);
                }}
              >
                <Text
                  style={[
                    styles.surahNavText,
                    { fontSize: 13, color: "rgba(255, 255, 255, 0.6)", textAlign: "center", fontWeight: "500" },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {selectedSurah < 114 && surahs[selectedSurah]
                    ? `${selectedSurah + 1}. ${t(surahs[selectedSurah].englishName)}`
                    : ""}
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1.2, alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Text
                  style={[
                    styles.surahNavActiveText,
                    { textAlign: "center", fontSize: 15, color: THEME.gold, fontWeight: "bold" },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {`${selectedSurah}. ${t(surahData?.englishName || "")}`}
                </Text>
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 10,
                    right: 10,
                    height: 2,
                    backgroundColor: THEME.gold,
                    borderRadius: 1,
                  }}
                />
              </View>

              <TouchableOpacity
                style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6, paddingHorizontal: 2 }}
                onPress={() => {
                  if (selectedSurah > 1) loadSurah(selectedSurah - 1);
                }}
              >
                <Text
                  style={[
                    styles.surahNavText,
                    { fontSize: 13, color: "rgba(255, 255, 255, 0.6)", textAlign: "center", fontWeight: "500" },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {selectedSurah > 1 && surahs[selectedSurah - 2]
                    ? `${selectedSurah - 1}. ${t(surahs[selectedSurah - 2].englishName)}`
                    : ""}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : juzData ? (
          <View style={{ width: "100%" }}>
            <View
              style={[styles.headerRow, { justifyContent: "space-between" }]}
            >
              <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                <Ionicons name="chevron-back" size={28} color={THEME.text} />
                <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                  {t("juz")} {juzData.juz}
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.surahNavRow,
                {
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                  paddingBottom: 0,
                  flexDirection: "row",
                  alignItems: "center",
                  height: 44,
                },
              ]}
            >
              <TouchableOpacity
                style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6 }}
                onPress={() => {
                  if (juzData.juz < 30) loadJuz(juzData.juz + 1);
                }}
              >
                <Text
                  style={[
                    styles.surahNavText,
                    { fontSize: 15, color: "rgba(255, 255, 255, 0.6)", textAlign: "center", fontWeight: "500" },
                  ]}
                  numberOfLines={1}
                >
                  {juzData.juz < 30 ? `${t("juz")} ${juzData.juz + 1}` : ""}
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Text
                  style={[
                    styles.surahNavActiveText,
                    { textAlign: "center", fontSize: 16, color: THEME.gold, fontWeight: "bold" },
                  ]}
                  numberOfLines={1}
                >
                  {`${t("juz")} ${juzData.juz}`}
                </Text>
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 20,
                    right: 20,
                    height: 2,
                    backgroundColor: THEME.gold,
                    borderRadius: 1,
                  }}
                />
              </View>

              <TouchableOpacity
                style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6 }}
                onPress={() => {
                  if (juzData.juz > 1) loadJuz(juzData.juz - 1);
                }}
              >
                <Text
                  style={[
                    styles.surahNavText,
                    { fontSize: 15, color: "rgba(255, 255, 255, 0.6)", textAlign: "center", fontWeight: "500" },
                  ]}
                  numberOfLines={1}
                >
                  {juzData.juz > 1 ? `${t("juz")} ${juzData.juz - 1}` : ""}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
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
            <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
              {t('read_quran')}
            </Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  toggleBtnActive: { borderBottomColor: THEME.gold },
  toggleBtnText: { color: THEME.textMuted, fontSize: 16, fontWeight: "600" },
  toggleBtnTextActive: { color: THEME.gold },
  listBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  listBadgeText: { color: THEME.gold, fontWeight: "bold", fontSize: 16 },
  content: { flex: 1 },

  floatingHeader: {
    zIndex: 10,
    position: "absolute",
    top: 0,
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 50 : 50,
    backgroundColor: "#0c4452",
    borderBottomWidth: 1,
    borderBottomColor: "#1a505e",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 25,
    paddingBottom: 10,
  },
  headerBtn: { flexDirection: "row", alignItems: "center" },
  headerTitle: { color: THEME.text, fontSize: 18, fontWeight: "bold" },

  surahNavRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a505e",
    marginHorizontal: 0,
  },
  surahNavText: { color: "#ffffff", fontSize: 13 },
  surahNavActiveText: { color: THEME.gold, fontSize: 14, fontWeight: "bold" },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  listTextContainer: { flex: 1, marginLeft: 15 },
  listTitle: { color: THEME.text, fontSize: 17, fontWeight: "600" },
  listSubtitle: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listArabic: {
    color: THEME.text,
    fontSize: 20,
    flexShrink: 1,
    textAlign: "right",
  },

  starSquare: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: THEME.gold,
    borderRadius: 2,
  },
  starText: { color: THEME.accent, fontWeight: "bold" },

  bannerContainer: { paddingHorizontal: 25, marginBottom: 20 },
  bannerArabic: { color: THEME.text, fontSize: 20 },

  bismillahContainer: { alignItems: "center", marginBottom: 20 },
  bismillah: { color: THEME.text, fontSize: 26 },

  ayahRow: {
    flexDirection: "row",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  ayahLeft: { width: 50, alignItems: "center", paddingTop: 5 },
  ayahRight: { flex: 1 },
  ayahArabic: {
    color: THEME.text,
    fontSize: 32,
    textAlign: "right",
    marginBottom: 20,
    lineHeight: 50,
  },
  ayahEnglish: { color: "#d1d1d1", fontSize: 17, lineHeight: 26 },
});
