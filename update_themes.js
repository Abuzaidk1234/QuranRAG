const fs = require('fs');
let content = fs.readFileSync('mobile_app/utils/SettingsContext.js', 'utf8');

const newThemes = `export const DARK_THEME = {
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
};`;

content = content.replace(/export const DARK_THEME = \{[\s\S]*?export const LIGHT_THEME = \{[\s\S]*?\};/, newThemes);

fs.writeFileSync('mobile_app/utils/SettingsContext.js', content, 'utf8');
