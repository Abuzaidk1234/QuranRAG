const fs = require('fs');
let content = fs.readFileSync('mobile_app/screens/QuranScreen.js', 'utf8');

content = content.replace(/toggleBtn: \{\s*flex: 1,\s*paddingVertical: 10,\s*alignItems: "center",\s*borderBottomWidth: 2,\s*borderBottomColor: THEME.inputBg,\s*\}/g, 'toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" }');

content = content.replace(/floatingHeader: \{\s*zIndex: 10,\s*position: "absolute",\s*top: 0,\s*width: "100%",\s*paddingTop: Platform.OS === "ios" \? 50 : 50,\s*backgroundColor: "transparent",\s*borderBottomWidth: 1,\s*borderBottomColor: THEME\.inputBg,\s*\}/g, 'floatingHeader: { zIndex: 10, position: "absolute", top: 0, width: "100%", paddingTop: Platform.OS === "ios" ? 50 : 50, backgroundColor: "transparent", borderBottomWidth: 0, borderBottomColor: "transparent" }');

fs.writeFileSync('mobile_app/screens/QuranScreen.js', content, 'utf8');
