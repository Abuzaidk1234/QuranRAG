import 'react-native-gesture-handler';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { SafeAreaView,  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal  } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import QuranScreen from './screens/QuranScreen';
import HadithScreen from './screens/HadithScreen';
import BookmarksScreen from './screens/BookmarksScreen';

const Drawer = createDrawerNavigator();
const THEME = {
  bg: '#0c4452',
  inputBg: '#346671',
  text: '#ffffff',
  active: '#275862',
  userBubble: '#1b5b69',
  aiBubble: '#08333e'
};

// --- Context ---
const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const stored = await AsyncStorage.getItem('chat_sessions_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSessions(parsed);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    };
    loadSessions();
  }, []);

  const saveSessions = async (newSessions) => {
    setSessions(newSessions);
    await AsyncStorage.setItem('chat_sessions_v2', JSON.stringify(newSessions));
  };

  const createNewSession = () => {
    setCurrentSessionId(null);
  };

  const switchSession = (id) => {
    setCurrentSessionId(id);
  };

  const updateSessionMessages = (newMessages) => {
    if (!currentSessionId) {
      const newId = Date.now().toString();
      const firstUserMsg = newMessages.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.text.slice(0, 30) + '...' : 'New Chat';
      const newSession = { id: newId, title, messages: newMessages };

      setCurrentSessionId(newId);
      saveSessions([newSession, ...sessions]);
    } else {
      const updatedSessions = sessions.map(s =>
        s.id === currentSessionId ? { ...s, messages: newMessages } : s
      );
      saveSessions(updatedSessions);
    }
  };

  return (
    <ChatContext.Provider value={{ sessions, currentSessionId, createNewSession, switchSession, updateSessionMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

// --- Custom Sidebar (Drawer) ---
function CustomDrawerContent(props) {
  const activeRoute = props.state.routeNames[props.state.index];
  const { sessions, currentSessionId, switchSession, createNewSession } = useContext(ChatContext);

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg, padding: 10 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header - tapping it goes back Home */}
        <TouchableOpacity style={styles.drawerHeader} onPress={() => props.navigation.navigate('Home')}>
          <Image source={require('./assets/custom_menu.png')} style={{ width: 40, height: 40, marginRight: 15 }} resizeMode="contain" />
          <Text style={styles.drawerTitle}>XYZ</Text>
        </TouchableOpacity>

        {/* Nav Items - Dynamic Styling based on active route */}
        <TouchableOpacity
          style={activeRoute === 'ReadQuran' ? styles.drawerItemActive : styles.drawerItem}
          onPress={() => props.navigation.navigate('ReadQuran')}
        >
          <FontAwesome5 name="quran" size={18} color={THEME.text} style={styles.drawerIcon} />
          <Text style={styles.drawerItemText}>Read Quran</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={activeRoute === 'ReadHadiths' ? styles.drawerItemActive : styles.drawerItem}
          onPress={() => props.navigation.navigate('ReadHadiths')}
        >
          <FontAwesome5 name="book-open" size={18} color={THEME.text} style={styles.drawerIcon} />
          <Text style={styles.drawerItemText}>Read Hadiths</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={activeRoute === 'Bookmarks' ? styles.drawerItemActive : styles.drawerItem}
          onPress={() => props.navigation.navigate('Bookmarks')}
        >
          <Ionicons name="bookmark" size={18} color={THEME.text} style={styles.drawerIcon} />
          <Text style={styles.drawerItemText}>Bookmarks</Text>
        </TouchableOpacity>

        {/* Recent Chats Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Ionicons name="chatbubble" size={18} color={THEME.text} style={styles.drawerIcon}/>
            <Text style={styles.recentTitle}>Recent Chats</Text>
            <TouchableOpacity onPress={() => { createNewSession(); props.navigation.navigate('Home'); props.navigation.closeDrawer(); }}>
              <Ionicons name="add" size={24} color={THEME.text} style={{marginLeft: 20}}/>
            </TouchableOpacity>
          </View>
          <ScrollView style={{maxHeight: 300}}>
            {sessions.map(s => (
              <TouchableOpacity key={s.id} onPress={() => { switchSession(s.id); props.navigation.navigate('Home'); props.navigation.closeDrawer(); }}>
                <Text
                  style={[styles.recentItem, currentSessionId === s.id && { color: '#5E9ED6', fontWeight: 'bold' }]}
                  numberOfLines={1}
                >
                  {s.title}
                </Text>
              </TouchableOpacity>
            ))}
            {sessions.length === 0 && <Text style={[styles.recentItem, {opacity: 0.5}]}>No recent chats</Text>}
          </ScrollView>
        </View>

        <View style={{ flex: 1 }} />

        {/* Footer */}
        <View style={styles.drawerFooter}>
          <Ionicons name="person-circle" size={32} color={THEME.text} />
          <Text style={styles.drawerTitle}>XYZ</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="settings-sharp" size={24} color={THEME.text} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// --- Placeholder Screen for Routing ---
function PlaceholderScreen({ route, navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={[styles.headerBtn, { backgroundColor: '#346671', width: 38, height: 38, borderRadius: 18 }]}>
          <Image source={require('./assets/custom_menu.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
        </TouchableOpacity>
      </View>
      <View style={styles.centerContent}>
        <Text style={{ color: THEME.text, fontSize: 24, fontWeight: 'bold' }}>{route.name}</Text>
        <Text style={{ color: THEME.text, opacity: 0.7, marginTop: 10 }}>This page is coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}



// --- Shared Components ---
const FormattedText = ({ text, style }) => {
  if (!text) return null;
  // Split by bold (**text**) or italic (*text*)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={index} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Text>;
        } else if (part.startsWith('*') && part.endsWith('*')) {
          return <Text key={index} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
        }
        return part;
      })}
    </Text>
  );
};

const SearchInputBar = ({
  filterModalVisible,
  setFilterModalVisible,
  activeFilter,
  setActiveFilter,
  query,
  setQuery,
  messagesLength,
  sendMessage,
  isLoading
}) => (
  <View style={{ width: '100%', maxWidth: 600, position: 'relative' }}>
    {/* Small Inline Popup Menu */}
    {filterModalVisible && (
      <View style={styles.inlineFilterPopup}>
        <TouchableOpacity style={styles.inlineFilterOption} onPress={() => { setActiveFilter('all'); setFilterModalVisible(false); }}>
          <Ionicons name="apps-outline" size={16} color={activeFilter === 'all' ? '#5E9ED6' : THEME.text} style={{marginRight: 10, opacity: activeFilter === 'all' ? 1 : 0.7}} />
          <Text style={[styles.inlineFilterOptionText, activeFilter === 'all' && styles.inlineFilterOptionTextActive]}>Everything</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inlineFilterOption} onPress={() => { setActiveFilter('quran'); setFilterModalVisible(false); }}>
          <FontAwesome5 name="quran" size={14} color={activeFilter === 'quran' ? '#5E9ED6' : THEME.text} style={{marginRight: 10, opacity: activeFilter === 'quran' ? 1 : 0.7}} />
          <Text style={[styles.inlineFilterOptionText, activeFilter === 'quran' && styles.inlineFilterOptionTextActive]}>Quran Only</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inlineFilterOption} onPress={() => { setActiveFilter('hadith'); setFilterModalVisible(false); }}>
          <FontAwesome5 name="book" size={14} color={activeFilter === 'hadith' ? '#5E9ED6' : THEME.text} style={{marginRight: 10, opacity: activeFilter === 'hadith' ? 1 : 0.7}} />
          <Text style={[styles.inlineFilterOptionText, activeFilter === 'hadith' && styles.inlineFilterOptionTextActive]}>Hadith Only</Text>
        </TouchableOpacity>
      </View>
    )}

    <View style={styles.searchContainer}>
      <TouchableOpacity onPress={() => setFilterModalVisible(!filterModalVisible)} style={styles.modeIndicator}>
        <Text style={[styles.plusIcon, activeFilter !== 'all' && { color: '#5E9ED6' }]}>+</Text>
        {activeFilter !== 'all' && (
          <Text style={styles.modeIndicatorText}>
            {activeFilter === 'quran' ? 'Quran Only' : 'Hadith Only'}
          </Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={[styles.searchInput, { minHeight: 24, maxHeight: 100 }]}
        placeholder={messagesLength === 0 ? "Ask anything" : "Reply..."}
        placeholderTextColor="#8baeb4"
        value={query}
        onChangeText={setQuery}
        multiline={true}
      />
      <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={isLoading}>
        <Ionicons name="arrow-forward" size={24} color={THEME.text} />
      </TouchableOpacity>
    </View>
  </View>
);

// --- Main Chat Screen ---
function HomeScreen({ navigation }) {
  const { sessions, currentSessionId, updateSessionMessages } = useContext(ChatContext);

  // Derive current messages
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'quran', 'hadith'

  // Modal state
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [currentSources, setCurrentSources] = useState([]);

  // Filter Modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const sendMessage = async () => {
    if (!query.trim()) return;
    const userText = query.trim();
    setQuery('');

    // Capture history before we add the new message
    const currentHistory = messages.slice(-6);

    // Create new array to immediately reflect user message
    const newMessages = [...messages, { role: 'user', text: userText }];
    updateSessionMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await axios.post('http://192.168.1.100:8000/chat', {
        query: userText,
        provider: 'groq',
        filter: activeFilter,
        history: currentHistory
      });

      let finalAnswer = response.data.answer;
      finalAnswer = finalAnswer.replace(/<think>[\s\S]*?<\/think>/g, '').split('<think>')[0].trim();

      updateSessionMessages([...newMessages, { role: 'ai', text: finalAnswer, sources: response.data.sources }]);
    } catch (error) {
      console.error(error);
      updateSessionMessages([...newMessages, { role: 'ai', text: "Connection error. Make sure your FastAPI server is running on port 8000!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    alert('Copied to clipboard!');
  };

  const showSources = (sources) => {
    if (!sources || sources.length === 0) {
      alert('No sources found for this response.');
      return;
    }
    setCurrentSources(sources);
    setSourcesModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {messages.length === 0 ? (
        // --- Landing Page View ---
        <View style={{ flex: 1 }}>
          {/* Top Bar (Non-floating) */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}><View style={{ position: 'absolute', backgroundColor: '#346671', width: 38, height: 38, borderRadius: 19 }} /><Image source={require('./assets/custom_menu.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.greeting}>As-Salamu Alaykum</Text>

          <SearchInputBar
            filterModalVisible={filterModalVisible}
            setFilterModalVisible={setFilterModalVisible}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            query={query}
            setQuery={setQuery}
            messagesLength={messages.length}
            sendMessage={sendMessage}
            isLoading={isLoading}
          />

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'quran' && styles.filterPillActive]}
              onPress={() => setActiveFilter(activeFilter === 'quran' ? 'all' : 'quran')}
            >
              <FontAwesome5 name="quran" size={14} color={THEME.text} />
              <Text style={styles.filterText}>Quran specific questions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'hadith' && styles.filterPillActive]}
              onPress={() => setActiveFilter(activeFilter === 'hadith' ? 'all' : 'hadith')}
            >
              <FontAwesome5 name="book" size={14} color={THEME.text} />
              <Text style={styles.filterText}>Hadith specific questions</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        // --- Active Chat View ---
        // --- Active Chat View ---
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* ScrollView is absolutely positioned to underlap everything */}
          <ScrollView
            style={{ ...StyleSheet.absoluteFillObject }}
            contentContainerStyle={{ paddingTop: 80, paddingBottom: 110, paddingHorizontal: 20 }}
          >
            {messages.map((msg, idx) => {
              if (msg.role === 'user') {
                return (
                  <View key={idx} style={styles.userBubble}>
                    <Text style={styles.bubbleText}>{msg.text}</Text>
                  </View>
                );
              } else {
                return (
                  <View key={idx} style={styles.aiContainer}>
                    <Text style={styles.aiText}>{msg.text}</Text>
                    {/* Action Icons Row */}
                    <View style={styles.aiActionRow}>
                      <TouchableOpacity style={styles.actionIcon} onPress={() => showSources(msg.sources)}>
                        <Ionicons name="library-outline" size={16} color="#8baeb4" />
                        <Text style={styles.actionText}>Sources</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIcon} onPress={() => copyToClipboard(msg.text)}>
                        <Ionicons name="copy-outline" size={16} color="#8baeb4" />
                        <Text style={styles.actionText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
            })}
            {isLoading && <ActivityIndicator color={THEME.text} style={{ marginVertical: 20 }} />}
          </ScrollView>

          {/* Floating Top Header */}
          <LinearGradient
            colors={['rgba(12, 68, 82, 1)', 'rgba(12, 68, 82, 0.8)', 'rgba(12, 68, 82, 0)']}
            style={styles.floatingHeader}
          >
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}><View style={{ position: 'absolute', backgroundColor: '#346671', width: 36, height: 36, borderRadius: 18 }} /><Image source={require('./assets/custom_menu.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Floating Bottom Footer (Keyboard avoiding) */}
          <View style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <LinearGradient
              colors={['rgba(12, 68, 82, 0)', 'rgba(12, 68, 82, 0.9)', 'rgba(12, 68, 82, 1)', 'rgba(12, 68, 82, 1)']}
              locations={[0, 0.3, 0.5, 1]}
              style={styles.floatingFooter}
            >
              <SearchInputBar
                filterModalVisible={filterModalVisible}
                setFilterModalVisible={setFilterModalVisible}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                query={query}
                setQuery={setQuery}
                messagesLength={messages.length}
                sendMessage={sendMessage}
                isLoading={isLoading}
              />
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      )}
      {/* Sources Modal */}
      <Modal visible={sourcesModalVisible} transparent={true} animationType="slide" onRequestClose={() => setSourcesModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>References & Sources</Text>
              <TouchableOpacity onPress={() => setSourcesModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {currentSources.map((src, idx) => (
                <View key={idx} style={styles.sourceItem}>
                  <Text style={styles.sourceTitle}>
                    {src.source === 'Quran'
                      ? `Surah ${src.metadata.surah}, Ayah ${src.metadata.ayah}`
                      : `${src.metadata.book || 'Hadith'} - No. ${src.metadata.idInBook || src.metadata.number || 'Unknown'}`}
                  </Text>
                  <Text style={styles.sourceText}>{src.content}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- App Root ---
export default function App() {
  let [fontsLoaded] = useFonts({ GreatVibes_400Regular });

  if (!fontsLoaded) return null;

  return (
    <ChatProvider>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: { backgroundColor: THEME.bg, width: 280 }
          }}
        >
          <Drawer.Screen name="Home" component={HomeScreen} />
          <Drawer.Screen name="ReadQuran" component={QuranScreen} />
          <Drawer.Screen name="ReadHadiths" component={HadithScreen} />
          <Drawer.Screen name="Bookmarks" component={BookmarksScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </ChatProvider>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 45, flexDirection: 'row', alignItems: 'center' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  greeting: { fontFamily: 'GreatVibes_400Regular', fontSize: 45, color: THEME.text, marginBottom: 40, textAlign: 'center' },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.inputBg,
    borderRadius: 30,
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  searchInput: { flex: 1, color: THEME.text, fontSize: 16, outlineStyle: 'none' },
  sendButton: { padding: 5 },
  filtersContainer: { marginTop: 20, alignItems: 'flex-start' },
  filterPill: { flexDirection: 'row', alignItems: 'center', marginVertical: 5, padding: 8, borderRadius: 20 },
  filterPillActive: { backgroundColor: THEME.active },
  filterText: { color: THEME.text, fontWeight: 'bold', marginLeft: 10 },

  // Chat View Styles
  chatArea: { flex: 1 },
  userBubble: { backgroundColor: THEME.userBubble, alignSelf: 'flex-end', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, maxWidth: '80%', marginBottom: 20 },
  bubbleText: { color: THEME.text, fontSize: 16, lineHeight: 24 },

  aiContainer: { alignSelf: 'flex-start', maxWidth: '95%', marginBottom: 25, paddingHorizontal: 5 },
  aiText: { color: THEME.text, fontSize: 16, lineHeight: 26 },
  aiActionRow: { flexDirection: 'row', marginTop: 12 },
  actionIcon: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { color: '#8baeb4', marginLeft: 6, fontSize: 14, fontWeight: '600' },

  floatingHeader: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 45, // push down slightly for safe area
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  floatingFooter: {
    width: '100%',
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  bottomSearchContainer: { padding: 15, backgroundColor: THEME.bg, alignItems: 'center' },

  // Search Input Additions
  modeIndicator: { flexDirection: 'row', alignItems: 'center', marginRight: 10, justifyContent: 'center' },
  modeIndicatorText: { color: '#5E9ED6', fontWeight: 'bold', fontSize: 16, marginLeft: 5 },
  plusIcon: { color: THEME.text, fontSize: 22, fontWeight: 'bold', marginTop: -2 }, // Removed lineHeight and adjusted top margin for perfect center alignment

  inlineFilterPopup: {
    position: 'absolute',
    bottom: 75,
    left: 35, // Pushed slightly right to align with text
    backgroundColor: THEME.inputBg,
    borderRadius: 15,
    padding: 10,
    width: 170, // Slightly wider to fit icons
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  inlineFilterOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  inlineFilterOptionText: { color: THEME.text, fontSize: 16, opacity: 0.8 },
  inlineFilterOptionTextActive: { opacity: 1, fontWeight: 'bold', color: '#5E9ED6' },

  // Drawer Styles
  drawerHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 15 },
  drawerTitle: { color: THEME.text, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 10 },
  drawerItemActive: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 10, backgroundColor: THEME.active },
  drawerIcon: { width: 30, textAlign: 'center' },
  drawerItemText: { color: THEME.text, fontSize: 16, fontWeight: '600' },
  recentSection: { marginTop: 40, paddingHorizontal: 15 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  recentTitle: { color: THEME.text, fontSize: 16, fontWeight: 'bold' },
  recentItem: { color: THEME.text, fontSize: 14, marginVertical: 10, opacity: 0.9 },
  drawerFooter: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 15, borderTopWidth: 1, borderColor: '#195563' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: THEME.bg, width: '90%', maxHeight: '80%', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { color: THEME.text, fontSize: 20, fontWeight: 'bold' },
  sourceItem: { backgroundColor: THEME.inputBg, padding: 15, borderRadius: 10, marginBottom: 15 },
  sourceTitle: { color: THEME.text, fontWeight: 'bold', marginBottom: 5 },
  sourceText: { color: THEME.text, opacity: 0.9, lineHeight: 22 },
  filterOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: THEME.inputBg },
  filterOptionText: { color: THEME.text, fontSize: 18, opacity: 0.7 },
  filterOptionTextActive: { opacity: 1, fontWeight: 'bold', color: '#68b2c2' }
});
