const fs = require('fs');
let content = fs.readFileSync('mobile_app/screens/QuranScreen.js', 'utf8');
content = content.replace(/borderBottomColor: "transparent"/g, 'borderBottomColor: THEME.inputBg');
fs.writeFileSync('mobile_app/screens/QuranScreen.js', content, 'utf8');
