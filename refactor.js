const fs = require('fs');
let content = fs.readFileSync('mobile_app/screens/QuranScreen.js', 'utf8');

// Remove THEME constant
content = content.replace(/const THEME = \{\s*bg:[^\}]+\};\s*/s, '');

// Change styles
content = content.replace(/const styles = StyleSheet\.create\(\{/s, 'const getStyles = (THEME) => StyleSheet.create({');

// Add to SurahPageView props
content = content.replace(/const SurahPageView = React\.memo\(\s*\(\{\s*/s, 'const SurahPageView = React.memo(({ THEME, styles, ');

// Add to JuzPageView props
content = content.replace(/const JuzPageView = React\.memo\(\s*\(\{\s*/s, 'const JuzPageView = React.memo(({ THEME, styles, ');

// Extract THEME in QuranScreen component
content = content.replace(/export default function QuranScreen\(\{ navigation \}\) \{/s, 'export default function QuranScreen({ navigation }) {\n  const { themeColors } = React.useContext(SettingsContext);\n  const THEME = themeColors;\n  const styles = React.useMemo(() => getStyles(THEME), [THEME]);');

// Pass THEME to SurahPageView instances
content = content.replace(/<SurahPageView\s+/g, '<SurahPageView THEME={THEME} styles={styles} ');

// Pass THEME to JuzPageView instances
content = content.replace(/<JuzPageView\s+/g, '<JuzPageView THEME={THEME} styles={styles} ');

// LinearGradient colors 
content = content.replace(/colors=\{\[\s*\"rgba\(12,\s*68,\s*82,\s*1\)\",\s*\"rgba\(12,\s*68,\s*82,\s*1\)\",\s*\"rgba\(12,\s*68,\s*82,\s*1\)\",\s*\]\}/s, 'colors={[THEME.bg, THEME.bg, THEME.bg]}');

fs.writeFileSync('mobile_app/screens/QuranScreen.js', content, 'utf8');
