import os

quran_code = '''import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const THEME = {
  bg: '#0c4452',
  inputBg: '#346671',
  text: '#ffffff',
  active: '#275862',
};

export default function QuranScreen({ navigation }) {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/quran/surahs')
      .then(response => {
        setSurahs(response.data.surahs);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load surahs", error);
        setLoading(false);
      });
  }, []);

  const loadSurah = (surahNumber) => {
    setLoading(true);
    axios.get(http://127.0.0.1:8000/quran/surah/)
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

  const goBack = () => {
    setSelectedSurah(null);
    setSurahData(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {selectedSurah ? (
          <TouchableOpacity onPress={goBack} style={styles.headerRow}>
            <Ionicons name="arrow-back" size={28} color={THEME.text} />
            <Text style={styles.headerTitle}>{surahData?.englishName || "Loading..."}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Image source={require('../assets/custom_menu.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={THEME.text} style={{ marginTop: 50 }} />
        ) : selectedSurah && surahData ? (
          <ScrollView>
            <View style={styles.bismillahContainer}>
              <Text style={styles.bismillah}>?????? ??????? ????????????? ??????????</Text>
            </View>
            {surahData.ayahs.map((ayah, idx) => (
              <View key={idx} style={styles.ayahContainer}>
                <View style={styles.ayahNumberBadge}>
                  <Text style={styles.ayahNumberText}>{ayah.numberInSurah}</Text>
                </View>
                <Text style={styles.arabicText}>{ayah.arabic}</Text>
                <Text style={styles.englishText}>{ayah.english}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView>
            <Text style={styles.pageTitle}>The Noble Quran</Text>
            {surahs.map((surah) => (
              <TouchableOpacity key={surah.number} style={styles.listItem} onPress={() => loadSurah(surah.number)}>
                <View style={styles.listBadge}>
                  <Text style={styles.listBadgeText}>{surah.number}</Text>
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle}>{surah.englishName}</Text>
                  <Text style={styles.listSubtitle}>{surah.englishNameTranslation}</Text>
                </View>
                <Text style={styles.listArabic}>{surah.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { padding: 20, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: THEME.text, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  content: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { color: THEME.text, fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.inputBg, padding: 15, borderRadius: 15, marginBottom: 10 },
  listBadge: { backgroundColor: THEME.active, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  listBadgeText: { color: THEME.text, fontWeight: 'bold' },
  listTextContainer: { flex: 1, marginLeft: 15 },
  listTitle: { color: THEME.text, fontSize: 16, fontWeight: 'bold' },
  listSubtitle: { color: '#8baeb4', fontSize: 12 },
  listArabic: { color: THEME.text, fontSize: 18 },

  bismillahContainer: { paddingVertical: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#275862', marginBottom: 20 },
  bismillah: { color: THEME.text, fontSize: 24 },
  ayahContainer: { marginBottom: 30 },
  ayahNumberBadge: { alignSelf: 'flex-start', backgroundColor: THEME.active, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 10 },
  ayahNumberText: { color: THEME.text, fontWeight: 'bold', fontSize: 12 },
  arabicText: { color: THEME.text, fontSize: 24, textAlign: 'right', marginBottom: 10, lineHeight: 40 },
  englishText: { color: '#8baeb4', fontSize: 16, lineHeight: 24 }
});
'''

with open('screens/QuranScreen.js', 'w', encoding='utf-8') as f:
    f.write(quran_code)
