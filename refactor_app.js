const fs = require('fs');
let content = fs.readFileSync('mobile_app/App.js', 'utf8');

// Remove THEME constant
content = content.replace(/const THEME = \{\s*bg:[^\}]+\};\s*/s, '');

// Change styles
content = content.replace(/const styles = StyleSheet\.create\(\{/s, 'const getStyles = (THEME) => StyleSheet.create({');

// Extract THEME in AppContent component
content = content.replace(/function AppContent\(\{ navigation \}\) \{/s, 'function AppContent({ navigation }) {\n  const { themeColors } = React.useContext(SettingsContext);\n  const THEME = themeColors;\n  const styles = React.useMemo(() => getStyles(THEME), [THEME]);');

// Extract THEME in CustomDrawerContent component
content = content.replace(/function CustomDrawerContent\(props\) \{/s, 'function CustomDrawerContent(props) {\n  const { themeColors } = React.useContext(SettingsContext);\n  const THEME = themeColors;\n  const styles = React.useMemo(() => getStyles(THEME), [THEME]);');

// NavigationContainer
content = content.replace(/export default function App\(\) \{/s, 'export default function App() {\n');

// Make NavigationContainer dynamic by changing it inside SettingsProvider.
// Wait, actually since AppContent and CustomDrawerContent now use THEME dynamically, that's enough for colors.

fs.writeFileSync('mobile_app/App.js', content, 'utf8');
