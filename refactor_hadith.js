const fs = require('fs');
let content = fs.readFileSync('mobile_app/screens/HadithScreen.js', 'utf8');

// Remove THEME constant
content = content.replace(/const THEME = \{\s*bg:[^\}]+\};\s*/s, '');

// Change styles
content = content.replace(/const styles = StyleSheet\.create\(\{/s, 'const getStyles = (THEME) => StyleSheet.create({');

// Extract THEME in HadithScreen component
content = content.replace(/export default function HadithScreen\(\{ navigation \}\) \{/s, 'export default function HadithScreen({ navigation }) {\n  const { themeColors } = React.useContext(SettingsContext);\n  const THEME = themeColors;\n  const styles = React.useMemo(() => getStyles(THEME), [THEME]);');

fs.writeFileSync('mobile_app/screens/HadithScreen.js', content, 'utf8');
