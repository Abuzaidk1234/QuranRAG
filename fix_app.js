const fs = require('fs');
let content = fs.readFileSync('mobile_app/App.js', 'utf8');

// Replace everything from `export default function App() {` to the end.
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
        component={AppContent}
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
        name="Bookmarks"
        component={BookmarksScreen}
        options={{ swipeEnabled: false }}
      />
      <Drawer.Screen
        name="Hadiths"
        component={HadithScreen}
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

// Wait, the original code had `name="Home" component={HomeScreen}` but my code said `AppContent`. Let's check original.
const oldApp = content.substring(startIndex);
let isAppContent = oldApp.includes('component={AppContent}');
// I will just use regex to replace the export default function App() { ... } with the new one.
