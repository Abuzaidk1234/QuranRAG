const fs = require('fs');
const { execSync } = require('child_process');

// Get original App.js
const original = execSync('git show HEAD:mobile_app/App.js').toString();

// Extract styles
const match = original.match(/const styles = StyleSheet\.create\(\{[\s\S]*\}\);/);

if (match) {
  let stylesStr = match[0];
  stylesStr = stylesStr.replace('const styles = StyleSheet.create', 'const getStyles = (THEME) => StyleSheet.create');
  
  // Append to current App.js
  let current = fs.readFileSync('mobile_app/App.js', 'utf8');
  current += '\n' + stylesStr + '\n';
  fs.writeFileSync('mobile_app/App.js', current, 'utf8');
} else {
  console.log("Not found");
}
