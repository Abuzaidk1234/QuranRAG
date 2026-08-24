import re

with open('mobile_app/screens/SettingsScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_sections = """
        {/* Account & Backup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("account_backup")}</Text>
          
          <View style={styles.card}>
            <TouchableOpacity 
              style={[styles.toggleRow, { marginBottom: 15 }]}
              onPress={() => updateSetting("googleConnected", !settings.googleConnected)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="logo-google" size={24} color={settings.googleConnected ? THEME.gold : THEME.textMuted} style={{ marginRight: 10 }} />
                <Text style={styles.optionText}>{t("google_sign_in")}</Text>
              </View>
              <Text style={{ color: settings.googleConnected ? THEME.gold : THEME.textMuted, fontSize: 14 }}>
                {settings.googleConnected ? "Connected" : "Not Connected"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleRow, { opacity: settings.googleConnected ? 1 : 0.5 }]}
              disabled={!settings.googleConnected}
              onPress={() => alert("Syncing data to Google Drive...")}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cloud-upload-outline" size={24} color={THEME.text} style={{ marginRight: 10 }} />
                <Text style={styles.optionText}>{t("sync_now")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={THEME.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("notifications")}</Text>
          
          <View style={styles.card}>
            <View style={[styles.toggleRow, { marginBottom: 15 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="alarm-outline" size={24} color={THEME.text} style={{ marginRight: 10 }} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.optionText}>{t("daily_reminder")}</Text>
                  <Text style={{ color: THEME.textMuted, fontSize: 12, marginTop: 2 }}>Remind me to read after Fajr</Text>
                </View>
              </View>
              <Switch
                value={settings.dailyReminder}
                onValueChange={(val) => updateSetting("dailyReminder", val)}
                trackColor={{ false: "#767577", true: THEME.gold }}
                thumbColor={"#f4f3f4"}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="calendar-outline" size={24} color={THEME.text} style={{ marginRight: 10 }} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.optionText}>{t("jumuah_reminder")}</Text>
                  <Text style={{ color: THEME.textMuted, fontSize: 12, marginTop: 2 }}>Remind me to read Surah Al-Kahf on Fridays</Text>
                </View>
              </View>
              <Switch
                value={settings.jumuahReminder}
                onValueChange={(val) => updateSetting("jumuahReminder", val)}
                trackColor={{ false: "#767577", true: THEME.gold }}
                thumbColor={"#f4f3f4"}
              />
            </View>
          </View>
        </View>
"""

content = re.sub(
    r'(</ScrollView>)',
    lambda m: new_sections + m.group(1),
    content
)

with open('mobile_app/screens/SettingsScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
