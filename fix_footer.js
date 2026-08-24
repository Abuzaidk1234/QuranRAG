const fs = require('fs');
let content = fs.readFileSync('mobile_app/App.js', 'utf8');

content = content.replace(/<View style=\{\{ width: "100%" \}\}>\s*<LinearGradient/g, '<View style={{ width: "100%", position: "absolute", bottom: 0, zIndex: 10 }}>\n            <LinearGradient');

fs.writeFileSync('mobile_app/App.js', content, 'utf8');
