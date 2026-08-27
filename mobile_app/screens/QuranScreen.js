import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Alert,
  BackHandler,
  Keyboard,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getDatabase, queryDatabase } from "../utils/database";
import { SettingsContext } from "../utils/SettingsContext";
import { useFocusEffect } from "@react-navigation/native";

// ============================================================================
// ⚙️ EDITABLE SCROLL CONFIGURATION PARAMETERS (Adjust wait time & speed here)
// ============================================================================
export const SCROLL_CONFIG = {
  START_DELAY_MS: 1000,    // 👈 Time to wait (in ms) before auto-scrolling starts (e.g. 1000, 1500, 2000)
  STEP_INTERVAL_MS: 300,   // 👈 Interval (in ms) between scroll steps (Higher = slower scroll, Lower = faster scroll)
  STEP_SIZE: 5,            // 👈 Number of Ayahs to advance per step (e.g. 3, 5, 8)
  VIEW_OFFSET: 130,        // 👈 Top padding offset so verse is placed below the floating header
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
const Octagram = ({ number, size = 32, styles }) => {
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

// Top-level memoized Surah Page View (Prevents unmounting and scroll-to-top on state changes)
const SurahPageView = React.memo(({ THEME, styles, surahNumber,
    isCurrent,
    targetAyah,
    currentSurahData,
    fetchSurahDataAsync,
    scrollViewRef,
    lastRead,
    bookmarks,
    toggleBookmark,
    handlePinAyah,
    t,
    i18n,
    settings,
    SCREEN_WIDTH,
  }) => {
    const [localData, setLocalData] = useState(null);

    useEffect(() => {
      let isMounted = true;
      if (isCurrent && currentSurahData && currentSurahData.number === surahNumber) {
        setLocalData(currentSurahData);
        return;
      }

      const load = async () => {
         const fetched = await fetchSurahDataAsync(surahNumber);
         if (isMounted && fetched) {
            setLocalData(fetched);
         }
      };

      load();
      return () => { isMounted = false; };
    }, [surahNumber, isCurrent, currentSurahData, fetchSurahDataAsync]);

    const data = localData;

    const flatListRef = useRef(null);
    const hasAutoScrolled = useRef(false);

    // Keep parent's ref updated if current
    useEffect(() => {
      if (isCurrent && scrollViewRef) {
        scrollViewRef.current = flatListRef.current;
      }
    }, [isCurrent, scrollViewRef]);

    // Progressive Smooth Scroll to Pinned Ayah (One-time action per open)
    useEffect(() => {
      if (!isCurrent || !targetAyah || targetAyah <= 1 || !data?.ayahs?.length) return;
      if (hasAutoScrolled.current) return;
      hasAutoScrolled.current = true;

      const targetIdx = targetAyah - 1;
      let isMounted = true;
      let currentIdx = 0;
      let timerId = null;

      const step = () => {
        if (!isMounted || !flatListRef.current) return;
        currentIdx = Math.min(targetIdx, currentIdx + SCROLL_CONFIG.STEP_SIZE);

        try {
          flatListRef.current.scrollToIndex({
            index: currentIdx,
            animated: true,
            viewPosition: 0,
            viewOffset: SCROLL_CONFIG.VIEW_OFFSET,
          });
        } catch (e) {
          const offset = currentIdx * 160;
          flatListRef.current?.scrollToOffset({
            offset,
            animated: true,
          });
        }

        if (currentIdx < targetIdx && isMounted) {
          timerId = setTimeout(step, SCROLL_CONFIG.STEP_INTERVAL_MS);
        }
      };

      timerId = setTimeout(step, SCROLL_CONFIG.START_DELAY_MS);

      return () => {
        isMounted = false;
        if (timerId) clearTimeout(timerId);
      };
    }, [isCurrent, targetAyah, data]);

    if (!data) return null;

    return (
      <FlatList
        ref={flatListRef}
        data={data.ayahs}
        extraData={lastRead}
        keyExtractor={(item) => String(item.number)}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        style={{ width: SCREEN_WIDTH, height: "100%" }}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 50 }}
        onScrollToIndexFailed={(info) => {
          const offset = info.index * (info.averageItemLength || 160);
          flatListRef.current?.scrollToOffset({ offset, animated: true });
        }}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.bannerContainer,
                {
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -30,
                  marginBottom: -10,
                },
              ]}
            >
              <ImageBackground
                source={require("../assets/Surant_name.png")}
                style={{
                  width: 380,
                  height: 120,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                imageStyle={{ tintColor: THEME.gold }}
                resizeMode="contain"
              >
                <Text
                  style={[
                    styles.bannerArabic,
                    {
                      textAlign: "center",
                      width: "80%",
                      paddingHorizontal: 25,
                      fontSize: 20,
                    },
                  ]}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {data.name}
                </Text>
              </ImageBackground>
            </View>

            {data.number !== 1 && data.number !== 9 && (
              <View
                style={[
                  styles.bismillahContainer,
                  {
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: -10,
                    marginTop: -20,
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
                    marginLeft: -6,
                  }}
                  resizeMode="contain"
                />
              </View>
            )}
          </>
        }
        renderItem={({ item: ayah }) => {
          const isPinned =
            lastRead?.type === "ayah" &&
            lastRead?.id === data.number &&
            lastRead?.targetAyah === ayah.numberInSurah;
          const isBookmarked = bookmarks.some((b) => b.id === `quran_${ayah.number}`);

          return (
            <View style={styles.ayahRow}>
              <View style={styles.ayahLeft}>
                <Octagram styles={styles} number={ayah.numberInSurah} size={36} />
                <TouchableOpacity
                  style={{ marginTop: 15 }}
                  onPress={() => toggleBookmark(ayah, data.englishName)}
                >
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={22}
                    color={THEME.gold}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: 15 }}
                  onPress={() => handlePinAyah(ayah, data.englishName)}
                >
                  <Ionicons
                    name={isPinned ? "location" : "location-outline"}
                    size={26}
                    color={THEME.gold}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.ayahRight}>
                {settings?.showArabic !== false && (
                  <Text style={[styles.ayahArabic, {
                    fontSize: settings?.arabicFontSize || 32,
                    lineHeight: (settings?.arabicFontSize || 32) * 1.5,
                    fontFamily: settings?.arabicScript === "indoPak" ? "System" : undefined
                  }]}>
                    {ayah.arabic}{" "}
                    <Text style={{ color: THEME.textMuted }}>
                      {"\uFD3F"}
                      {toArabicNumber(ayah.numberInSurah)}
                      {"\uFD3E"}
                    </Text>
                  </Text>
                )}
                {settings?.showTranslation !== false && (
                  <Text style={[styles.ayahEnglish, { fontSize: settings?.translationFontSize || 17, lineHeight: (settings?.translationFontSize || 17) * 1.5 }]}>
                    {i18n.language === "ur"
                      ? ayah.urdu && ayah.urdu.trim() !== ""
                        ? ayah.urdu
                        : ayah.english
                      : ayah.english}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View
            style={{
              paddingVertical: 30,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
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
                marginHorizontal: 10,
                fontSize: 14,
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
    );
  }
);

// Top-level memoized Juz Page View (Prevents unmounting and scroll-to-top on state changes)
const JuzPageView = React.memo(({ THEME, styles, juzNumber,
    isCurrent,
    currentJuzData,
    fetchJuzDataAsync,
    lastRead,
    bookmarks,
    toggleBookmark,
    handlePinAyah,
    t,
    i18n,
    settings,
    SCREEN_WIDTH,
  }) => {
    const [localData, setLocalData] = useState(null);

    useEffect(() => {
      let isMounted = true;
      if (isCurrent && currentJuzData && currentJuzData.juz === juzNumber) {
        setLocalData(currentJuzData);
        return;
      }

      const load = async () => {
         const fetched = await fetchJuzDataAsync(juzNumber);
         if (isMounted && fetched) {
            setLocalData(fetched);
         }
      };

      load();
      return () => { isMounted = false; };
    }, [juzNumber, isCurrent, currentJuzData, fetchJuzDataAsync]);

    const data = localData;

    const flatListRef = useRef(null);

    if (!data) return null;

    return (
      <FlatList
        ref={flatListRef}
        data={data.ayahs}
        extraData={lastRead}
        keyExtractor={(item) => String(item.number)}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        style={{ width: SCREEN_WIDTH, height: "100%" }}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 50 }}
        renderItem={({ item: ayah }) => {
          const isPinned =
            lastRead?.type === "ayah" &&
            lastRead?.id === ayah.surahNumber &&
            lastRead?.targetAyah === ayah.numberInSurah;
          const isBookmarked = bookmarks.some((b) => b.id === `quran_${ayah.number}`);

          return (
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
                      imageStyle={{ tintColor: THEME.gold }}
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
                  <Octagram styles={styles} number={ayah.numberInSurah} size={36} />
                  <TouchableOpacity
                    style={{ marginTop: 15 }}
                    onPress={() => toggleBookmark(ayah, ayah.surahNameEnglish)}
                  >
                    <Ionicons
                      name={isBookmarked ? "bookmark" : "bookmark-outline"}
                      size={22}
                      color={THEME.gold}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ marginTop: 15 }}
                    onPress={() => handlePinAyah(ayah, ayah.surahNameEnglish)}
                  >
                    <Ionicons
                      name={isPinned ? "location" : "location-outline"}
                      size={26}
                      color={THEME.gold}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.ayahRight}>
                  {settings?.showArabic !== false && (
                    <Text style={[styles.ayahArabic, {
                      fontSize: settings?.arabicFontSize || 32,
                      lineHeight: (settings?.arabicFontSize || 32) * 1.5,
                      fontFamily: settings?.arabicScript === "indoPak" ? "System" : undefined
                    }]}>
                      {ayah.arabic}{" "}
                      <Text style={{ color: THEME.textMuted }}>
                        {"\uFD3F"}
                        {toArabicNumber(ayah.numberInSurah)}
                        {"\uFD3E"}
                      </Text>
                    </Text>
                  )}
                  {settings?.showTranslation !== false && (
                    <Text style={[styles.ayahEnglish, { fontSize: settings?.translationFontSize || 17, lineHeight: (settings?.translationFontSize || 17) * 1.5 }]}>
                      {i18n.language === "ur"
                        ? ayah.urdu && ayah.urdu.trim() !== ""
                          ? ayah.urdu
                          : ayah.english
                        : ayah.english}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
    );
  }
);

export default function QuranScreen({ navigation }) {
  const { themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  const styles = React.useMemo(() => getStyles(THEME), [THEME]);
  const { t, i18n } = useTranslation();
  const { settings } = React.useContext(SettingsContext);
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [targetScrollAyah, setTargetScrollAyah] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([]);

  // Juz State
  const [viewMode, setViewMode] = useState("surah"); // 'surah' or 'juz'
  const [juzs, setJuzs] = useState([]);
  const [juzData, setJuzData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (selectedSurah || juzData) {
          setSelectedSurah(null);
          setSurahData(null);
          setJuzData(null);
          setTargetScrollAyah(null);
          return true;
        }
        return false;
      };
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => backHandler.remove();
    }, [selectedSurah, juzData])
  );

  const [lastRead, setLastRead] = useState(null);
  const scrollViewRef = useRef(null);
  const targetSurahIdRef = useRef(null);
  const dbRef = useRef(null);

  const surahTabBarRef = useRef(null);
  const juzTabBarRef = useRef(null);

  const surahPagerRef = useRef(null);
  const juzPagerRef = useRef(null);
  const dirScrollRef = useRef(null);

  const TAB_WIDTH = Dimensions.get("window").width / 3;
  const SCREEN_WIDTH = Dimensions.get("window").width;

  const surahTabs = useMemo(() => {
    if (!surahs.length) return [];
    return [
      { id: 115, isDummy: true },
      ...[...surahs].reverse(),
      { id: 0, isDummy: true },
    ];
  }, [surahs]);

  const juzTabs = useMemo(() => {
    const list = [{ juz: 31, isDummy: true }];
    for (let i = 30; i >= 1; i--) {
      list.push({ juz: i, isDummy: false });
    }
    list.push({ juz: 0, isDummy: true });
    return list;
  }, []);

  useEffect(() => {
    if (selectedSurah && surahTabBarRef.current) {
      const targetX = (114 - selectedSurah) * TAB_WIDTH;
      surahTabBarRef.current.scrollTo({
        x: Math.max(0, targetX),
        animated: true,
      });
    }
  }, [selectedSurah]);

  useEffect(() => {
    if (juzData?.juz && juzTabBarRef.current) {
      const targetX = (30 - juzData.juz) * TAB_WIDTH;
      juzTabBarRef.current.scrollTo({
        x: Math.max(0, targetX),
        animated: true,
      });
    }
  }, [juzData?.juz]);

  const fetchSurahDataAsync = useCallback(
    async (surahNumber) => {
      if (!surahNumber || !dbRef.current) return null;
      try {
        const meta = await queryDatabase(
          dbRef.current,
          "SELECT * FROM surahs WHERE id = ?",
          [surahNumber]
        );
        if (!meta || !meta.length) return null;
        const ayahsList = await queryDatabase(
          dbRef.current,
          "SELECT * FROM ayahs WHERE surah_id = ? ORDER BY id ASC",
          [surahNumber]
        );
        return {
          number: meta[0].id,
          name: meta[0].name,
          englishName: meta[0].englishName,
          revelationType: meta[0].revelationType,
          numberOfAyahs: meta[0].numberOfAyahs,
          ayahs: ayahsList.map((a) => ({
            number: a.id,
            numberInSurah: a.numberInSurah,
            juz: a.juz,
            text: a.arabic,
            arabic: a.arabic,
            english: a.english,
            urdu: a.urdu,
          })),
        };
      } catch (e) {
        console.error("fetchSurahDataAsync error", e);
      }
      return null;
    },
    []
  );

  const fetchJuzDataAsync = useCallback(
    async (juzNumber) => {
      if (!juzNumber || !dbRef.current) return null;
      try {
        const rows = await queryDatabase(
          dbRef.current,
          "SELECT * FROM ayahs WHERE juz = ? ORDER BY id ASC",
          [juzNumber]
        );
        if (!rows || !rows.length) return null;
        return {
          juz: juzNumber,
          ayahs: rows.map((a) => {
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
          }),
        };
      } catch (e) {
        console.error("fetchJuzDataAsync error", e);
      }
      return null;
    },
    [surahs]
  );

  const loadLastRead = async () => {
    try {
      const stored = await AsyncStorage.getItem("lastRead");
      if (stored) {
        const parsed = JSON.parse(stored);
        setLastRead(parsed);
      }
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

  const handlePinAyah = useCallback(
    (ayah, surahName) => {
      const sNum = ayah.surahNumber || selectedSurah;
      const title = `${surahName} (Ayah ${ayah.numberInSurah})`;
      saveLastRead("ayah", sNum, title, ayah.numberInSurah);
    },
    [selectedSurah]
  );

  const toggleBookmark = useCallback(
    async (ayah, surahName) => {
      try {
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
    },
    [bookmarks]
  );

  const loadJuz = async (juzNumber) => {
    if (!juzNumber || !dbRef.current) return;
    try {
      setSelectedSurah(null);
      setSurahData(null);
      setTargetScrollAyah(null);
      const data = await fetchJuzDataAsync(juzNumber);
      if (data) {
        setJuzData(data);
        setLoading(false);
      }
      if (juzPagerRef.current) {
        try {
          juzPagerRef.current.scrollToIndex({
            index: Math.max(0, 30 - juzNumber),
            animated: false,
          });
        } catch (e) {}
      }
    } catch (e) {
      console.error("Failed to load Juz", e);
      setLoading(false);
    }
  };

  const loadSurah = async (surahNumber, targetAyah = null) => {
    if (!surahNumber || !dbRef.current) return;
    try {
      setJuzData(null);
      setSelectedSurah(surahNumber);
      setTargetScrollAyah(targetAyah);
      targetSurahIdRef.current = targetAyah ? surahNumber : null;
      const data = await fetchSurahDataAsync(surahNumber);
      if (data) {
        setSurahData(data);
        setLoading(false);
      }
      if (surahPagerRef.current) {
        try {
          surahPagerRef.current.scrollToIndex({
            index: Math.max(0, 114 - surahNumber),
            animated: false,
          });
        } catch (e) {}
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
        const juzList = Array.from({ length: 30 }, (_, i) => ({
          id: i + 1,
          name: `Juz ${i + 1}`,
        }));
        setJuzs(juzList);

        // Fetch Surahs
        const surahsData = await queryDatabase(
          db,
          "SELECT * FROM surahs ORDER BY id ASC"
        );
        setSurahs(surahsData.map((s) => ({ ...s, number: s.id })));

        setLoading(false);
      } catch (e) {
        console.error("DB Init Error:", e);
        setLoading(false);
      }
    };
    initDb();
  }, []);

  const surahsRTL = useMemo(
    () => Array.from({ length: 114 }, (_, i) => 114 - i),
    []
  );
  const juzsRTL = useMemo(
    () => Array.from({ length: 30 }, (_, i) => 30 - i),
    []
  );

  const renderLastReadBanner = () => {
    if (!lastRead) return null;
    return (
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
            {t("continue_reading")}
          </Text>
          <Text
            style={{
              color: THEME.text,
              fontSize: 14,
              marginTop: 2,
              textAlign: "left",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {lastRead.title.replace(/^[^\(]+/, (match) => t(match.trim()) + " ")}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-forward" size={20} color={THEME.gold} />
      </TouchableOpacity>
    );
  };

  const goBack = () => {
    setSelectedSurah(null);
    setSurahData(null);
    setJuzData(null);
    setTargetScrollAyah(null);
  };

  const memoizedSurahTabs = useMemo(() => {
    return surahTabs.map((s, idx) => {
      if (s.isDummy) {
        return (
          <View
            key={`dummy_${s.id}_${idx}`}
            style={{ width: TAB_WIDTH, height: 44 }}
          />
        );
      }
      return (
        <TouchableOpacity
          key={s.id}
          style={{
            width: TAB_WIDTH,
            paddingTop: 8,
            paddingBottom: 10,
            paddingHorizontal: 4,
            alignItems: "center",
            justifyContent: "center",
            height: 44,
            position: "relative",
          }}
          onPress={() => loadSurah(s.id)}
        >
          <Text
            style={{
              color: THEME.text,
              fontSize: 14,
              textAlign: "center",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {`${s.id}. ${t(s.englishName)}`}
          </Text>
        </TouchableOpacity>
      );
    });
  }, [surahTabs, loadSurah, t, TAB_WIDTH]);

  const memoizedJuzTabs = useMemo(() => {
    return juzTabs.map((item, idx) => {
      if (item.isDummy) {
        return (
          <View
            key={`dummy_juz_${item.juz}_${idx}`}
            style={{ width: TAB_WIDTH, height: 44 }}
          />
        );
      }
      return (
        <TouchableOpacity
          key={item.juz}
          style={{
            width: TAB_WIDTH,
            paddingTop: 8,
            paddingBottom: 10,
            paddingHorizontal: 4,
            alignItems: "center",
            justifyContent: "center",
            height: 44,
            position: "relative",
          }}
          onPress={() => loadJuz(item.juz)}
        >
          <Text
            style={{
              color: THEME.text,
              fontSize: 15,
              textAlign: "center",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {`${t("juz")} ${item.juz}`}
          </Text>
        </TouchableOpacity>
      );
    });
  }, [juzTabs, loadJuz, t, TAB_WIDTH]);

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
            ref={juzPagerRef}
            data={juzsRTL}
            keyExtractor={(item) => `juz_p_${item}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.max(0, 30 - juzData.juz)}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            windowSize={5}
            maxToRenderPerBatch={3}
            initialNumToRender={3}
            removeClippedSubviews={Platform.OS === "android"}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const targetTabX = (offsetX / SCREEN_WIDTH) * TAB_WIDTH;
              juzTabBarRef.current?.scrollTo({
                x: Math.max(0, targetTabX),
                animated: false,
              });
            }}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                juzPagerRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                });
              }, 100);
            }}
            onMomentumScrollEnd={async (e) => {
              const pageIndex = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              const newJuz = 30 - pageIndex;
              if (newJuz >= 1 && newJuz <= 30 && newJuz !== juzData?.juz) {
                const data = await fetchJuzDataAsync(newJuz);
                if (data) setJuzData(data);
              }
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, height: "100%" }}>
                <JuzPageView THEME={THEME} styles={styles} juzNumber={item}
                  isCurrent={item === juzData?.juz}
                  currentJuzData={juzData}
                  fetchJuzDataAsync={fetchJuzDataAsync}
                  lastRead={lastRead}
                  bookmarks={bookmarks}
                  toggleBookmark={toggleBookmark}
                  handlePinAyah={handlePinAyah}
                  t={t}
                  i18n={i18n}
                  settings={settings}
                  SCREEN_WIDTH={SCREEN_WIDTH}
                />
              </View>
            )}
            style={StyleSheet.absoluteFillObject}
          />
        ) : selectedSurah && surahData ? (
          <FlatList
            ref={surahPagerRef}
            data={surahsRTL}
            keyExtractor={(item) => `surah_p_${item}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.max(0, 114 - selectedSurah)}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            windowSize={5}
            maxToRenderPerBatch={3}
            initialNumToRender={3}
            removeClippedSubviews={Platform.OS === "android"}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const targetTabX = (offsetX / SCREEN_WIDTH) * TAB_WIDTH;
              surahTabBarRef.current?.scrollTo({
                x: Math.max(0, targetTabX),
                animated: false,
              });
            }}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                surahPagerRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                });
              }, 100);
            }}
            onMomentumScrollEnd={async (e) => {
              const pageIndex = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              const newSurah = 114 - pageIndex;
              if (
                newSurah >= 1 &&
                newSurah <= 114 &&
                newSurah !== selectedSurah
              ) {
                targetSurahIdRef.current = null;
                setSelectedSurah(newSurah);
                const data = await fetchSurahDataAsync(newSurah);
                if (data) setSurahData(data);
              }
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, height: "100%" }}>
                <SurahPageView THEME={THEME} styles={styles} surahNumber={item}
                  isCurrent={item === selectedSurah}
                  targetAyah={
                    item === selectedSurah && targetSurahIdRef.current === item
                      ? targetScrollAyah
                      : null
                  }
                  currentSurahData={surahData}
                  fetchSurahDataAsync={fetchSurahDataAsync}
                  scrollViewRef={scrollViewRef}
                  lastRead={lastRead}
                  bookmarks={bookmarks}
                  toggleBookmark={toggleBookmark}
                  handlePinAyah={handlePinAyah}
                  t={t}
                  i18n={i18n}
                  settings={settings}
                  SCREEN_WIDTH={SCREEN_WIDTH}
                />
              </View>
            )}
            style={StyleSheet.absoluteFillObject}
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
                onPress={() => {
                  setViewMode("surah");
                  dirScrollRef.current?.scrollTo({ x: 0, animated: true });
                }}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    viewMode === "surah" && styles.toggleBtnTextActive,
                  ]}
                >
                  {t("surahs")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  viewMode === "juz" && styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setViewMode("juz");
                  dirScrollRef.current?.scrollTo({
                    x: SCREEN_WIDTH,
                    animated: true,
                  });
                }}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    viewMode === "juz" && styles.toggleBtnTextActive,
                  ]}
                >
                  {t("juz")}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={dirScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const page = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                setViewMode(page === 0 ? "surah" : "juz");
              }}
              style={{ flex: 1 }}
            >
              {/* Page 0: Surahs Directory List */}
              <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                {renderLastReadBanner()}
                <FlatList
                  data={surahs}
                  keyExtractor={(item) => item.number.toString()}
                  contentContainerStyle={{ paddingBottom: 50 }}
                  style={{ flex: 1 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() => loadSurah(item.number)}
                    >
                      <Octagram styles={styles} number={item.number} size={38} />
                      <View style={styles.listTextContainer}>
                        <Text style={[styles.listTitle, { textAlign: "left" }]}>
                          {t(item.englishName)}
                        </Text>
                        <Text style={[styles.listSubtitle, { textAlign: "left" }]}>
                          {item.revelationType === "MECCAN"
                            ? t("meccan")
                            : t("medinan")}{" "}
                          | {item.numberOfAyahs} {t("verses")}
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
                  )}
                />
              </View>

              {/* Page 1: Juz Directory List */}
              <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                {renderLastReadBanner()}
                <FlatList
                  data={juzs}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 50 }}
                  style={{ flex: 1 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() => loadJuz(item.id)}
                    >
                      <Octagram styles={styles} number={item.id} size={38} />
                      <View style={styles.listTextContainer}>
                        <Text style={[styles.listTitle, { textAlign: "left" }]}>
                          {`${t("juz")} ${item.id}`}
                        </Text>
                        <Text style={[styles.listSubtitle, { textAlign: "left" }]}>
                          {t("part")} {item.id}
                        </Text>
                      </View>
                      <Text
                        style={[styles.listArabic, { maxWidth: "40%" }]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        الجزء {toArabicNumber(item.id)}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {(selectedSurah || juzData) ? (
        <View style={[styles.floatingHeader, { backgroundColor: THEME.bg, paddingTop: Platform.OS === "ios" ? 50 : 45, paddingBottom: 15 }]}>
          {selectedSurah ? (
          <View style={{ width: "100%", position: "relative" }}>
            <View
              style={[styles.headerRow, { justifyContent: "space-between" }]}
            >
              <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                <Ionicons name="chevron-back" size={28} color={THEME.text} />
                <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                  Surahs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10
                }}
              >
                <Ionicons name="settings-sharp" size={20} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: TAB_WIDTH,
                width: TAB_WIDTH,
                height: 44,
                backgroundColor: THEME.gold,
                zIndex: 0,
              }}
            />

            <ScrollView
              ref={surahTabBarRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: "center",
                height: 44,
              }}
              style={styles.surahNavRow}
            >
              {memoizedSurahTabs}
            </ScrollView>
          </View>
        ) : juzData ? (
          <View style={{ width: "100%", position: "relative" }}>
            <View
              style={[styles.headerRow, { justifyContent: "space-between" }]}
            >
              <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                <Ionicons name="chevron-back" size={28} color={THEME.text} />
                <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                  Juzs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10
                }}
              >
                <Ionicons name="settings-sharp" size={20} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: TAB_WIDTH,
                width: TAB_WIDTH,
                height: 44,
                backgroundColor: THEME.gold,
                zIndex: 0,
              }}
            />

            <ScrollView
              ref={juzTabBarRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: "center",
                height: 44,
              }}
              style={styles.surahNavRow}
            >
              {memoizedJuzTabs}
            </ScrollView>
          </View>
        ) : (
          <View style={[styles.headerRow, { justifyContent: "space-between", width: "100%" }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                {t("read_quran")}
              </Text>
            </View>
          </View>
        )}
        </View>
      ) : (
        <LinearGradient
          colors={[`rgba(${THEME.bgRgb}, 1)`, `rgba(${THEME.bgRgb}, 0.9)`, `rgba(${THEME.bgRgb}, 0)`]}
          locations={[0, 0.7, 1]}
          style={styles.floatingHeader}
        >
          {selectedSurah ? (
          <View style={{ width: "100%", position: "relative" }}>
            <View
              style={[styles.headerRow, { justifyContent: "space-between" }]}
            >
              <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                <Ionicons name="chevron-back" size={28} color={THEME.text} />
                <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                  Surahs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10
                }}
              >
                <Ionicons name="settings-sharp" size={20} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: TAB_WIDTH,
                width: TAB_WIDTH,
                height: 44,
                backgroundColor: THEME.gold,
                zIndex: 0,
              }}
            />

            <ScrollView
              ref={surahTabBarRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: "center",
                height: 44,
              }}
              style={styles.surahNavRow}
            >
              {memoizedSurahTabs}
            </ScrollView>
          </View>
        ) : juzData ? (
          <View style={{ width: "100%", position: "relative" }}>
            <View
              style={[styles.headerRow, { justifyContent: "space-between" }]}
            >
              <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                <Ionicons name="chevron-back" size={28} color={THEME.text} />
                <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                  Juzs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10
                }}
              >
                <Ionicons name="settings-sharp" size={20} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: TAB_WIDTH,
                width: TAB_WIDTH,
                height: 44,
                backgroundColor: THEME.gold,
                zIndex: 0,
              }}
            />

            <ScrollView
              ref={juzTabBarRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: "center",
                height: 44,
              }}
              style={styles.surahNavRow}
            >
              {memoizedJuzTabs}
            </ScrollView>
          </View>
        ) : (
          <View style={[styles.headerRow, { justifyContent: "space-between", width: "100%" }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              <Text style={[styles.headerTitle, { marginLeft: 8 }]}>
                {t("read_quran")}
              </Text>
            </View>
          </View>
        )}
        </LinearGradient>
      )}
    </SafeAreaView>
  );
}

const getStyles = (THEME) => StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
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

  floatingHeader: { zIndex: 10, position: "absolute", top: 0, width: "100%", paddingTop: Platform.OS === "ios" ? 50 : 50, backgroundColor: "transparent", borderBottomWidth: 0, borderBottomColor: "transparent" },
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
    borderBottomColor: THEME.inputBg,
    marginHorizontal: 0,
  },
  surahNavText: { color: THEME.text, fontSize: 13 },
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
    paddingTop: Platform.OS === "ios" ? 50 : 45,
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
