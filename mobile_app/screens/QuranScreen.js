import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, ImageBackground, Platform } from 'react-native';
import { SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';

const THEME = {
  bg: '#0c4452',
  surface: '#346671',
  text: '#ffffff',
  textMuted: '#8baeb4',
  accent: '#3ca59d',
  gold: '#cba153',
};

// Helper for Arabic numbers
const toArabicNumber = (num) => {
  const arabicNumbers = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(num).split('').map(c => arabicNumbers[Number(c)]).join('');
};

// 8-Pointed Star Component (Rub el Hizb)
const Octagram = ({ number, size = 32 }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.starSquare, { width: size-4, height: size-4, transform: [{ rotate: '0deg' }] }]} />
      <View style={[styles.starSquare, { width: size-4, height: size-4, transform: [{ rotate: '45deg' }] }]} />
      <Text style={[styles.starText, { fontSize: size * 0.35 }]}>{number}</Text>
    </View>
  );
};

export default function QuranScreen({ navigation }) {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([]);

  // Juz State
  const [viewMode, setViewMode] = useState('surah'); // 'surah' or 'juz'
  const [juzs, setJuzs] = useState([]);
  const [juzData, setJuzData] = useState(null);


  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem('bookmarks');
      if (stored) setBookmarks(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const toggleBookmark = async (ayah, surahName) => {
    try {
      // create a unique ID for the ayah
      const id = `quran_${ayah.number}`;
      const isBookmarked = bookmarks.some(b => b.id === id);
      let updatedBookmarks;

      if (isBookmarked) {
        updatedBookmarks = bookmarks.filter(b => b.id !== id);
      } else {
        const newBookmark = {
          id: id,
          title: `${surahName} - Ayah ${ayah.numberInSurah}`,
          arabic: ayah.arabic,
          english: ayah.english
        };
        updatedBookmarks = [...bookmarks, newBookmark];
      }

      await AsyncStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
      setBookmarks(updatedBookmarks);
    } catch (e) { console.error(e); }
  };

  const loadJuz = (juzNumber) => {
    setLoading(true);
    axios.get(`http://192.168.1.100:8000/quran/juz/${juzNumber}`)
      .then(response => {
        setJuzData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load Juz", error);
        setLoading(false);
      });
  };

  const loadSurah = (surahNumber) => {
    setLoading(true);
    axios.get('http://192.168.1.100:8000/quran/surah/' + surahNumber)
      .then(response => {
        setSurahData(response.data);
        setSelectedSurah(surahNumber);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load surah details", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBookmarks();
    axios.get('http://192.168.1.100:8000/quran/juzs').then(res => setJuzs(res.data.juzs)).catch(console.error);
    axios.get('http://192.168.1.100:8000/quran/surahs')
      .then(response => {
        setSurahs(response.data.surahs);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load surahs", error);
        setLoading(false);
      });
  }, []);

  const goBack = () => {
    setSelectedSurah(null);
    setSurahData(null);
    setJuzData(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={THEME.accent} style={{ marginTop: 120 }} />
        ) : juzData ? (
          <ScrollView style={StyleSheet.absoluteFillObject} contentContainerStyle={{ paddingTop: 120, paddingBottom: 50 }}>
            {juzData.ayahs.map((ayah, idx) => (
              <View key={idx}>
                {(ayah.numberInSurah === 1) && (
                  <>
                    <View style={[styles.bannerContainer, { alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: -10 }]}>
                      <ImageBackground 
                        source={require('../assets/Surant_name.png')} 
                        style={{ width: 300, height: 110, justifyContent: 'center', alignItems: 'center' }}
                        resizeMode="contain"
                      >
                        <Text style={[styles.bannerArabic, { fontSize: 30 }]} adjustsFontSizeToFit numberOfLines={1}>{ayah.surahNameArabic}</Text>
                      </ImageBackground>
                    </View>
                    {ayah.surahNumber !== 9 && (
                      <View style={[styles.bismillahContainer, { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: -10, direction: 'ltr', paddingHorizontal: 10 }]}>
                        <Image source={require('../assets/Bismilla.png')} style={{ width: 65, height: 65, transform: [{ rotate: '-90deg' }], marginRight: -15 }} resizeMode="contain" />
                        <Text style={[styles.bismillah, { fontSize: 28, textAlign: 'center', marginTop: -5, flexShrink: 1 }]} adjustsFontSizeToFit numberOfLines={1}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
                        <Image source={require('../assets/Bismilla.png')} style={{ width: 65, height: 65, transform: [{ rotate: '90deg' }], marginLeft: -15 }} resizeMode="contain" />
                      </View>
                    )}
                  </>
                )}
                <View style={styles.ayahRow}>
                  <View style={styles.ayahLeft}>
                    <Octagram number={ayah.numberInSurah} size={36} />
                    <TouchableOpacity style={{marginTop: 15}} onPress={() => toggleBookmark(ayah, ayah.surahNameEnglish)}>
                      <Ionicons name={bookmarks.some(b => b.id === `quran_${ayah.number}`) ? "bookmark" : "bookmark-outline"} size={22} color={THEME.gold} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.ayahRight}>
                    <Text style={styles.ayahArabic}>
                      {ayah.arabic} <Text style={{color: THEME.textMuted}}>{toArabicNumber(ayah.numberInSurah)}</Text>
                    </Text>
                    <Text style={styles.ayahEnglish}>{ayah.english}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : selectedSurah && surahData ? (
          <ScrollView
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={{ paddingTop: 120, paddingBottom: 50 }}
          >

            {/* Ornate Banner */}
            <View style={[styles.bannerContainer, { alignItems: 'center', justifyContent: 'center', marginTop: -20, marginBottom: -10 }]}>
              <ImageBackground
                source={require('../assets/Surant_name.png')}
                style={{ width: 380, height: 130, justifyContent: 'center', alignItems: 'center' }}
                resizeMode="contain"
              >
                <Text style={[styles.bannerArabic, { textAlign: 'center', width: '80%', paddingHorizontal: 10 }]} adjustsFontSizeToFit numberOfLines={1}>{surahData.name}</Text>
              </ImageBackground>
            </View>

            {surahData.number !== 1 && surahData.number !== 9 && selectedSurah !== 1 && selectedSurah !== 9 && (
              <View style={[styles.bismillahContainer, { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: -10, marginTop: -30, direction: 'ltr', paddingHorizontal: 10 }]}>
                <Image source={require('../assets/Bismilla.png')} style={{ width: 65, height: 65, transform: [{ rotate: '-90deg' }], marginRight: -6 }} resizeMode="contain" />
                <Text style={[styles.bismillah, { fontSize: 25, textAlign: 'center', marginTop: -5, flexShrink: 1 }]} adjustsFontSizeToFit numberOfLines={1}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
                <Image source={require('../assets/Bismilla.png')} style={{ width: 65, height: 65, transform: [{ rotate: '90deg' }], marginLeft: -6 }} resizeMode="contain" />
              </View>
            )}

            {surahData.ayahs.map((ayah, idx) => (
              <View key={idx} style={styles.ayahRow}>
                <View style={styles.ayahLeft}>
                  <Octagram number={ayah.numberInSurah} size={36} />
                  <TouchableOpacity style={{marginTop: 15}} onPress={() => toggleBookmark(ayah, surahData.englishName)}>
                    <Ionicons name={bookmarks.some(b => b.id === `quran_${ayah.number}`) ? "bookmark" : "bookmark-outline"} size={22} color={THEME.gold} />
                  </TouchableOpacity>
                </View>
                <View style={styles.ayahRight}>
                  {/* Arabic text with the ornate end symbol containing the arabic number */}
                  <Text style={styles.ayahArabic}>
                    {ayah.arabic} <Text style={{color: THEME.textMuted}}>{toArabicNumber(ayah.numberInSurah)}</Text>
                  </Text>
                  <Text style={styles.ayahEnglish}>{ayah.english}</Text>
                </View>
              </View>
            ))}
            {/* End Marker */}
            <View style={[styles.bismillahContainer, { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 0, marginBottom: -30, direction: 'ltr', paddingHorizontal: 10 }]}>
              <Image source={require('../assets/Bismilla.png')} style={{ width: 65, height: 65, transform: [{ rotate: '-90deg' }], marginRight: 0 }} resizeMode="contain" />
              <Text style={{ fontSize: 18, textAlign: 'center', color: THEME.textMuted, letterSpacing: 4, fontWeight: 'bold' }}>END</Text>
              <Image source={require('../assets/Bismilla.png')} style={{ width: 65, height: 65, transform: [{ rotate: '90deg' }], marginLeft: 0 }} resizeMode="contain" />
            </View>

          </ScrollView>
        ) : (
          <View style={StyleSheet.absoluteFillObject}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 120, marginBottom: 10, paddingHorizontal: 20 }}>
              <TouchableOpacity style={[styles.toggleBtn, viewMode === 'surah' && styles.toggleBtnActive]} onPress={() => setViewMode('surah')}>
                <Text style={[styles.toggleBtnText, viewMode === 'surah' && styles.toggleBtnTextActive]}>Surahs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, viewMode === 'juz' && styles.toggleBtnActive]} onPress={() => setViewMode('juz')}>
                <Text style={[styles.toggleBtnText, viewMode === 'juz' && styles.toggleBtnTextActive]}>Juz</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }}>
              {viewMode === 'surah' ? surahs.map((surah) => (
              <TouchableOpacity key={surah.number} style={styles.listItem} onPress={() => loadSurah(surah.number)}>
                <Octagram number={surah.number} size={38} />
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle}>{surah.englishName}</Text>
                  <Text style={styles.listSubtitle}>{surah.revelationType} | {surah.numberOfAyahs} VERSES</Text>
                </View>
                <Text style={[styles.listArabic, { maxWidth: '40%' }]} adjustsFontSizeToFit numberOfLines={1}>{surah.name}</Text>
              </TouchableOpacity>
            )) : juzs.map((juz) => (
              <TouchableOpacity key={juz.id} style={styles.listItem} onPress={() => loadJuz(juz.id)}>
                <Octagram number={juz.id} size={38} />
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle}>{juz.name}</Text>
                  <Text style={styles.listSubtitle}>PART {juz.id}</Text>
                </View>
                <Text style={[styles.listArabic, { maxWidth: '40%' }]} adjustsFontSizeToFit numberOfLines={1}>الجزء {toArabicNumber(juz.id)}</Text>
              </TouchableOpacity>
            ))}
            </ScrollView>
          </View>
        )}
      </View>

      <LinearGradient
        colors={['rgba(12, 68, 82, 1)', 'rgba(12, 68, 82, 1)', 'rgba(12, 68, 82, 1)']}
        locations={[0, 0.7, 1]}
        style={styles.floatingHeader}
      >
          {selectedSurah ? (
            <View style={{width: '100%'}}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                  <Ionicons name="chevron-back" size={28} color={THEME.text} />
                  <Text style={[styles.headerTitle, { marginLeft: 8 }]}>{surahData?.englishName || "Loading..."}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.surahNavRow, { justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 5 }]}>
                 <TouchableOpacity style={{flex: 1, alignItems: 'flex-start'}} onPress={() => { if(selectedSurah < 114) loadSurah(selectedSurah+1) }}>
                   <Text style={[styles.surahNavText, { fontSize: 12 }]} numberOfLines={1} ellipsizeMode="tail">
                     {selectedSurah < 114 && surahs[selectedSurah] ? "« " + surahs[selectedSurah].englishName : ''}
                   </Text>
                 </TouchableOpacity>

                 <View style={{flex: 1.2, alignItems: 'center'}}>
                   <Text style={[styles.surahNavActiveText, { textAlign: 'center', fontSize: 14 }]} numberOfLines={1} adjustsFontSizeToFit>
                     {selectedSurah}. {surahData?.englishName}
                   </Text>
                 </View>

                 <TouchableOpacity style={{flex: 1, alignItems: 'flex-end'}} onPress={() => { if(selectedSurah > 1) loadSurah(selectedSurah-1) }}>
                   <Text style={[styles.surahNavText, { fontSize: 12 }]} numberOfLines={1} ellipsizeMode="tail">
                     {selectedSurah > 1 && surahs[selectedSurah-2] ? surahs[selectedSurah-2].englishName + " »" : ''}
                   </Text>
                 </TouchableOpacity>
              </View>
            </View>
          ) : juzData ? (
            <View style={{width: '100%'}}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                  <Ionicons name="chevron-back" size={28} color={THEME.text} />
                  <Text style={[styles.headerTitle, { marginLeft: 8 }]}>Juz {juzData.juz}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.surahNavRow, { justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 5 }]}>
                 <TouchableOpacity style={{flex: 1, alignItems: 'flex-start'}} onPress={() => { if(juzData.juz < 30) loadJuz(juzData.juz+1) }}>
                   <Text style={[styles.surahNavText, { fontSize: 12 }]} numberOfLines={1} ellipsizeMode="tail">
                     {juzData.juz < 30 ? "Next: Juz " + (juzData.juz + 1) : ''}
                   </Text>
                 </TouchableOpacity>
                 <View style={{flex: 1.2, alignItems: 'center'}}>
                   <Text style={[styles.surahNavActiveText, { textAlign: 'center', fontSize: 14 }]} numberOfLines={1} adjustsFontSizeToFit>
                     Juz {juzData.juz}
                   </Text>
                 </View>
                 <TouchableOpacity style={{flex: 1, alignItems: 'flex-end'}} onPress={() => { if(juzData.juz > 1) loadJuz(juzData.juz-1) }}>
                   <Text style={[styles.surahNavText, { fontSize: 12 }]} numberOfLines={1} ellipsizeMode="tail">
                     {juzData.juz > 1 ? "Prev: Juz " + (juzData.juz - 1) : ''}
                   </Text>
                 </TouchableOpacity>
              </View>
            </View>
          ) : (
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={[styles.headerBtn, { backgroundColor: '#346671',width: 38, height: 38, borderRadius: 20 }]}>
              <Image source={require('../assets/custom_menu.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { marginLeft: 8 }]}>Read Qur'an</Text>
          </View>
        )}

      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  toggleBtnActive: { borderBottomColor: THEME.gold },
  toggleBtnText: { color: THEME.textMuted, fontSize: 16, fontWeight: '600' },
  toggleBtnTextActive: { color: THEME.gold },
  listBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.surface, justifyContent: 'center', alignItems: 'center' },
  listBadgeText: { color: THEME.gold, fontWeight: 'bold', fontSize: 16 },
  content: { flex: 1 },

  floatingHeader: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    backgroundColor: '#0c4452', borderBottomWidth: 1, borderBottomColor: '#1a505e',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  headerBtn: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: THEME.text, fontSize: 18, fontWeight: 'bold' },

  surahNavRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a505e', marginHorizontal: 0 },
  surahNavText: { color: '#ffffff', fontSize: 13 },
  surahNavActiveText: { color: THEME.gold, fontSize: 14, fontWeight: 'bold' },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#222'
  },
  listTextContainer: { flex: 1, marginLeft: 15 },
  listTitle: { color: THEME.text, fontSize: 17, fontWeight: '600' },
  listSubtitle: { color: THEME.textMuted, fontSize: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  listArabic: { color: THEME.text, fontSize: 20, flexShrink: 1, textAlign: 'right' },

  starSquare: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: THEME.gold,
    borderRadius: 2,
  },
  starText: { color: THEME.accent, fontWeight: 'bold' },

  bannerContainer: { paddingHorizontal: 20, marginBottom: 20 },
  bannerArabic: { color: THEME.text, fontSize: 20 },

  bismillahContainer: { alignItems: 'center', marginBottom: 20 },
  bismillah: { color: THEME.text, fontSize: 26 },

  ayahRow: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  ayahLeft: { width: 50, alignItems: 'flex-start', paddingTop: 5 },
  ayahRight: { flex: 1 },
  ayahArabic: { color: THEME.text, fontSize: 32, textAlign: 'right', marginBottom: 20, lineHeight: 50 },
  ayahEnglish: { color: '#d1d1d1', fontSize: 17, lineHeight: 26 },
});
