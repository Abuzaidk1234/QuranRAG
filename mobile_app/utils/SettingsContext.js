import React, { createContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export const SettingsContext = createContext();

export const DARK_THEME = {
  bg: "#021217",
  bgRgb: "2, 18, 23",
  surface: "#0a2630",
  inputBg: "#051d25",
  text: "#e0e0e0",
  textMuted: "#6a8c93",
  accent: "#3ca59d",
  gold: "#cba153",
  active: "#0c2c36",
  userBubble: "#08262e",
  aiBubble: "#010d10",
};

export const LIGHT_THEME = {
  bg: "#0c4452",
  bgRgb: "12, 68, 82",
  surface: "#346671",
  inputBg: "#1a505e",
  text: "#ffffff",
  textMuted: "#8baeb4",
  accent: "#3ca59d",
  gold: "#cba153",
  active: "#275862",
  userBubble: "#1b5b69",
  aiBubble: "#08333e",
};

export const SettingsProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState({
    arabicFontSize: 28,
    translationFontSize: 16,
    showTranslation: true,
    showArabic: true,
    arabicScript: "uthmani",
    theme: "system",
    dailyReminder: false,
    jumuahReminder: false,
    googleConnected: false,
    googleAccessToken: null,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem("app_settings");
        if (stored) {
          setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    loadSettings();
  }, []);

  const updateSetting = async (key, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      AsyncStorage.setItem("app_settings", JSON.stringify(newSettings)).catch(
        (e) => console.error("Failed to save settings", e)
      );
      return newSettings;
    });
  };

  const themeColors = useMemo(() => {
    if (settings.theme === "dark") return DARK_THEME;
    if (settings.theme === "light") return LIGHT_THEME;
    // system
    return systemColorScheme === "dark" ? DARK_THEME : LIGHT_THEME;
  }, [settings.theme, systemColorScheme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, themeColors }}>
      {children}
    </SettingsContext.Provider>
  );
};
