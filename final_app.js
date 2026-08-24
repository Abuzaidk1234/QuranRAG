const fs = require('fs');
let content = fs.readFileSync('mobile_app/App.js', 'utf8');

const startIndex = content.indexOf('export default function App() {');

const newAppCode = `
import { SettingsProvider, SettingsContext } from "./utils/SettingsContext";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

function DrawerNavigator() {
  const { themeColors } = React.useContext(SettingsContext);
  const THEME = themeColors;
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: THEME.bg, width: 280 },
        swipeEnabled: false,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          swipeEnabled: true,
          swipeEdgeWidth: Dimensions.get("window").width,
          swipeMinDistance: 20,
        }}
      />
      <Drawer.Screen
        name="ReadQuran"
        component={QuranScreen}
        options={{ swipeEnabled: false }}
      />
      <Drawer.Screen
        name="ReadHadiths"
        component={HadithScreen}
        options={{ swipeEnabled: false }}
      />
      <Drawer.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{ swipeEnabled: false }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  let [fontsLoaded] = useFonts({ GreatVibes_400Regular });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ChatProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, presentation: "modal" }}>
              <Stack.Screen name="Drawer" component={DrawerNavigator} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ChatProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
`;

content = content.substring(0, startIndex) + newAppCode;

content = content.replace(/function HomeScreen\(\{ navigation \}\) \{/s, 'function HomeScreen({ navigation }) {\n  const { themeColors } = React.useContext(SettingsContext);\n  const THEME = themeColors;\n  const styles = React.useMemo(() => getStyles(THEME), [THEME]);');

content = content.replace(/function AppContent\(\{ navigation \}\) \{/s, ''); // Delete if it was there

fs.writeFileSync('mobile_app/App.js', content, 'utf8');
