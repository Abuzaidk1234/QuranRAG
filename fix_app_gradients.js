const fs = require('fs');

let content = fs.readFileSync('mobile_app/App.js', 'utf8');

// Replace all hardcoded '12, 68, 82' with '${THEME.bgRgb}' inside template literals!
// Wait, currently they are strings: "rgba(12, 68, 82, 1)". We need to change to backticks: `rgba(${THEME.bgRgb}, 1)`

content = content.replace(/"rgba\(12,\s*68,\s*82,\s*0\)"/g, '`rgba(${THEME.bgRgb}, 0)`');
content = content.replace(/"rgba\(12,\s*68,\s*82,\s*0\.8\)"/g, '`rgba(${THEME.bgRgb}, 0.8)`');
content = content.replace(/"rgba\(12,\s*68,\s*82,\s*0\.9\)"/g, '`rgba(${THEME.bgRgb}, 0.9)`');
content = content.replace(/"rgba\(12,\s*68,\s*82,\s*1\)"/g, '`rgba(${THEME.bgRgb}, 1)`');

fs.writeFileSync('mobile_app/App.js', content, 'utf8');
