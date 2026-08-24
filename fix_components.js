const fs = require('fs');
let content = fs.readFileSync('mobile_app/App.js', 'utf8');

// Update PlaceholderScreen
content = content.replace(/function PlaceholderScreen\(\{ route, navigation \}\) \{/, 'function PlaceholderScreen({ route, navigation }) {\n  const { themeColors } = React.useContext(SettingsContext);\n  const THEME = themeColors;\n  const styles = React.useMemo(() => getStyles(THEME), [THEME]);');

// Update SearchInputBar
content = content.replace(
/const SearchInputBar = \(\{\s*filterModalVisible,\s*setFilterModalVisible,\s*activeFilter,\s*setActiveFilter,\s*query,\s*setQuery,\s*messagesLength,\s*sendMessage,\s*isLoading,\s*t,\s*\}\) => \(/,
`const SearchInputBar = ({
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
  const { themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  const styles = React.useMemo(() => getStyles(THEME), [THEME]);
  return (`
);

content = content.replace(/    <\/View>\r?\n  <\/View>\r?\n\);\r?\n\r?\n\/\/ --- Main Chat Screen ---/, '    </View>\n  </View>\n  );\n};\n\n// --- Main Chat Screen ---');

fs.writeFileSync('mobile_app/App.js', content, 'utf8');
