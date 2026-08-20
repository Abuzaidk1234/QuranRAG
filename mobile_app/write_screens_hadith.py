import os

hadith_code = '''import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const THEME = {
  bg: '#0c4452',
  inputBg: '#346671',
  text: '#ffffff',
  active: '#275862',
};

export default function HadithScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null); // {id, name}
  const [chapters, setChapters] = useState([]);
  
  const [selectedChapter, setSelectedChapter] = useState(null); // {id, name}
  const [hadiths, setHadiths] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch books
    axios.get('http://127.0.0.1:8000/hadiths/books')
      .then(response => {
        setBooks(response.data.books);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load books", error);
        setLoading(false);
      });
  }, []);

  const loadChapters = (book) => {
    setLoading(true);
    axios.get(http://127.0.0.1:8000/hadiths/)
      .then(response => {
        setChapters(response.data.chapters);
        setSelectedBook(book);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load chapters", error);
        setLoading(false);
      });
  };

  const loadHadiths = (chapter) => {
    setLoading(true);
    axios.get(http://127.0.0.1:8000/hadiths//)
      .then(response => {
        setHadiths(response.data.hadiths);
        setSelectedChapter(chapter);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load hadiths", error);
        setLoading(false);
      });
  };

  const goBack = () => {
    if (selectedChapter) {
      setSelectedChapter(null);
      setHadiths([]);
    } else if (selectedBook) {
      setSelectedBook(null);
      setChapters([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {selectedBook ? (
          <TouchableOpacity onPress={goBack} style={styles.headerRow}>
            <Ionicons name="arrow-back" size={28} color={THEME.text} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedChapter ? selectedChapter.english : selectedBook.name}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Image source={require('../assets/custom_menu.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={THEME.text} style={{ marginTop: 50 }} />
        ) : selectedChapter ? (
          // --- HADITH LIST VIEW ---
          <ScrollView>
            {hadiths.map((hadith, idx) => (
              <View key={idx} style={styles.hadithContainer}>
                <View style={styles.hadithHeader}>
                  <Text style={styles.hadithNumberText}>Hadith {hadith.idInBook}</Text>
                </View>
                <Text style={styles.arabicText}>{hadith.arabic}</Text>
                <Text style={styles.englishText}>{hadith.english.text}</Text>
              </View>
            ))}
          </ScrollView>
        ) : selectedBook ? (
          // --- CHAPTER LIST VIEW ---
          <ScrollView>
            <Text style={styles.pageTitle}>{selectedBook.name}</Text>
            {chapters.map((chapter) => (
              <TouchableOpacity key={chapter.id} style={styles.listItem} onPress={() => loadHadiths(chapter)}>
                <View style={styles.listBadge}>
                  <Text style={styles.listBadgeText}>{chapter.id}</Text>
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle}>{chapter.english}</Text>
                </View>
                <Text style={styles.listArabic}>{chapter.arabic}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          // --- BOOK LIST VIEW ---
          <ScrollView>
            <Text style={styles.pageTitle}>Hadith Collections</Text>
            {books.map((book, idx) => (
              <TouchableOpacity key={book.id} style={styles.listItem} onPress={() => loadChapters(book)}>
                <View style={styles.listBadge}>
                  <Text style={styles.listBadgeText}>{idx + 1}</Text>
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle}>{book.name}</Text>
                </View>
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
  headerTitle: { color: THEME.text, fontSize: 18, fontWeight: 'bold', marginLeft: 15, flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { color: THEME.text, fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  
  // List Styles
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.inputBg, padding: 15, borderRadius: 15, marginBottom: 10 },
  listBadge: { backgroundColor: THEME.active, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  listBadgeText: { color: THEME.text, fontWeight: 'bold' },
  listTextContainer: { flex: 1, marginLeft: 15, marginRight: 10 },
  listTitle: { color: THEME.text, fontSize: 16, fontWeight: 'bold' },
  listArabic: { color: THEME.text, fontSize: 18 },

  // Detail Styles
  hadithContainer: { marginBottom: 30, backgroundColor: THEME.inputBg, padding: 20, borderRadius: 15 },
  hadithHeader: { borderBottomWidth: 1, borderBottomColor: THEME.active, paddingBottom: 10, marginBottom: 15 },
  hadithNumberText: { color: THEME.text, fontWeight: 'bold', fontSize: 14 },
  arabicText: { color: THEME.text, fontSize: 22, textAlign: 'right', marginBottom: 15, lineHeight: 36 },
  englishText: { color: '#8baeb4', fontSize: 16, lineHeight: 24 }
});
'''

with open('screens/HadithScreen.js', 'w', encoding='utf-8') as f:
    f.write(hadith_code)
