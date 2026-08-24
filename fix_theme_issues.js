const fs = require('fs');

// 1. app.json
let appJson = fs.readFileSync('mobile_app/app.json', 'utf8');
appJson = appJson.replace(/"userInterfaceStyle":\s*"light"/, '"userInterfaceStyle": "automatic"');
fs.writeFileSync('mobile_app/app.json', appJson, 'utf8');

// 2. QuranScreen.js
let quranContent = fs.readFileSync('mobile_app/screens/QuranScreen.js', 'utf8');
quranContent = quranContent.replace(
  /colors=\{\[THEME\.bg, THEME\.bg, THEME\.bg\]\}/g,
  'colors={[`rgba(${THEME.bgRgb}, 1)`, `rgba(${THEME.bgRgb}, 0.9)`, `rgba(${THEME.bgRgb}, 0)`]}'
);
fs.writeFileSync('mobile_app/screens/QuranScreen.js', quranContent, 'utf8');

// 3. HadithScreen.js
let hadithContent = fs.readFileSync('mobile_app/screens/HadithScreen.js', 'utf8');
hadithContent = hadithContent.replace(
  /colors=\{\[\s*"rgba\(12,\s*68,\s*82,\s*1\)",\s*"rgba\(12,\s*68,\s*82,\s*0\.9\)",\s*"rgba\(12,\s*68,\s*82,\s*0\)"\s*\]\}/g,
  'colors={[`rgba(${THEME.bgRgb}, 1)`, `rgba(${THEME.bgRgb}, 0.9)`, `rgba(${THEME.bgRgb}, 0)`]}'
);
fs.writeFileSync('mobile_app/screens/HadithScreen.js', hadithContent, 'utf8');

console.log("Fixes applied!");
