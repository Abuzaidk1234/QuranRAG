import "react-native-gesture-handler";
import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Modal,
  Dimensions,
} from "react-native";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import {
  useFonts,
  GreatVibes_400Regular,
} from "@expo-google-fonts/great-vibes";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import QuranScreen from "./screens/QuranScreen";
import HadithScreen from "./screens/HadithScreen";
import BookmarksScreen from "./screens/BookmarksScreen";
import "./i18n";
import { useTranslation } from "react-i18next";
import SettingsScreen from "./screens/SettingsScreen";

const Drawer = createDrawerNavigator();
// --- Context ---
const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const stored = await AsyncStorage.getItem("chat_sessions_v2");
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
    await AsyncStorage.setItem("chat_sessions_v2", JSON.stringify(newSessions));
  };

  const createNewSession = () => {
    setCurrentSessionId(null);
  };

  const switchSession = (id) => {
    setCurrentSessionId(id);
  };

  const deleteSession = (id) => {
    const updatedSessions = sessions.filter((s) => s.id !== id);
    saveSessions(updatedSessions);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const updateSessionMessages = (newMessages) => {
    if (!currentSessionId) {
      const newId = Date.now().toString();
      const firstUserMsg = newMessages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.text.slice(0, 30) + "..."
        : "New Chat";
      const newSession = { id: newId, title, messages: newMessages };

      setCurrentSessionId(newId);
      saveSessions([newSession, ...sessions]);
    } else {
      const updatedSessions = sessions.map((s) =>
        s.id === currentSessionId ? { ...s, messages: newMessages } : s,
      );
      saveSessions(updatedSessions);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSessionId,
        createNewSession,
        switchSession,
        deleteSession,
        updateSessionMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// --- Custom Sidebar (Drawer) ---
function CustomDrawerContent(props) {
  const { settings, themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  const styles = React.useMemo(() => getStyles(THEME), [THEME]);
  const { t } = useTranslation();
  const activeRoute = props.state.routeNames[props.state.index];
  const {
    sessions,
    currentSessionId,
    switchSession,
    deleteSession,
    createNewSession,
  } = useContext(ChatContext);

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg, padding: 10 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header - tapping it goes back Home */}
        <TouchableOpacity
          style={styles.drawerHeader}
          onPress={() => props.navigation.navigate("Home")}
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
                  source={require('./assets/custom_menu.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode='contain'
                />
              </View>

          <Text style={styles.drawerTitle}>{t("app_name")}</Text>
        </TouchableOpacity>

        {/* Nav Items - Dynamic Styling based on active route */}
        <TouchableOpacity
          style={
            activeRoute === "ReadQuran"
              ? styles.drawerItemActive
              : styles.drawerItem
          }
          onPress={() => props.navigation.navigate("ReadQuran")}
        >
          <FontAwesome5
            name="quran"
            size={18}
            color={THEME.text}
            style={styles.drawerIcon}
          />
          <Text style={styles.drawerItemText}>{t("read_quran")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            activeRoute === "ReadHadiths"
              ? styles.drawerItemActive
              : styles.drawerItem
          }
          onPress={() => props.navigation.navigate("ReadHadiths")}
        >
          <FontAwesome5
            name="book-open"
            size={18}
            color={THEME.text}
            style={styles.drawerIcon}
          />
          <Text style={styles.drawerItemText}>{t("read_hadiths")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            activeRoute === "Bookmarks"
              ? styles.drawerItemActive
              : styles.drawerItem
          }
          onPress={() => props.navigation.navigate("Bookmarks")}
        >
          <Ionicons
            name="bookmark"
            size={18}
            color={THEME.text}
            style={styles.drawerIcon}
          />
          <Text style={styles.drawerItemText}>{t("bookmarks")}</Text>
        </TouchableOpacity>

        {/* Recent Chats Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Ionicons
              name="chatbubble"
              size={18}
              color={THEME.text}
              style={styles.drawerIcon}
            />
            <Text style={styles.recentTitle}>{t("recent_chats")}</Text>
            <TouchableOpacity
              onPress={() => {
                createNewSession();
                props.navigation.navigate("Home");
                props.navigation.closeDrawer();
              }}
            >
              <Ionicons
                name="add"
                size={24}
                color={THEME.text}
                style={{ marginLeft: 20 }}
              />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {sessions.map((s) => (
              <View
                key={s.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginVertical: 4,
                }}
              >
                <TouchableOpacity
                  style={{ flex: 1, paddingRight: 10 }}
                  onPress={() => {
                    switchSession(s.id);
                    props.navigation.navigate("Home");
                    props.navigation.closeDrawer();
                  }}
                >
                  <Text
                    style={[
                      styles.recentItem,
                      { marginVertical: 6 },
                      currentSessionId === s.id && {
                        color: "#5E9ED6",
                        fontWeight: "bold",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {s.title}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteSession(s.id)}
                  style={{ padding: 8, opacity: 0.8 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#d9534f" />
                </TouchableOpacity>
              </View>
            ))}
            {sessions.length === 0 && (
              <Text style={[styles.recentItem, { opacity: 0.5 }]}>
                No recent chats
              </Text>
            )}
          </ScrollView>
        </View>

        <View style={{ flex: 1 }} />

        {/* Footer */}
        <View style={styles.drawerFooter}>
          <Ionicons name="person-circle" size={32} color={THEME.text} />
          <Text style={styles.drawerTitle}>{t("guest_user")}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => props.navigation.navigate("Settings")}>
            <Ionicons name="settings-sharp" size={24} color={THEME.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// --- Placeholder Screen for Routing ---
function PlaceholderScreen({ route, navigation }) {
  const { settings, themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  const styles = React.useMemo(() => getStyles(THEME), [THEME]);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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
                  source={require('./assets/custom_menu.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode='contain'
                />
              </View>

        </TouchableOpacity>
      </View>
      <View style={styles.centerContent}>
        <Text style={{ color: THEME.text, fontSize: 24, fontWeight: "bold" }}>
          {route.name}
        </Text>
        <Text style={{ color: THEME.text, opacity: 0.7, marginTop: 10 }}>
          This page is coming soon.
        </Text>
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
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={index} style={{ fontWeight: "bold" }}>
              {part.slice(2, -2)}
            </Text>
          );
        } else if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <Text key={index} style={{ fontStyle: "italic" }}>
              {part.slice(1, -1)}
            </Text>
          );
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
  isLoading,
  t,
}) => {
  const { settings, themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  const styles = React.useMemo(() => getStyles(THEME), [THEME]);
  return (
  <View style={{ width: "100%", maxWidth: 600, position: "relative" }}>
    {/* Small Inline Popup Menu */}
    {filterModalVisible && (
      <View style={styles.inlineFilterPopup}>
        <TouchableOpacity
          style={styles.inlineFilterOption}
          onPress={() => {
            setActiveFilter("all");
            setFilterModalVisible(false);
          }}
        >
          <Ionicons
            name="apps-outline"
            size={16}
            color={activeFilter === "all" ? "#5E9ED6" : THEME.text}
            style={{
              marginRight: 10,
              opacity: activeFilter === "all" ? 1 : 0.7,
            }}
          />
          <Text
            style={[
              styles.inlineFilterOptionText,
              activeFilter === "all" && styles.inlineFilterOptionTextActive,
            ]}
          >
            {t("everything")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineFilterOption}
          onPress={() => {
            setActiveFilter("quran");
            setFilterModalVisible(false);
          }}
        >
          <FontAwesome5
            name="quran"
            size={14}
            color={activeFilter === "quran" ? "#5E9ED6" : THEME.text}
            style={{
              marginRight: 10,
              opacity: activeFilter === "quran" ? 1 : 0.7,
            }}
          />
          <Text
            style={[
              styles.inlineFilterOptionText,
              activeFilter === "quran" && styles.inlineFilterOptionTextActive,
            ]}
          >
            {t("quran_only")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineFilterOption}
          onPress={() => {
            setActiveFilter("hadith");
            setFilterModalVisible(false);
          }}
        >
          <FontAwesome5
            name="book"
            size={14}
            color={activeFilter === "hadith" ? "#5E9ED6" : THEME.text}
            style={{
              marginRight: 10,
              opacity: activeFilter === "hadith" ? 1 : 0.7,
            }}
          />
          <Text
            style={[
              styles.inlineFilterOptionText,
              activeFilter === "hadith" && styles.inlineFilterOptionTextActive,
            ]}
          >
            {t("hadith_only")}
          </Text>
        </TouchableOpacity>
      </View>
    )}

    <View style={styles.searchContainer}>
      {activeFilter !== "all" && (
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(!filterModalVisible)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(94, 158, 214, 0.2)",
              paddingHorizontal: 25,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text
              style={{ color: "#5E9ED6", fontWeight: "bold", fontSize: 13 }}
            >
              {activeFilter === "quran" ? t("quran_only") : t("hadith_only")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => setFilterModalVisible(!filterModalVisible)}
          style={{ paddingRight: 12 }}
        >
          <Text
            style={[
              styles.plusIcon,
              activeFilter !== "all" && { color: "#5E9ED6" },
            ]}
          >
            +
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.searchInput,
            { flex: 1, minHeight: 24, maxHeight: 100, padding: 0 },
          ]}
          placeholder={messagesLength === 0 ? t("ask_anything") : t("reply")}
          placeholderTextColor="#8baeb4"
          value={query}
          onChangeText={setQuery}
          multiline={true}
        />
        <TouchableOpacity
          style={[styles.sendButton, { paddingLeft: 10 }]}
          onPress={sendMessage}
          disabled={isLoading}
        >
          <Ionicons name="arrow-forward" size={24} color={THEME.text} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
  );
};

// --- Main Chat Screen ---
function HomeScreen({ navigation }) {
  const { settings, themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  const styles = React.useMemo(() => getStyles(THEME), [THEME]);
  const { t, i18n } = useTranslation();
  const scrollViewRef = useRef(null);
  const messagePositions = useRef({});
  const lastMessageCount = useRef(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const { sessions, currentSessionId, updateSessionMessages } =
    useContext(ChatContext);

  // Derive current messages
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  useEffect(() => {
    // When a new message pair is added (User + AI blank state)
    if (messages.length > 0 && messages.length > lastMessageCount.current) {
      lastMessageCount.current = messages.length;

      // Find the index of the latest user message
      let latestUserIdx = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          latestUserIdx = i;
          break;
        }
      }

      if (latestUserIdx !== -1) {
        // Wait a brief moment for the layout to calculate
        setTimeout(() => {
          const yPos = messagePositions.current[latestUserIdx];
          if (yPos !== undefined && scrollViewRef.current) {
            // Scroll to the user's question, minus some padding so it sits just under the header
            scrollViewRef.current.scrollTo({
              y: Math.max(0, yPos - 20),
              animated: true,
            });
          }
        }, 150);
      }
    }
  }, [messages.length]);

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'quran', 'hadith'

  // Modal state
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [currentSources, setCurrentSources] = useState([]);

  // Filter Modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const sendMessage = async () => {
    if (!query.trim()) return;
    const userText = query.trim();
    setQuery("");

    // Capture history before we add the new message
    const currentHistory = messages.slice(-6);

    // Create new array to immediately reflect user message
    const newMessages = [...messages, { role: "user", text: userText }];
    updateSessionMessages(newMessages);
    setIsLoading(true);

    try {
      // NOTE: Replace this with your actual Render App URL
      const API_URL = "https://quranrag.onrender.com/chat";
      const response = await axios.post(API_URL, {
        query: userText,
        provider: "groq",
        filter: activeFilter,
        language: i18n.language,
        history: currentHistory,
      });

      let finalAnswer = response.data.answer || "";

      let cleanedAnswer = finalAnswer
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .trim();
      if (cleanedAnswer.includes("<think>")) {
        cleanedAnswer = cleanedAnswer.split("<think>")[0].trim();
      }

      if (!cleanedAnswer) {
        cleanedAnswer = finalAnswer;
      }

      finalAnswer = cleanedAnswer;

      updateSessionMessages([
        ...newMessages,
        { role: "ai", text: finalAnswer, sources: response.data.sources },
      ]);
    } catch (error) {
      console.error(error);
      updateSessionMessages([
        ...newMessages,
        {
          role: "ai",
          text: "Unable to connect to the server. Please check your internet connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    alert("Copied to clipboard!");
  };

  const showSources = (sources) => {
    if (!sources || sources.length === 0) {
      alert("No sources found for this response.");
      return;
    }
    setCurrentSources(sources);
    setSourcesModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {messages.length === 0 ? (
        // --- Landing Page View ---
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <View style={{ flex: 1 }}>
          {/* Top Bar (Non-floating) */}
          <View style={styles.header}>
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
                  source={require('./assets/custom_menu.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode='contain'
                />
              </View>

            </TouchableOpacity>
          </View>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ImageBackground
              source={require("./assets/Surant_name.png")}
              style={{
                width: 380,
                height: 130,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
              imageStyle={{ tintColor: THEME.gold }}
              resizeMode="contain"
            >
              <Text
                style={[
                  styles.greeting,
                  {
                    fontSize: i18n.language === "ur" ? 28 : 24,
                    width: "80%",
                    paddingHorizontal: 20,
                  },
                ]}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {t("greeting")}
              </Text>
            </ImageBackground>
          </View>

          {/* Floating Bottom Footer (Keyboard avoiding) */}
          <View style={{ width: "100%", position: "absolute", bottom: 0, zIndex: 10 }}>
            <LinearGradient
              colors={[
                `rgba(${THEME.bgRgb}, 0)`,
                `rgba(${THEME.bgRgb}, 0.9)`,
                `rgba(${THEME.bgRgb}, 1)`,
                `rgba(${THEME.bgRgb}, 1)`,
              ]}
              locations={[0, 0.3, 0.5, 1]}
              style={styles.floatingFooter}
            >
              {/* Filters */}
              <View
                style={[
                  styles.filtersContainer,
                  {
                    marginTop: 0,
                    marginBottom: 15,
                    alignItems: "flex-start",
                    width: "100%",
                    maxWidth: 600,
                    paddingHorizontal: 25,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    activeFilter === "quran" && styles.filterPillActive,
                  ]}
                  onPress={() =>
                    setActiveFilter(activeFilter === "quran" ? "all" : "quran")
                  }
                >
                  <FontAwesome5 name="quran" size={14} color={THEME.text} />
                  <Text style={styles.filterText}>{t("quran_only")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    activeFilter === "hadith" && styles.filterPillActive,
                  ]}
                  onPress={() =>
                    setActiveFilter(
                      activeFilter === "hadith" ? "all" : "hadith",
                    )
                  }
                >
                  <FontAwesome5 name="book" size={14} color={THEME.text} />
                  <Text style={styles.filterText}>{t("hadith_only")}</Text>
                </TouchableOpacity>
              </View>
              <SearchInputBar t={t}
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
          </View>
        </KeyboardAvoidingView>
      ) : (
        // --- Active Chat View ---
        // --- Active Chat View ---
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <View style={{ flex: 1 }}>
          {/* ScrollView is absolutely positioned to underlap everything */}
          <ScrollView
            ref={scrollViewRef}

            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: 80,
              paddingBottom: 110,
              paddingHorizontal: 15,
            }}
          >
            {messages.map((msg, idx) => {
              if (msg.role === "user") {
                return (
                  <View
                    key={idx}
                    style={styles.userBubble}
                    onLayout={(e) => {
                      messagePositions.current[idx] = e.nativeEvent.layout.y;
                    }}
                  >
                    <Text style={styles.bubbleText}>{msg.text}</Text>
                  </View>
                );
              } else {
                return (
                  <View key={idx} style={styles.aiContainer}>
                    <Text style={styles.aiText}>{msg.text}</Text>
                    {/* Action Icons Row */}
                    <View style={styles.aiActionRow}>
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => showSources(msg.sources)}
                      >
                        <Ionicons
                          name="library-outline"
                          size={16}
                          color="#8baeb4"
                        />
                        <Text style={styles.actionText}>{t("sources")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => copyToClipboard(msg.text)}
                      >
                        <Ionicons
                          name="copy-outline"
                          size={16}
                          color="#8baeb4"
                        />
                        <Text style={styles.actionText}>{t("copy")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
            })}
            {isLoading && (
              <ActivityIndicator
                color={THEME.text}
                style={{ marginVertical: 20 }}
              />
            )}
          </ScrollView>

          {/* Floating Top Header */}
          <LinearGradient
            colors={[
              `rgba(${THEME.bgRgb}, 1)`,
              `rgba(${THEME.bgRgb}, 0.8)`,
              `rgba(${THEME.bgRgb}, 0)`,
            ]}
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
                  source={require('./assets/custom_menu.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode='contain'
                />
              </View>

            </TouchableOpacity>
          </LinearGradient>

          {/* Floating Bottom Footer (Keyboard avoiding) */}
          <View style={{ width: "100%", position: "absolute", bottom: 0, zIndex: 10 }}>
            <LinearGradient
              colors={[
                `rgba(${THEME.bgRgb}, 0)`,
                `rgba(${THEME.bgRgb}, 0.9)`,
                `rgba(${THEME.bgRgb}, 1)`,
                `rgba(${THEME.bgRgb}, 1)`,
              ]}
              locations={[0, 0.3, 0.5, 1]}
              style={styles.floatingFooter}
            >
              <SearchInputBar t={t}
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
          </View>
        </KeyboardAvoidingView>
      )}
      {/* Sources Modal */}
      <Modal
        visible={sourcesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSourcesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("references_sources")}</Text>
              <TouchableOpacity onPress={() => setSourcesModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {currentSources.map((src, idx) => (
                <View key={idx} style={styles.sourceItem}>
                  <Text style={styles.sourceTitle}>
                    {src.source === "Quran"
                      ? `Surah ${src.metadata.surah}, Ayah ${src.metadata.ayah}`
                      : `${src.metadata.book || "Hadith"} - No. ${src.metadata.idInBook || src.metadata.number || "Unknown"}`}
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

// Helper to parse basic markdown (**bold** and *italic*)
const renderMarkdown = (text, textStyle) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <Text key={index} style={[textStyle, { fontWeight: "bold" }]}>
          {part.slice(2, -2)}
        </Text>
      );
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <Text key={index} style={[textStyle, { fontStyle: "italic" }]}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return (
      <Text key={index} style={textStyle}>
        {part}
      </Text>
    );
  });
};


import { SettingsProvider, SettingsContext } from "./utils/SettingsContext";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

function DrawerNavigator() {
  const { settings, themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: THEME.bg, width: 280 },
        swipeEnabled: false,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          swipeEnabled: true,
          swipeEdgeWidth: Dimensions.get("window").width,
          swipeMinDistance: 20,
        }}
      />
      <Drawer.Screen
        name="ReadQuran"
        component={QuranScreen}
        options={{ swipeEnabled: false }}
      />
      <Drawer.Screen
        name="ReadHadiths"
        component={HadithScreen}
        options={{ swipeEnabled: false }}
      />
      <Drawer.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{ swipeEnabled: false }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  let [fontsLoaded] = useFonts({ GreatVibes_400Regular });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ChatProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, presentation: "modal" }}>
              <Stack.Screen name="Drawer" component={DrawerNavigator} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ChatProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const getStyles = (THEME) => StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  greeting: {
    fontWeight: "bold",
    color: THEME.text,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "column",
    backgroundColor: THEME.inputBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    width: "100%",
    maxWidth: 600,
    alignItems: "stretch",
    paddingHorizontal: 25,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: THEME.text,
    fontSize: 16,
    outlineStyle: "none",
  },
  sendButton: { padding: 5 },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: { backgroundColor: THEME.active },
  filterText: {
    color: THEME.text,
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 13,
  },

  // Chat View Styles
  chatArea: { flex: 1 },
  userBubble: {
    backgroundColor: THEME.userBubble,
    alignSelf: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    maxWidth: "80%",
    marginBottom: 20,
  },
  bubbleText: { color: THEME.text, fontSize: 15, lineHeight: 22, fontWeight: "400" },

  aiContainer: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    marginBottom: 25,
    paddingLeft: 0,
    paddingRight: 5,
  },
  aiText: { color: THEME.text, fontSize: 15, lineHeight: 24, fontWeight: "400" },
  aiActionRow: { flexDirection: "row", marginTop: 12 },
  actionIcon: { flexDirection: "row", alignItems: "center", marginRight: 20 },
  actionText: {
    color: "#8baeb4",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },

  floatingHeader: {
    zIndex: 10,
    position: "absolute",
    top: 0,
    width: "100%",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 20, // push down slightly for safe area
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  floatingFooter: {
    width: "100%",
    padding: 15,
    alignItems: "center",
    backgroundColor: "transparent",
  },

  bottomSearchContainer: {
    padding: 15,
    backgroundColor: THEME.bg,
    alignItems: "center",
  },

  // Search Input Additions
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    justifyContent: "center",
  },
  modeIndicatorText: {
    color: "#5E9ED6",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 5,
  },
  plusIcon: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: "bold",
  }, // Removed lineHeight and adjusted top margin for perfect center alignment

  inlineFilterPopup: {
    position: "absolute",
    bottom: 75,
    left: 35, // Pushed slightly right to align with text
    backgroundColor: THEME.inputBg,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    padding: 10,
    width: 170, // Slightly wider to fit icons
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  inlineFilterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  inlineFilterOptionText: { color: THEME.text, fontSize: 16, opacity: 0.8 },
  inlineFilterOptionTextActive: {
    opacity: 1,
    fontWeight: "bold",
    color: "#5E9ED6",
  },

  // Drawer Styles
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  drawerTitle: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 12,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  drawerItemActive: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: THEME.active,
  },
  drawerIcon: { width: 30, textAlign: "center" },
  drawerItemText: { color: THEME.text, fontSize: 16, fontWeight: "600" },
  recentSection: { marginTop: 40, paddingHorizontal: 15 },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  recentTitle: { color: THEME.text, fontSize: 16, fontWeight: "bold" },
  recentItem: {
    color: THEME.text,
    fontSize: 14,
    marginVertical: 10,
    opacity: 0.9,
  },
  drawerFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 25,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: THEME.bg,
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { color: THEME.text, fontSize: 20, fontWeight: "bold" },
  sourceItem: {
    backgroundColor: THEME.inputBg,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sourceTitle: { color: THEME.text, fontWeight: "bold", marginBottom: 5 },
  sourceText: { color: THEME.text, opacity: 0.9, lineHeight: 22 },
  filterOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.inputBg,
  },
  filterOptionText: { color: THEME.text, fontSize: 18, opacity: 0.7 },
  filterOptionTextActive: { opacity: 1, fontWeight: "bold", color: "#68b2c2" },
});
