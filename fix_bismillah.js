const fs = require('fs');

const replacementApp = `
              <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#0c4452',
                  borderWidth: 2,
                  borderColor: 'rgba(0, 0, 0, 0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
              }}>
                <Image
                  source={require('./assets/custom_menu.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode='contain'
                />
              </View>
`;

const replacementSub = `
              <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#0c4452',
                  borderWidth: 2,
                  borderColor: 'rgba(0, 0, 0, 0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
              }}>
                <Image
                  source={require('../assets/custom_menu.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode='contain'
                />
              </View>
`;

let app = fs.readFileSync('mobile_app/App.js', 'utf8');
app = app.replace(/<Image\s*source=\{require\("\.\/assets\/custom_menu\.png"\)\}\s*style=\{\{\s*width:\s*40,\s*height:\s*40\s*\}\}\s*resizeMode="contain"\s*\/>/g, replacementApp);
app = app.replace(/<View\s*style=\{\{\s*position:\s*"absolute",\s*backgroundColor:\s*"#346671",\s*width:\s*36,\s*height:\s*36,\s*borderRadius:\s*18,\s*\}\}\s*\/>/g, '');
fs.writeFileSync('mobile_app/App.js', app, 'utf8');

['QuranScreen.js', 'HadithScreen.js', 'BookmarksScreen.js'].forEach(file => {
  let path = `mobile_app/screens/${file}`;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/<Image\s*source=\{require\("\.\.\/assets\/custom_menu\.png"\)\}\s*style=\{\{\s*width:\s*40,\s*height:\s*40\s*\}\}\s*resizeMode="contain"\s*\/>/g, replacementSub);
  fs.writeFileSync(path, content, 'utf8');
});
