const fs = require('fs');
let content = fs.readFileSync('mobile_app/screens/BookmarksScreen.js', 'utf8');

content = content.replace(/import \{ useTranslation \} from "react-i18next";/s, 'import { useTranslation } from "react-i18next";\nimport { SettingsContext } from "../utils/SettingsContext";');

content = content.replace(/const THEME = \{\s*bg:[^\}]+\};\s*/s, '');

content = content.replace(/const styles = StyleSheet\.create\(\{/s, 'const getStyles = (THEME) => StyleSheet.create({');

content = content.replace(/export default function BookmarksScreen\(\{ navigation \}\) \{/s, 'export default function BookmarksScreen({ navigation }) {\n  const { themeColors } = React.useContext(SettingsContext);\n  const THEME = themeColors;\n  const styles = React.useMemo(() => getStyles(THEME), [THEME]);');

content = content.replace(/colors=\{\[\s*\"rgba\(12,\s*68,\s*82,\s*1\)\",\s*\"rgba\(12,\s*68,\s*82,\s*0\.9\)\",\s*\"rgba\(12,\s*68,\s*82,\s*0\)\",\s*\]\}/s, 'colors={[`rgba(${THEME.bgRgb}, 1)`, `rgba(${THEME.bgRgb}, 0.9)`, `rgba(${THEME.bgRgb}, 0)`]}');

fs.writeFileSync('mobile_app/screens/BookmarksScreen.js', content, 'utf8');
