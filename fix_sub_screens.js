const fs = require('fs');

// 1. QuranScreen.js
let quran = fs.readFileSync('mobile_app/screens/QuranScreen.js', 'utf8');
quran = quran.replace(/backgroundColor: "#0c4452"/g, 'backgroundColor: "transparent"');
quran = quran.replace(/borderBottomColor: "#1a505e"/g, 'borderBottomColor: "transparent"'); // If transparent, border looks bad. Let's make it transparent.
quran = quran.replace(/color: "#ffffff"/g, 'color: THEME.text');
fs.writeFileSync('mobile_app/screens/QuranScreen.js', quran, 'utf8');

// 2. BookmarksScreen.js
let bookmarks = fs.readFileSync('mobile_app/screens/BookmarksScreen.js', 'utf8');
bookmarks = bookmarks.replace(/borderBottomColor: "#1a505e"/g, 'borderBottomColor: THEME.inputBg');
fs.writeFileSync('mobile_app/screens/BookmarksScreen.js', bookmarks, 'utf8');

// 3. HadithScreen.js
let hadith = fs.readFileSync('mobile_app/screens/HadithScreen.js', 'utf8');
hadith = hadith.replace(/"rgba\(12,\s*68,\s*82,\s*1\)"/g, '`rgba(${THEME.bgRgb}, 1)`');
hadith = hadith.replace(/"rgba\(12,\s*68,\s*82,\s*0\.9\)"/g, '`rgba(${THEME.bgRgb}, 0.9)`');
hadith = hadith.replace(/"rgba\(12,\s*68,\s*82,\s*0\)"/g, '`rgba(${THEME.bgRgb}, 0)`');
fs.writeFileSync('mobile_app/screens/HadithScreen.js', hadith, 'utf8');

// What about SettingsScreen.js? Does it have any hardcoded hex?
